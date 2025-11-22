import React, { useState } from 'react';
import { loginUser } from '../services/api';

function Login({ onLoginSuccess }) {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!username.trim()) return;

        setLoading(true);
        setError('');

        const result = await loginUser(username);
        
        if (result && result.success) {
            // We mimic the structure expected by App.js
            onLoginSuccess({ 
                account: username, // We use username as the 'account' identifier
                name: username,
                identity: { publicKey: 'mock-key' } // Placeholder to keep structure
            });
        } else {
            setError('Connection to server failed.');
        }
        setLoading(false);
    };

    return (
        <div className="login-container">
            <h2>BLOCKTALK</h2>
            <p>Simplified. Fast. Secure.</p>
            
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input 
                    type="text" 
                    placeholder="Choose a username..." 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{
                        padding: '15px',
                        borderRadius: '50px',
                        border: '1px solid #ddd',
                        fontSize: '1.1rem',
                        outline: 'none',
                        textAlign: 'center'
                    }}
                    disabled={loading}
                />
                
                <button className="login-btn" type="submit" disabled={loading || !username}>
                    {loading ? 'Entering...' : 'Enter Chat 💬'}
                </button>
            </form>
            
            {error && (
                <p style={{ marginTop: '15px', fontSize: '0.9rem', color: '#d32f2f' }}>
                    {error}
                </p>
            )}
        </div>
    );
}

export default Login;