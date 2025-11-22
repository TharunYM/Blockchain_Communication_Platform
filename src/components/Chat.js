import React, { useState, useEffect } from 'react';
import MessageList from './MessageList';
import SendMessage from './SendMessage';
import { fetchMessages } from '../services/api';

const CONTACTS_STORAGE_KEY = 'secure-messenger-contacts';

// Helper to mock truncation for usernames (optional if names are short)
const truncateName = (name) => {
    if (!name) return "";
    return name.length > 15 ? `${name.substring(0, 12)}...` : name;
};

function Chat({ user }) {
    const [messages, setMessages] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [readStatusMap, setReadStatusMap] = useState(new Map()); // Kept for UI compatibility
    
    // UI States
    const [activeContact, setActiveContact] = useState(null);
    const [showMenu, setShowMenu] = useState(false);

    // Load contacts from local storage
    useEffect(() => {
        const storedContacts = localStorage.getItem(CONTACTS_STORAGE_KEY);
        if (storedContacts) {
            setContacts(JSON.parse(storedContacts));
        }
    }, []);

    // --- Polling for Messages ---
    useEffect(() => {
        const pollMessages = async () => {
            if (!user.account) return;
            const msgs = await fetchMessages(user.account);
            
            // Add direction and mock 'isDecrypted' to match previous data structure
            const processedMsgs = msgs.map(msg => ({
                ...msg,
                direction: msg.sender === user.account ? 'sent' : 'received',
                isDecrypted: true 
            }));
            
            // Simple diff check to avoid re-rendering if length matches (basic optimization)
            setMessages(prev => {
                if (prev.length !== processedMsgs.length) return processedMsgs;
                return prev; 
            });
        };

        // Poll every 2 seconds
        const interval = setInterval(pollMessages, 2000);
        pollMessages(); // Initial fetch

        return () => clearInterval(interval);
    }, [user.account]);

    // --- Actions ---

    const addContact = () => {
        const username = prompt("Enter Username of contact:");
        if (username) {
            if (contacts.some(c => c.address.toLowerCase() === username.toLowerCase())) {
                alert("Contact already exists.");
                return;
            }
            // We treat 'address' as 'username' in this simple version
            const newContactsList = [...contacts, { name: username, address: username }];
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

    const handleContactSelect = (contact) => {
        setActiveContact(contact);
        setShowMenu(false);
    };

    const activeMessages = messages
        .filter(msg => {
            if (!activeContact) return false;
            const otherParty = msg.direction === 'sent' ? msg.receiver : msg.sender;
            return otherParty === activeContact.address;
        })
        .sort((a, b) => a.timestamp - b.timestamp);

    return (
        <div className="App">
            {/* --- LEFT SIDEBAR --- */}
            <div className="sidebar">
                <div className="sidebar-header">
                    <div style={{display:'flex', alignItems:'center', gap: '10px'}}>
                         <div className="avatar" style={{backgroundColor:'#4a148c'}}>You</div>
                         <div style={{display:'flex', flexDirection:'column'}}>
                             <h3 style={{margin:0, fontSize:'1rem'}}>My Profile</h3>
                             <div className="wallet-info" style={{ 
                                 marginTop: '2px', 
                                 fontSize: '0.9rem', 
                                 color: '#423c3cff',
                                 fontWeight:'600'
                             }}>
                                 <span>@{user.account}</span>
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
                                <p>@{truncateName(contact.address)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- RIGHT CHAT WINDOW --- */}
            <div className="chat-window">
                {activeContact ? (
                    <>
                        <div className="chat-header">
                            <div className="avatar">
                                {activeContact.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="chat-header-info">
                                <h4>{activeContact.name}</h4>
                                <p>@{activeContact.address}</p>
                            </div>
                            
                            <div className="header-right">
                                <button className="menu-btn" onClick={() => setShowMenu(!showMenu)}>&#8942;</button>
                                {showMenu && (
                                    <div className="dropdown-menu">
                                        <div className="dropdown-item danger" onClick={deleteContact}>Delete Contact</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <MessageList 
                            messages={activeMessages} 
                            readStatusMap={readStatusMap}
                        />

                        <SendMessage 
                            receiverAddress={activeContact.address} 
                            sender={user.account}
                        />
                    </>
                ) : (
                    <div className="empty-chat-container">
                        <h2>BLOCKTALK</h2>
                        <p>Select a contact to start messaging.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Chat;