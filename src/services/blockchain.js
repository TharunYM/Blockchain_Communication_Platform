import { ethers, BrowserProvider, Contract } from 'ethers';

// --- IMPORTANT: REPLACE WITH YOUR CONTRACT DETAILS ---
const CONTRACT_ADDRESS = '0x5c6c69737EBd759eA2A72f9e2B0CAd19edD762c6'; 
// Example ABI (replace with your actual ABI)
const CONTRACT_ABI = [
    // This is the simplified ABI without profilePic functions/events
    "function registerPublicKey(string memory _publicKey) public",
    "function sendMessage(address _receiver, string memory _ipfsHash) public",
    "function markMessageAsRead(string memory _ipfsHash) public",
    "function publicKeys(address) view returns (string)",
    "function messageReceiver(string) view returns (address)",
    "function isMessageRead(string) view returns (bool)",
    "event MessageSent(address indexed sender, address indexed receiver, uint timestamp, string ipfsHash)",
    "event MessageRead(string indexed ipfsHash, address indexed reader)"
];
// --- END OF CONTRACT DETAILS ---

let provider;
let signer;
let contract;
let currentAccount = null;

const initializeProvider = async () => {
    if (window.ethereum) {
        try {
            provider = new BrowserProvider(window.ethereum);
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length === 0) return false;

            signer = await provider.getSigner(accounts[0]);
            if (!signer) return false;
            
            contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            currentAccount = (await signer.getAddress()).toLowerCase();
            return true;
        } catch (error) {
            console.error("Error during blockchain provider/signer/contract initialization:", error);
            provider = null; signer = null; contract = null; currentAccount = null;
            return false;
        }
    } else {
        console.error("MetaMask or other Web3 provider not detected.");
        return false;
    }
};

export const connectWallet = async () => {
    try {
        if (!window.ethereum) {
            alert("MetaMask is not installed. Please install MetaMask to connect.");
            return null;
        }

        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (accounts.length > 0) {
            const success = await initializeProvider();
            return success ? currentAccount : null;
        }
        return null;
    } catch (error) {
        console.error("Error connecting to MetaMask:", error);
        alert("Failed to connect to MetaMask. Please ensure MetaMask is unlocked and you approve the connection.");
        return null;
    }
};

export const registerPublicKeyOnChain = async (publicKey) => {
    if (!contract) { const initialized = await initializeProvider(); if (!initialized) return false; }
    if (!contract || !currentAccount) return false;

    try {
        const existingPublicKey = await contract.publicKeys(currentAccount);
        if (existingPublicKey === publicKey) return true;

        const tx = await contract.registerPublicKey(publicKey);
        await tx.wait();
        return true;
    } catch (error) {
        console.error("Error registering public key:", error);
        return false;
    }
};

export const getPublicKeyFromChain = async (address) => {
    if (!contract) { const initialized = await initializeProvider(); if (!initialized) return null; }
    if (!contract) return null;

    try {
        const pk = await contract.publicKeys(address);
        return pk;
    } catch (error) {
        console.error("Error getting public key from chain:", error);
        return null;
    }
};

export const sendMessageOnChain = async (receiverAddress, ipfsHash) => {
    if (!contract) { const initialized = await initializeProvider(); if (!initialized) return false; }
    if (!contract || !currentAccount) return false;

    try {
        const tx = await contract.sendMessage(receiverAddress, ipfsHash);
        await tx.wait();
        return true;
    } catch (error) {
        console.error("Error sending message on chain:", error);
        return false;
    }
};

export const markAsReadOnChain = async (ipfsHash) => {
    if (!contract) { const initialized = await initializeProvider(); if (!initialized) return false; }
    if (!contract || !currentAccount) return false;

    try {
        const alreadyRead = await contract.isMessageRead(ipfsHash);
        if (alreadyRead) return true;

        const tx = await contract.markMessageAsRead(ipfsHash);
        await tx.wait();
        return true;
    } catch (error) {
        console.error("Error marking message as read:", error);
        return false;
    }
};

export const listenForMessages = (callback) => {
    let unsubscribeFn = () => {};

    if (!contract) {
        initializeProvider().then((success) => {
            if (success && contract) {
                const messageSentFilter = contract.filters.MessageSent();
                const listener = (sender, receiver, timestamp, ipfsHash, event) => {
                    callback({ sender, receiver, timestamp: Number(timestamp), ipfsHash, event });
                };
                contract.on(messageSentFilter, listener);
                unsubscribeFn = () => { contract.off(messageSentFilter, listener); };
            }
        }).catch(e => console.error("Failed to initialize contract for message listener after retry:", e));
        return () => unsubscribeFn();
    }

    const messageSentFilter = contract.filters.MessageSent();
    const listener = (sender, receiver, timestamp, ipfsHash, event) => {
        callback({ sender, receiver, timestamp: Number(timestamp), ipfsHash, event });
    };
    
    contract.on(messageSentFilter, listener);

    return () => {
        contract.off(messageSentFilter, listener);
    };
};

export const listenForReadReceipts = (callback) => {
    let unsubscribeFn = () => {};

    if (!contract) {
        initializeProvider().then((success) => {
            if (success && contract) {
                const messageReadFilter = contract.filters.MessageRead();
                const listener = (ipfsHash, reader, event) => {
                    callback(ipfsHash, reader, event);
                };
                contract.on(messageReadFilter, listener);
                unsubscribeFn = () => { contract.off(messageReadFilter, listener); };
            }
        }).catch(e => console.error("Failed to initialize contract for read receipt listener after retry:", e));
        return () => unsubscribeFn();
    }

    const messageReadFilter = contract.filters.MessageRead();
    const listener = (ipfsHash, reader, event) => {
        callback(ipfsHash, reader, event);
    };

    contract.on(messageReadFilter, listener);

    return () => {
        contract.off(messageReadFilter, listener);
    };
};