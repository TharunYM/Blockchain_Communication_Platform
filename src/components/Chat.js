import React, { useState, useEffect, useCallback } from 'react';
import MessageList from './MessageList';
import SendMessage from './SendMessage';
import { downloadFromIPFS } from '../services/ipfs';
import { decryptMessage } from '../services/encryption';
import { 
    listenForMessages, 
    markAsReadOnChain, 
    listenForReadReceipts
    // Removed setProfilePicOnChain, getProfilePicFromChain
} from '../services/blockchain';

const CONTACTS_STORAGE_KEY = 'secure-messenger-contacts';

// Helper to shorten addresses for display
const truncateAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

function Chat({ user }) {
    const [messages, setMessages] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [readStatusMap, setReadStatusMap] = useState(new Map());
    
    // UI States
    const [activeContact, setActiveContact] = useState(null);
    const [showMenu, setShowMenu] = useState(false);

    // Profile Pic States (REMOVED) - no longer needed

    // Load contacts on component mount or user change
    useEffect(() => {
        const loadContacts = () => {
            const storedContacts = localStorage.getItem(CONTACTS_STORAGE_KEY);
            if (storedContacts) {
                setContacts(JSON.parse(storedContacts));
            }
        };
        loadContacts();
    }, [user.account]);

    // --- Actions ---

    const addContact = async () => {
        const address = prompt("Enter Ethereum Address:");
        const name = prompt("Enter Name:");
        if (name && address) {
            if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
                alert("Invalid Ethereum Address format.");
                return;
            }
            if (contacts.some(c => c.address.toLowerCase() === address.toLowerCase())) {
                alert("Contact already exists.");
                return;
            }

            const newContactsList = [...contacts, { name, address }];
            setContacts(newContactsList);
            localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(newContactsList));
        }
    };

    const deleteContact = () => {
        if (!activeContact) return;
        if (window.confirm(`Are you sure you want to delete ${activeContact.name}?`)) {
            const updatedContacts = contacts.filter(c => c.address !== activeContact.address);
            setContacts(updatedContacts);
            localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(updatedContacts));
            setActiveContact(null);
            setShowMenu(false);
        }
    };

    const clearChat = () => {
        if (!activeContact) return;
        if (window.confirm("Clear all messages in this chat? (This only affects your view)")) {
            setMessages(prev => prev.filter(msg => {
                const otherParty = msg.direction === 'sent' ? msg.receiver : msg.sender;
                return otherParty.toLowerCase() !== activeContact.address.toLowerCase();
            }));
            setShowMenu(false);
        }
    };

    // --- Message Handling Callbacks ---

    const handleNewMessage = useCallback(async (eventData) => {
        const { sender, receiver, ipfsHash } = eventData;
        const myAddress = user.account.toLowerCase();

        if (sender.toLowerCase() !== myAddress && receiver.toLowerCase() !== myAddress) return;
        if (messages.some(msg => msg.ipfsHash === ipfsHash)) return;

        console.log("Processing message with IPFS hash:", ipfsHash);
        
        const encryptedString = await downloadFromIPFS(ipfsHash);
        if (!encryptedString) return;
            
        const decryptedPayload = await decryptMessage(user.identity.privateKey, encryptedString);
        if (!decryptedPayload) return;

        const direction = sender.toLowerCase() === myAddress ? 'sent' : 'received';

        if (direction === 'received') {
            await markAsReadOnChain(ipfsHash);
        }
        
        setMessages(prev => [...prev, { 
            ...eventData, 
            ...decryptedPayload,
            isDecrypted: true, 
            direction 
        }]);
    }, [user.account, user.identity.privateKey, messages]);

    // --- Blockchain Event Listeners ---
    useEffect(() => {
        const unsubscribe = listenForReadReceipts((ipfsHash) => {
            setReadStatusMap(prev => new Map(prev).set(ipfsHash, "read"));
        });
        return () => unsubscribe();
    }, []);
    
    useEffect(() => {
        const unsubscribe = listenForMessages(handleNewMessage);
        return () => unsubscribe();
    }, [handleNewMessage]);

    const handleContactSelect = (contact) => {
        setActiveContact(contact);
        setShowMenu(false);
    };

    const activeMessages = messages
        .filter(msg => {
            if (!activeContact) return false;
            const otherParty = msg.direction === 'sent' ? msg.receiver : msg.sender;
            return otherParty.toLowerCase() === activeContact.address.toLowerCase();
        })
        .sort((a, b) => a.timestamp - b.timestamp);

    return (
        <div className="App">
            {/* --- LEFT SIDEBAR (Contact List) --- */}
            <div className="sidebar">
                <div className="sidebar-header">
                    <div style={{display:'flex', alignItems:'center'}}>
                         {/* My Profile Avatar (First letter only) */}
                         <div className="avatar" style={{backgroundColor:'#4a148c'}}>You</div>
                         <h3 title={user.account}>My Profile</h3>
                    </div>
                    <button className="add-contact-btn" onClick={addContact} title="Add New Contact">+</button>
                </div>
                
                <div className="contact-list">
                    {contacts.length === 0 && (
                        <p style={{textAlign:'center', color:'#999', marginTop:20, fontSize:'0.9rem'}}>No contacts yet.<br/>Click + to add one.</p>
                    )}
                    {contacts.map(contact => (
                        <div 
                            key={contact.address} 
                            className={`contact-item ${activeContact?.address === contact.address ? 'active' : ''}`}
                            onClick={() => handleContactSelect(contact)}
                        >
                            {/* Contact's Avatar (first letter) */}
                            <div className="avatar">
                                {contact.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="contact-info">
                                <h4>{contact.name}</h4>
                                <p>{truncateAddress(contact.address)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- RIGHT CHAT WINDOW --- */}
            <div className="chat-window">
                {activeContact ? (
                    <>
                        {/* 1. Active Chat Header */}
                        <div className="chat-header">
                            {/* Active Contact's Avatar (first letter) */}
                            <div className="avatar">
                                {activeContact.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="chat-header-info">
                                <h4>{activeContact.name}</h4>
                                <p>{truncateAddress(activeContact.address)}</p>
                            </div>
                            
                            {/* --- 3-DOTS OPTIONS MENU --- */}
                            <div className="header-right">
                                <button 
                                    className="menu-btn" 
                                    onClick={() => setShowMenu(!showMenu)}
                                    title="Chat Options"
                                >
                                    &#8942;
                                </button>

                                {showMenu && (
                                    <div className="dropdown-menu">
                                        <div className="dropdown-item" onClick={clearChat}>
                                            Clear Chat
                                        </div>
                                        <div className="dropdown-item danger" onClick={deleteContact}>
                                            Delete Contact
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Message List Area */}
                        <MessageList 
                            messages={activeMessages} 
                            readStatusMap={readStatusMap}
                        />

                        {/* 3. Message Input Area */}
                        <SendMessage 
                            receiverAddress={activeContact.address} 
                        />
                    </>
                ) : (
                    /* Empty State: No contact selected */
                    <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100%', flexDirection:'column', color: '#667781'}}>
                        <h2>BLOCKTALK</h2>
                        <p>Select a contact to start messaging securely.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Chat;