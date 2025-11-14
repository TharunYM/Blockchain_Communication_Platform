import React from 'react';

// You will need to add new CSS for this to look good
// We'll add 'sent' and 'received' classes

function MessageList({ messages, contacts, addContact, currentUserAccount, readStatusMap }) {

    const isContact = (address) => {
        if (!address || !currentUserAccount) return false;
        if (address.toLowerCase() === currentUserAccount.toLowerCase()) return true;
        return contacts.some(contact => contact.address.toLowerCase() === address.toLowerCase());
    };

    const renderMessageContent = (msg) => {
        if (msg.type === 'file') {
            return (
                <p>
                    <strong>File:</strong>{' '}
                    <a href={msg.content} download={msg.fileName}>
                        {msg.fileName}
                    </a>
                </p>
            );
        }
        return (
            <p className="message-text"><strong>Message:</strong> {msg.content}</p>
        );
    };

    // --- (NEW) Render the read status ---
    const renderReadStatus = (msg) => {
        if (msg.direction !== 'sent') {
            return null;
        }

        if (readStatusMap.get(msg.ipfsHash) === 'read') {
            return <small className="read-receipt read">Read ✓✓</small>;
        }

        return <small className="read-receipt sent">Sent ✓</small>;
    };
    // ------------------------------------

    return (
        <div className="message-list card">
            <h4>Inbox / Sent</h4>
            {messages.length === 0 ? (
                <p>No messages yet.</p>
            ) : (
                <ul>
                    {messages.map((msg, index) => {
                        // --- (NEW) Add class based on direction ---
                        const messageClass = msg.direction === 'sent' ? 'message-sent' : 'message-received';
                        
                        return (
                            <li key={index} className={messageClass}>
                                <div className="message-header">
                                    <p>
                                        <strong>{msg.direction === 'sent' ? 'To:' : 'From:'}</strong> {msg.direction === 'sent' ? msg.receiver : msg.sender}
                                    </p>
                                    {/* Only show 'Add Contact' for received messages */}
                                    {msg.direction === 'received' && !isContact(msg.sender) && (
                                        <button 
                                            className="add-contact-btn" 
                                            onClick={() => addContact(msg.sender)}
                                        >
                                            Add to Contacts
                                        </button>
                                    )}
                                </div>

                                {msg.isDecrypted ? renderMessageContent(msg) : "Could not decrypt"}
                                
                                <div className="message-footer">
                                    <small>{msg.timestamp}</small>
                                    {renderReadStatus(msg)}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

export default MessageList;