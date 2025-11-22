import React, { useEffect, useRef } from 'react';

function MessageList({ messages, readStatusMap }) {
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const renderContent = (msg) => {
        if (msg.type === 'file') {
            return (
                <span>
                    📄 <a href={msg.content} download={msg.fileName} style={{color: 'inherit'}}>
                        {msg.fileName}
                    </a> <small>({msg.fileType})</small>
                </span>
            );
        }
        return msg.content;
    };

    const renderStatus = (msg) => {
        if (msg.direction !== 'sent') return null;
        const isRead = readStatusMap.get(msg.ipfsHash) === 'read';
        return <span className="read-receipt">{isRead ? "✓✓" : "✓"}</span>;
    };

    return (
        <div className="messages-container">
            {messages.map((msg, index) => (
                <div key={index} className={`message-bubble ${msg.direction === 'sent' ? 'message-sent' : 'message-received'}`}>
                    {renderContent(msg)}
                    <span className="msg-time">
                        {new Date(msg.timestamp * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        {renderStatus(msg)}
                    </span>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
}

export default MessageList;