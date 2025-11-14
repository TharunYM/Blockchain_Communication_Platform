import React, { useState } from 'react';
import { getPublicKeyFromChain, sendMessageOnChain } from '../services/blockchain';
import { encryptMessage } from '../services/encryption';
import { uploadToIPFS } from '../services/ipfs';

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

function SendMessage({ contacts }) {
    const [receiver, setReceiver] = useState('');
    const [message, setMessage] = useState('');
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!receiver || (!message && !file)) {
            alert("Please fill in receiver and either a message or a file.");
            return;
        }

        setStatus('1/5: Fetching receiver public key...');
        const receiverPublicKey = await getPublicKeyFromChain(receiver);
        if (!receiverPublicKey) {
            setStatus('Error: Receiver has not registered their public key.');
            return;
        }

        let payload;
        if (file) {
            setStatus('2/5: Encrypting file...');
            const fileBase64 = await fileToBase64(file);
            payload = {
                type: 'file',
                fileName: file.name,
                fileType: file.type,
                content: fileBase64,
            };
        } else {
            setStatus('2/5: Encrypting message...');
            payload = {
                type: 'text',
                content: message,
            };
        }
        
        const encryptedMessage = await encryptMessage(receiverPublicKey, payload);

        setStatus('3/5: Uploading to IPFS...');
        const ipfsHash = await uploadToIPFS(encryptedMessage);
        if (!ipfsHash) {
            setStatus('Error: Failed to upload to IPFS.');
            return;
        }

        setStatus('4/5: Sending transaction to blockchain...');
        await sendMessageOnChain(receiver, ipfsHash);

        setStatus(`5/5: Message sent successfully! IPFS Hash: ${ipfsHash}`);
        setMessage('');
        setFile(null);
        setReceiver(''); // Clear receiver field
        if (document.getElementById('file-input')) {
            document.getElementById('file-input').value = null;
        }
    };

    // --- (NEW) Handle dropdown change ---
    const handleSelectChange = (e) => {
        setReceiver(e.target.value);
    };

    // --- (NEW) Handle text input change ---
    const handleInputChange = (e) => {
        setReceiver(e.target.value);
    };

    return (
        <div className="send-message card">
            <h4>Send a New Message</h4>
            <form onSubmit={handleSubmit}>

                {/* --- (UPDATED) --- */}
                <select
                    value={receiver} // The value is controlled by the 'receiver' state
                    onChange={handleSelectChange}
                >
                    <option value="">Select a contact...</option>
                    {contacts.map((contact) => (
                        <option key={contact.address} value={contact.address}>
                            {contact.name} ({truncateAddress(contact.address)})
                        </option>
                    ))}
                </select>

                <p style={{ textAlign: 'center', margin: '0.5rem 0', color: '#555' }}>— OR —</p>

                <input
                    type="text"
                    placeholder="...enter a new Ethereum Address"
                    value={receiver} // The value is ALSO controlled by the 'receiver' state
                    onChange={handleInputChange}
                />
                {/* ----------------- */}

                <textarea
                    placeholder="Your secure message (or leave blank to send a file)"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={!!file}
                ></textarea>
                
                <input
                    type="file"
                    id="file-input"
                    onChange={(e) => {
                        setFile(e.target.files[0]);
                        if (e.target.files[0]) setMessage('');
                    }}
                    disabled={!!message}
                />

                <button type="submit">Encrypt & Send</button>
            </form>
            {status && <p><small>{status}</small></p>}
        </div>
    );
}

export default SendMessage;

// Add this helper at the bottom
const truncateAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};