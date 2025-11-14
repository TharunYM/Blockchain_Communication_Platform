# Blockchain Enhanced Secure Communication Platform

This is a pre-final year project demonstrating a secure, decentralized messaging application. It uses Ethereum for identity and message routing, and IPFS for encrypted, off-chain message storage.

## Features
* **Decentralized Identity:** Users log in with their Ethereum wallet (MetaMask).
* **End-to-End Encryption:** Messages are encrypted with the receiver's public key before being sent.
* **Off-Chain Storage:** Encrypted message content is stored on IPFS to save on gas fees.
* **On-Chain Pointers:** The smart contract only stores the IPFS hash, sender, and receiver addresses.

## Tech Stack
* **Frontend:** React.js
* **Blockchain:** Solidity, Truffle, Ganache
* **Wallet:** MetaMask
* **Storage:** IPFS
* **Libraries:** Ethers.js, eth-crypto, ipfs-http-client

## How to Run

1.  **Clone the Repository**
    ```bash
    git clone [your-repo-link]
    cd blockchain-secure-messaging
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Start Services**
    * Open and run **Ganache** (your local blockchain).
    * Open and run **IPFS Desktop** (your local IPFS node).

4.  **Deploy Contracts**
    * Compile and deploy your smart contracts to Ganache:
    ```bash
    truffle migrate --network development
    ```
    * After deployment, copy the deployed `SecureMessaging` contract address.
    * Paste this address into the `contractAddress` variable in `src/services/blockchain.js`.

5.  **Run the Frontend App**
    ```bash
    npm start
    ```
    This will open the app in your browser at `http://localhost:3000`.

6.  **Test**
    * Set up two different accounts in MetaMask.
    * Connect with Account 1. This will register its public key.
    * Connect with Account 2 in a different browser (or incognito). This will register its key.
    * Copy Account 2's address and send it a message from Account 1.