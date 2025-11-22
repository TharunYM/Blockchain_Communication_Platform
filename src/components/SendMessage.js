import React, { useState } from 'react';
import { uploadToIPFS } from '../services/ipfs';
import { encryptMessage } from '../services/encryption';
import { sendMessageOnChain } from '../services/blockchain';

function SendMessage({ receiverAddress, contract, account }) {
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        if (!receiverAddress || !contract || !account) {
            alert("Chat not ready. Please check connection.");
            return;
        }

        setLoading(true);
        try {
            console.log("Preparing to send to:", receiverAddress);

            // --- CRITICAL FIX: Fetch Receiver's Public Key FRESH from Blockchain ---
            // We don't trust local cache. We ask the contract directly.
            const receiverPublicKey = await contract.methods.publicKeys(receiverAddress).call();

            console.log("Receiver Public Key from Chain:", receiverPublicKey);

            if (!receiverPublicKey || receiverPublicKey.length === 0) {
                alert(`Error: The user ${receiverAddress.substring(0,6)}... has not registered a Public Key on the blockchain yet.\n\nTell them to click the 'REGISTER KEY' button in their sidebar!`);
                setLoading(false);
                return;
            }

            // 1. Encrypt the message using the Receiver's Public Key
            const encryptedData = await encryptMessage(receiverPublicKey, text);
            
            // 2. Upload Encrypted data to IPFS
            const ipfsHash = await uploadToIPFS(encryptedData);
            console.log("Message uploaded to IPFS:", ipfsHash);

            // 3. Send the IPFS Hash to the Blockchain
            // We call the Smart Contract function 'sendMessage'
            await contract.methods.sendMessage(receiverAddress, ipfsHash).send({ from: account });

            console.log("Message sent to blockchain!");
            setText(""); // Clear input
        } catch (error) {
            console.error("Sending failed:", error);
            alert("Failed to send message: " + (error.message || error));
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="send-message-form" onSubmit={handleSend} style={{
            padding: '20px',
            borderTop: '1px solid #eee',
            display: 'flex',
            gap: '10px',
            backgroundColor: '#fff'
        }}>
            <input
                type="text"
                className="message-input"
                placeholder="Type a message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={loading}
                style={{
                    flexGrow: 1,
                    padding: '12px 15px',
                    borderRadius: '25px',
                    border: '1px solid #ddd',
                    outline: 'none',
                    fontSize: '1rem'
                }}
            />
            <button 
                type="submit" 
                disabled={loading}
                style={{
                    backgroundColor: loading ? '#ccc' : '#4a148c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '45px',
                    height: '45px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}
            >
                {loading ? '...' : '➤'}
            </button>
        </form>
    );
}

export default SendMessage;