import { create } from 'ipfs-http-client';

const ipfs = create({ host: 'localhost', port: 5001, protocol: 'http' });

// Simplified uploadToIPFS if you only expect string/JSON for messages
export const uploadToIPFS = async (data) => {
    try {
        const content = typeof data === 'string' ? data : JSON.stringify(data);
        const { path } = await ipfs.add(content);
        console.log("Uploaded to IPFS, hash:", path);
        return path;
    } catch (error) {
        console.error("IPFS upload error:", error);
        return null;
    }
};

export const downloadFromIPFS = async (ipfsHash) => {
    try {
        const chunks = [];
        for await (const chunk of ipfs.cat(ipfsHash)) {
            chunks.push(chunk);
        }
        const data = Buffer.concat(chunks).toString('utf8');
        console.log("Downloaded from IPFS:", data);
        return data;
    } catch (error) {
        console.error("IPFS download error:", error);
        return null;
    }
};