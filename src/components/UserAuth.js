import React, { useState } from 'react';
import { connectWallet, registerPublicKeyOnChain } from '../services/blockchain';
import { createIdentity } from '../services/encryption';

function UserAuth({ onLogin }) {
    const [status, setStatus] = useState('');

    const handleConnect = async () => {
        setStatus('Connecting to wallet...');
        const account = await connectWallet();
        
        if (account) {
            setStatus('Generating encryption keys...');
            const identity = createIdentity();
            
            setStatus('Registering public key on the blockchain...');
            await registerPublicKeyOnChain(identity.publicKey);
            
            setStatus('Login successful!');
            onLogin(account, identity);
        } else {
            setStatus('Connection failed. Please try again.');
        }
    };

    return (
        <div className="user-auth card">
            <h2>Connect to Get Started</h2>
            <button onClick={handleConnect}>Connect with MetaMask</button>
            <p>{status}</p>
        </div>
    );
}

export default UserAuth;