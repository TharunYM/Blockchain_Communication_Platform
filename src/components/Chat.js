import React, { useState, useEffect, useCallback } from 'react';
import MessageList from './MessageList';
import SendMessage from './SendMessage';
import { downloadFromIPFS } from '../services/ipfs';
import { decryptMessage } from '../services/encryption'; // <-- TYPO WAS HERE
import { 
    listenForMessages,
    markAsReadOnChain,
    listenForReadReceipts // <-- IMPORT NEW LISTENER
} from '../services/blockchain';

// --- (Helper Function) ---
const truncateAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};
// -----------------------------

const CONTACTS_STORAGE_KEY = 'secure-messenger-contacts';

function Chat({ user }) {
    const [messages, setMessages] = useState([]);
    const [showKeys, setShowKeys] = useState(false);
    const [contacts, setContacts] = useState([]);

    // --- (NEW STATE FOR READ RECEIPTS) ---
    // This map will store the read status of sent messages
    // e.g., { "Qm...": "read" }
    const [readStatusMap, setReadStatusMap] = useState(new Map());
    // -------------------------------------

    // Load contacts from localStorage
    useEffect(() => {
        const storedContacts = localStorage.getItem(CONTACTS_STORAGE_KEY);
        if (storedContacts) {
            setContacts(JSON.parse(storedContacts));
        }
    }, []);

    // Add a contact
    const addContact = (address) => {
        const name = prompt("Enter a name for this contact:", "");
        if (name && address) {
            const newContact = { name, address };
            if (contacts.some(c => c.address.toLowerCase() === address.toLowerCase())) {
                alert("Contact already exists.");
                return;
            }
            const newContactsList = [...contacts, newContact];
            setContacts(newContactsList);
            localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(newContactsList));
        }
    };

    // --- (UPDATED) handleNewMessage now handles SENT and RECEIVED ---
    const handleNewMessage = useCallback(async (eventData) => {
        const { sender, receiver, ipfsHash } = eventData;
        const myAddress = user.account.toLowerCase();

        // Don't process if user is not the sender OR receiver
        if (sender.toLowerCase() !== myAddress && receiver.toLowerCase() !== myAddress) {
            return;
        }

        // Check if message is already in our list
        if (messages.some(msg => msg.ipfsHash === ipfsHash)) {
            return;
        }

        console.log("Processing message:", ipfsHash);
        
        // Decrypt the message
        const encryptedString = await downloadFromIPFS(ipfsHash);
        if (!encryptedString) return;
            
        const decryptedPayload = await decryptMessage(user.identity.privateKey, encryptedString);
        if (!decryptedPayload) return;

        // Determine message direction
        const direction = sender.toLowerCase() === myAddress ? 'sent' : 'received';

        // If it's a received message, mark it as read on-chain
        if (direction === 'received') {
            markAsReadOnChain(ipfsHash);
        }
        
        setMessages(prev => [
            ...prev,
            { 
                ...eventData,
                ...decryptedPayload,
                isDecrypted: true,
                direction: direction // <-- ADD DIRECTION
            }
        ]);
        
    }, [user.account, user.identity.privateKey, messages]); // <-- Add messages dependency

    // --- (NEW) Listen for Read Receipts ---
    useEffect(() => {
        listenForReadReceipts((ipfsHash) => {
            setReadStatusMap(prevMap => {
                const newMap = new Map(prevMap);
                newMap.set(ipfsHash, "read");
                return newMap;
            });
        });
    }, []); // Runs once
    // -------------------------------------
    
    // Listen for new messages
    useEffect(() => {
        listenForMessages(handleNewMessage);
    }, [handleNewMessage]);

    // Sort messages by timestamp
    const sortedMessages = messages.sort((a, b) => a.timestamp - b.timestamp);

    return (
        <div className="chat-container">
            {/* --- Reverted Welcome Card --- */}
            <div className="card">
                <h3>Welcome, {user.account}</h3>
                <p>Your Public Key: <code>{user.identity.publicKey}</code></p>
            </div>
            
            <SendMessage contacts={contacts} />
            <MessageList 
                messages={sortedMessages} // <-- Pass sorted messages
                contacts={contacts} 
                addContact={addContact} 
                currentUserAccount={user.account}
                readStatusMap={readStatusMap} // <-- Pass read status
            />
        </div>
    );
}

export default Chat;