import { ethers } from 'ethers';
// Import the contract's ABI
import SecureMessagingArtifact from '../contracts/SecureMessaging.json';

const contractAddress = '0xB6861505796a9Cf3D7f30C045ac8BE9cbf8a671a'; // Replace after deploying

let provider;
let signer;
let contract;

// 1. Connect to MetaMask
export const connectWallet = async () => {
    if (window.ethereum) {
        try {
            provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = await provider.getSigner();
            
            contract = new ethers.Contract(
                contractAddress,
                SecureMessagingArtifact.abi,
                signer
            );
            
            const address = await signer.getAddress();
            console.log("Connected Account:", address);
            return address;
        } catch (error) {
            console.error("User denied account access", error);
            return null;
        }
    } else {
        alert('Please install MetaMask!');
        return null;
    }
};

// 2. Register a user's public key
export const registerPublicKeyOnChain = async (publicKey) => {
    if (!contract) return;
    try {
        const tx = await contract.registerPublicKey(publicKey);
        await tx.wait(); // Wait for the transaction to be mined
        console.log("Public key registered successfully!");
    } catch (error) {
        console.error("Error registering public key:", error);
    }
};

// 3. Get a user's public key from the blockchain
export const getPublicKeyFromChain = async (address) => {
    if (!contract) return null;
    try {
        const publicKey = await contract.publicKeys(address);
        return publicKey;
    } catch (error) {
        console.error("Error fetching public key:", error);
        return null;
    }
};

// 4. Send a message hash to the blockchain
export const sendMessageOnChain = async (receiverAddress, ipfsHash) => {
    if (!contract) return;
    try {
        const tx = await contract.sendMessage(receiverAddress, ipfsHash);
        await tx.wait();
        console.log("Message sent successfully! TX:", tx.hash);
    } catch (error) {
        console.error("Error sending message:", error);
    }
};

// 5. Listen for new messages
export const listenForMessages = (callback) => {
    if (!contract) return;
    contract.on("MessageSent", (sender, receiver, timestamp, ipfsHash, event) => {
        console.log("New Message Event Received:", { sender, receiver, timestamp, ipfsHash });
        // The callback function will be implemented in the React component
        callback({
            sender,
            receiver,
            timestamp: new Date(Number(timestamp) * 1000).toLocaleString(),
            ipfsHash,
        });
    });
};

// Add this function inside src/services/blockchain.js

export const markAsReadOnChain = async (ipfsHash) => {
    if (!contract || !ipfsHash) return;
    try {
        const tx = await contract.markMessageAsRead(ipfsHash);
        await tx.wait(); // Wait for the transaction
        console.log("Message marked as read on-chain:", ipfsHash);
    } catch (error) {
        // We catch this so the app doesn't crash if it fails
        // (e.g., message already marked as read)
        console.error("Error marking message as read:", error.message);
    }
};

// Add this function to the end of src/services/blockchain.js

export const listenForReadReceipts = (callback) => {
    if (!contract) return;
    contract.on("MessageRead", (ipfsHash, reader) => {
        console.log("Read Receipt Event Received:", { ipfsHash, reader });
        // The callback will be implemented in the React component
        callback(ipfsHash);
    });
};