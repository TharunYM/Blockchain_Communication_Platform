import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import Chat from './components/Chat';

// No image imports needed here anymore, as background is CSS gradient

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (window.ethereum) {
            // MetaMask account change listener
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0 || (user && accounts[0].toLowerCase() !== user.account.toLowerCase())) {
                    setUser(null); 
                }
            });
            window.ethereum.request({ method: 'eth_accounts' })
                .then(accounts => {
                    setLoading(false); 
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }

        return () => {
            if (window.ethereum && window.ethereum.removeListener) {
                window.ethereum.removeListener('accountsChanged', () => {});
            }
        };
    }, [user]);

    const handleLoginSuccess = (loggedInUser) => {
        setUser(loggedInUser);
    };

    if (loading) {
        return <div className="loading-screen">Loading application...</div>;
    }

    // Apply login-background class only when user is null (not logged in)
    const appClass = user ? "App" : "App login-background";

    return (
        <div className={appClass}>
            {user ? (
                // If user is logged in, show the chat interface
                <Chat user={user} />
            ) : (
                // If no user, show the login component
                <Login onLoginSuccess={handleLoginSuccess} />
            )}
        </div>
    );
}

export default App;