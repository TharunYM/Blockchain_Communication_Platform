import React, { useState, useEffect } from 'react';
import Web3 from 'web3'; // Import Web3
import './App.css';
import Login from './components/Login';
import Chat from './components/Chat';
import SecureMessaging from './contracts/SecureMessaging.json'; // Import your contract artifact

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // New State variables for Blockchain connection
    const [web3, setWeb3] = useState(null);
    const [contract, setContract] = useState(null);
    const [account, setAccount] = useState(null);

    useEffect(() => {
        const initWeb3 = async () => {
            if (window.ethereum) {
                try {
                    // 1. Initialize Web3 using MetaMask
                    const web3Instance = new Web3(window.ethereum);
                    
                    // 2. Request Account Access (if needed)
                    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                    setAccount(accounts[0]);

                    // 3. Get the Network ID to find the deployed contract
                    const networkId = await web3Instance.eth.net.getId();
                    
                    // 4. Get the contract configuration from the JSON file
                    const deployedNetwork = SecureMessaging.networks[networkId];

                    if (deployedNetwork) {
                        // 5. Load the Contract
                        const contractInstance = new web3Instance.eth.Contract(
                            SecureMessaging.abi,
                            deployedNetwork.address,
                        );
                        
                        setWeb3(web3Instance);
                        setContract(contractInstance);
                        console.log("Connected to Sepolia! Contract Address:", deployedNetwork.address);
                    } else {
                        window.alert("Smart contract not deployed to detected network. Please switch MetaMask to Sepolia!");
                    }

                } catch (error) {
                    console.error("Error connecting to blockchain:", error);
                }
            } else {
                window.alert("Non-Ethereum browser detected. You should install MetaMask!");
            }
            setLoading(false);
        };

        initWeb3();

        // Listen for Account Changes (e.g., user switches wallet in MetaMask)
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                setAccount(accounts[0]);
                // If account changes, log the user out
                if (accounts.length === 0 || (user && accounts[0].toLowerCase() !== user.account.toLowerCase())) {
                    setUser(null);
                }
            });

            // Listen for Network Changes (e.g., user switches from Sepolia to Mainnet)
            window.ethereum.on('chainChanged', () => {
                window.location.reload(); // Reload to refresh web3 connection
            });
        }
        
        // Cleanup listeners on unmount
        return () => {
            if (window.ethereum && window.ethereum.removeListener) {
                window.ethereum.removeListener('accountsChanged', () => {});
                window.ethereum.removeListener('chainChanged', () => {});
            }
        };
    }, [user]);

    const handleLoginSuccess = (loggedInUser) => {
        setUser(loggedInUser);
    };

    if (loading) {
        return <div className="loading-screen">Loading BlockTalk...</div>;
    }

    // Apply login-background class only when user is null (not logged in)
    const appClass = user ? "App" : "App login-background";

    return (
        <div className={appClass}>
            {user ? (
                // Pass contract and account to Chat so it can send messages
                <Chat 
                    user={user} 
                    contract={contract} 
                    account={account} 
                    web3={web3}
                />
            ) : (
                // Pass contract and web3 to Login if needed (for signing/verification)
                <Login 
                    onLoginSuccess={handleLoginSuccess} 
                    web3={web3}
                    account={account}
                />
            )}
        </div>
    );
}

export default App;