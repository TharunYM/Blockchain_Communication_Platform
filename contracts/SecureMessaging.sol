// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SecureMessaging {

    struct Message {
        address sender;
        address receiver;
        uint timestamp;
        string ipfsHash; // Hash of the encrypted message on IPFS
    }

    // Event to notify the frontend of new messages
    event MessageSent(
        address indexed sender,
        address indexed receiver,
        uint timestamp,
        string ipfsHash
    );

    // --- (NEW) ---
    // Event to notify the sender that a message was read
    event MessageRead(string indexed ipfsHash, address indexed reader);

    // Mapping to store user's public encryption key
    mapping(address => string) public publicKeys;

    // Array to hold all messages sent through the contract
    Message[] public allMessages;

    // --- (NEW) Mappings for Read Receipts ---
    // Stores who the receiver is for a given hash
    mapping(string => address) public messageReceiver;
    // Stores the read status for a given hash
    mapping(string => bool) public isMessageRead;
    // -----------

    /**
     * @dev Registers or updates a user's public encryption key.
     * @param _publicKey The user's public key, as a string.
     */
    function registerPublicKey(string memory _publicKey) public {
        require(bytes(_publicKey).length > 0, "Public key cannot be empty");
        publicKeys[msg.sender] = _publicKey;
    }

    /**
     * @dev Sends a message by storing its IPFS hash and emitting an event.
     * @param _receiver The recipient's Ethereum address.
     * @param _ipfsHash The IPFS hash of the encrypted message.
     */
    function sendMessage(address _receiver, string memory _ipfsHash) public {
        require(_receiver != address(0), "Invalid receiver address");
        require(bytes(publicKeys[msg.sender]).length > 0, "Sender must register a public key first");
        require(bytes(publicKeys[_receiver]).length > 0, "Receiver must have a registered public key");
        
        allMessages.push(Message(msg.sender, _receiver, block.timestamp, _ipfsHash));
        
        // --- (NEW) ---
        // Store the receiver for this hash to verify "mark as read"
        messageReceiver[_ipfsHash] = _receiver;
        // -----------
        
        emit MessageSent(msg.sender, _receiver, block.timestamp, _ipfsHash);
    }

    // --- (NEW FUNCTION) ---
    /**
     * @dev Allows the receiver to mark a message as read.
     * @param _ipfsHash The hash of the message being read.
     */
    function markMessageAsRead(string memory _ipfsHash) public {
        // Check 1: The person calling this must be the intended receiver
        require(messageReceiver[_ipfsHash] == msg.sender, "Only receiver can mark as read");
        
        // Check 2: Don't mark as read twice (saves gas)
        require(!isMessageRead[_ipfsHash], "Message already marked as read");

        // Update the status and emit the event
        isMessageRead[_ipfsHash] = true;
        emit MessageRead(_ipfsHash, msg.sender);
    }
    // --------------------

    /**
     * @dev A simple view function to get the count of all messages.
     */
    function getMessageCount() public view returns (uint) {
        return allMessages.length;
    }
}