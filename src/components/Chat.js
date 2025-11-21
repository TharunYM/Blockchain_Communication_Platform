import React, { useState, useEffect, useCallback } from 'react';
import MessageList from './MessageList';
import SendMessage from './SendMessage';
import { downloadFromIPFS } from '../services/ipfs';
import { decryptMessage } from '../services/encryption';
import { 
    listenForMessages, 
    markAsReadOnChain, 
    listenForReadReceipts
} from '../services/blockchain';

const CONTACTS_STORAGE_KEY = 'secure-messenger-contacts';

// Helper to shorten addresses for display
const truncateAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// UPDATED: Accepting 'account', 'contract', and 'web3' props
function Chat({ user, account, contract, web3 }) {
    const [messages, setMessages] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [readStatusMap, setReadStatusMap] = useState(new Map());
    
    // UI States
    const [activeContact, setActiveContact] = useState(null);
    const [showMenu, setShowMenu] = useState(false);

    // Load contacts on component mount
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

    // 1. COPY ADDRESS FUNCTION
    const copyAddress = () => {
        const addressToCopy = account || user.account;
        if (addressToCopy) {
            navigator.clipboard.writeText(addressToCopy);
            // alert("Address copied!"); // Optional: Commented out to be less annoying
        }
    };

    // 2. NEW: FORCE REGISTER FUNCTION (The Fix)
    const forceRegister = async () => {
        if (!contract || !account) {
            alert("Blockchain not connected. Please wait or refresh.");
            return;
        }

        // Check if we have the local public key
        const publicKey = user?.identity?.publicKey;
        if (!publicKey) {
            alert("Error: Local Public Key missing. Please logout and login again.");
            return;
        }

        const confirmReg = window.confirm("Register your Public Key on the Blockchain? (This requires a small gas fee)");
        if (!confirmReg) return;

        try {
            const name = user.name || "Unknown";
            console.log("Registering User:", name, publicKey);
            
            // Call the Smart Contract
            // We assume the function is named 'registerUser' (standard for this project type)
            // The contract only asks for the PublicKey, not the Name
await contract.methods.registerPublicKey(publicKey).send({ from: account });
            
            alert("✅ Registration Successful! You can now receive messages.");
        } catch (error) {
            console.error("Registration Error:", error);
            alert("Registration Failed: " + (error.message || error));
        }
    };

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
                    <div style={{display:'flex', alignItems:'center', gap: '10px'}}>
                         {/* My Profile Avatar */}
                         <div className="avatar" style={{backgroundColor:'#4a148c'}}>You</div>
                         
                         {/* Profile Info & Copy Address */}
                         <div style={{display:'flex', flexDirection:'column'}}>
                             <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
                                <h3 title={user.account} style={{margin:0, fontSize:'1rem'}}>My Profile</h3>
                                
                                {/* FORCE REGISTER BUTTON */}
                                <button 
                                    onClick={forceRegister}
                                    title="Register your Public Key on Blockchain (Required to receive messages)"
                                    style={{
                                        background: '#d32f2f',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        padding: '2px 4px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    REGISTER KEY
                                </button>
                             </div>
                             
                             {/* Wallet Address Display */}
                             <div className="wallet-info" style={{ 
                                 marginTop: '2px', 
                                 fontSize: '0.8rem', 
                                 color: '#423c3cff',
                                 fontWeight:'600',
                                 display: 'flex', 
                                 alignItems: 'center', 
                                 gap: '6px' 
                             }}>
                                 <span style={{opacity: 0.8}}>
                                     {account ? truncateAddress(account) : truncateAddress(user.account)}
                                 </span>
                                 <button 
                                     onClick={copyAddress} 
                                     title="Copy Full Address"
                                     style={{
                                         background: 'rgba(255,255,255,0.2)',
                                         border: 'none',
                                         borderRadius: '4px',
                                         cursor: 'pointer',
                                         fontSize: '1.2rem',
                                         padding: '2.1px 5.25px',
                                         color: '#8b7763ff'
                                     }}
                                 >
                                     📋
                                 </button>
                             </div>
                         </div>
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
                            <div className="avatar">
                                {activeContact.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="chat-header-info">
                                <h4>{activeContact.name}</h4>
                                <p>{truncateAddress(activeContact.address)}</p>
                            </div>
                            
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
                            contract={contract} 
                            account={account} 
                        />
                    </>
                ) : (
                    /* Empty State - UPDATED CLASS */
                    <div className="empty-chat-container">
                        <h2>BLOCKTALK</h2>
                        <p>Select a contact to start messaging securely.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Chat;