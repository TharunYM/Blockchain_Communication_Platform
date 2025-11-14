import { create } from 'ipfs-http-client';

// Connect to the local IPFS Desktop node API
// Make sure your IPFS Desktop app is running
const client = create({
    host: '127.0.0.1',
    port: 5001,
    protocol: 'http',
});

// Upload a string (e.g., encrypted message) to IPFS
export const uploadToIPFS = async (data) => {
    try {
        const added = await client.add(data);
        const hash = added.path;
        console.log('Uploaded to IPFS with hash:', hash);
        return hash;
    } catch (error) {
        console.error('Error uploading file to IPFS:', error);
        return null;
    }
};

// Download a file from IPFS using its hash (CID)
export const downloadFromIPFS = async (hash) => {
    try {
        const chunks = [];
        for await (const chunk of client.cat(hash)) {
            chunks.push(chunk);
        }
        const data = new TextDecoder().decode(Uint8Array.from(chunks.flat()));
        return data;
    } catch (error) {
        console.error(`Error downloading file from IPFS with hash ${hash}:`, error);
        return null;
    }
};