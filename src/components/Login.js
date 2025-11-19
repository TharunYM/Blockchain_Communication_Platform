import React, { useState } from 'react';
import { connectWallet, registerPublicKeyOnChain } from '../services/blockchain';
import { createIdentity } from '../services/encryption';

function Login({ onLoginSuccess }) {
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    const handleConnect = async () => {
        setLoading(true);
        setStatus('Connecting to wallet...');
        
        const account = await connectWallet();
        
        if (account) {
            setStatus('Generating secure keys...');
            const identity = createIdentity();
            
            setStatus('Registering identity on blockchain...');
            await registerPublicKeyOnChain(identity.publicKey);
            
            setStatus('Login successful!');
            onLoginSuccess({ account, identity });
        } else {
            setStatus('Connection failed. Please try again.');
        }
        setLoading(false);
    };

    return (
        <div className="login-container">
            <h2>BLOCKTALK</h2>
            <p>Decentralized. Encrypted. Secure.</p>
            
            {/* Pure CSS Button - No Images */}
            <button className="login-btn" onClick={handleConnect} disabled={loading}>
                {loading ? 'Connecting...' : 'Connect Wallet 🦊'}
            </button>
            
            {status && (
                <p style={{ marginTop: '15px', fontSize: '0.9rem', color: loading ? '#4a148c' : '#d32f2f' }}>
                    {status}
                </p>
            )}
        </div>
    );
}

export default Login;