import React, { useState } from 'react';
import { getPublicKeyFromChain, sendMessageOnChain } from '../services/blockchain';
import { encryptMessage } from '../services/encryption';
import { uploadToIPFS } from '../services/ipfs';

const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
});

function SendMessage({ receiverAddress }) {
    const [message, setMessage] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message && !file) return;

        setLoading(true);
        try {
            // 1. Get Key
            const receiverPublicKey = await getPublicKeyFromChain(receiverAddress);
            if (!receiverPublicKey) {
                alert("Receiver has not registered a public key yet.");
                setLoading(false);
                return;
            }

            // 2. Prepare Payload
            let payload;
            if (file) {
                const fileBase64 = await fileToBase64(file);
                payload = { type: 'file', fileName: file.name, fileType: file.type, content: fileBase64 };
            } else {
                payload = { type: 'text', content: message };
            }

            // 3. Encrypt & Upload
            const encrypted = await encryptMessage(receiverPublicKey, payload);
            const ipfsHash = await uploadToIPFS(encrypted);

            // 4. Send
            await sendMessageOnChain(receiverAddress, ipfsHash);

            // Reset
            setMessage('');
            setFile(null);
        } catch (error) {
            console.error(error);
            alert("Failed to send message");
        }
        setLoading(false);
    };

    return (
        <div className="chat-footer">
            <form onSubmit={handleSubmit} style={{display:'flex', width:'100%', alignItems:'center'}}>
                
                {/* File Button (Paperclip style) */}
                <label htmlFor="file-input" className="icon-btn" title="Attach File" style={{cursor:'pointer'}}>
                    📎
                </label>
                <input 
                    type="file" 
                    id="file-input" 
                    style={{display:'none'}} 
                    onChange={(e) => setFile(e.target.files[0])}
                />

                <div className="input-wrapper">
                    {file ? (
                        <div style={{width:'100%', color:'#008069'}}>
                            📄 {file.name} <button type="button" onClick={()=>setFile(null)} style={{border:'none', background:'none', cursor:'pointer'}}>❌</button>
                        </div>
                    ) : (
                        <textarea 
                            placeholder="Type a message" 
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                        />
                    )}
                </div>

                <button type="submit" className="icon-btn send-btn" disabled={loading}>
                    {loading ? "..." : "➤"}
                </button>
            </form>
        </div>
    );
}

export default SendMessage;