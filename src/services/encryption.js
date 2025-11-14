import EthCrypto from 'eth-crypto';

// Generates a new public/private key pair
export const createIdentity = () => {
    const identity = EthCrypto.createIdentity();
    return identity;
};

// Encrypt a payload (text or file) with the receiver's public key
export const encryptMessage = async (receiverPublicKey, payload) => {
    // The public key from the contract is just the public part
    const cleanPublicKey = receiverPublicKey.startsWith('0x') ? receiverPublicKey.substring(2) : receiverPublicKey;

    // --- (UPDATED) ---
    // Instead of creating an object here, we just stringify the payload
    // that was passed in.
    const encrypted = await EthCrypto.encryptWithPublicKey(
        cleanPublicKey,
        JSON.stringify(payload) // Encrypt the whole JSON object
    );
    // -----------------
    
    // Stringify the encrypted object to store on IPFS
    return EthCrypto.cipher.stringify(encrypted);
};

// Decrypt a message with the user's private key
export const decryptMessage = async (privateKey, encryptedString) => {
    try {
        // Parse the stringified encrypted object back to an object
        const encryptedObject = EthCrypto.cipher.parse(encryptedString);
        
        const decryptedMessage = await EthCrypto.decryptWithPrivateKey(
            privateKey,
            encryptedObject
        );
        
        // Parse the decrypted JSON string to get our payload object
        return JSON.parse(decryptedMessage);
    } catch (error) {
        console.error("Decryption failed:", error);
        return null;
    }
};