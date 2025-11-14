import React, { useState, useEffect } from 'react';
import UserAuth from './components/UserAuth';
import Chat from './components/Chat';
import './App.css'; // This now has styles!

function App() {
    const [user, setUser] = useState({
        account: null,
        identity: null, // { privateKey, publicKey }
    });

    useEffect(() => {
        const savedIdentity = localStorage.getItem('user-identity');
        if (savedIdentity) {
            setUser(prev => ({ ...prev, identity: JSON.parse(savedIdentity) }));
        }
    }, []);
    
    const handleLogin = (account, identity) => {
        setUser({ account, identity });
        localStorage.setItem('user-identity', JSON.stringify(identity));
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>Blockchain Secure Messenger 🚀</h1>
            </header>
            <main>
                {!user.account ? (
                    <UserAuth onLogin={handleLogin} />
                ) : (
                    <Chat user={user} />
                )}
            </main>
        </div>
    );
}

export default App;