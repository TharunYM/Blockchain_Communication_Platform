// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SecureMessaging {

    struct Message {
        address sender;
        address receiver;
        uint timestamp;
        string ipfsHash;
    }

    event MessageSent(address indexed sender, address indexed receiver, uint timestamp, string ipfsHash);
    event MessageRead(string indexed ipfsHash, address indexed reader);
    
    // --- MAPPINGS (REMOVED: profilePics mapping) ---
    mapping(address => string) public publicKeys;
    mapping(string => address) public messageReceiver;
    mapping(string => bool) public isMessageRead;
    
    Message[] public allMessages;

    function registerPublicKey(string memory _publicKey) public {
        require(bytes(_publicKey).length > 0, "Public key cannot be empty");
        publicKeys[msg.sender] = _publicKey;
    }

    // REMOVED: setProfilePic and getProfilePic functions

    function sendMessage(address _receiver, string memory _ipfsHash) public {
        require(_receiver != address(0), "Invalid receiver address");
        require(bytes(publicKeys[msg.sender]).length > 0, "Sender must register a public key");
        require(bytes(publicKeys[_receiver]).length > 0, "Receiver must have a registered public key");
        
        allMessages.push(Message(msg.sender, _receiver, block.timestamp, _ipfsHash));
        messageReceiver[_ipfsHash] = _receiver;
        
        emit MessageSent(msg.sender, _receiver, block.timestamp, _ipfsHash);
    }

    function markMessageAsRead(string memory _ipfsHash) public {
        require(messageReceiver[_ipfsHash] == msg.sender, "Only receiver can mark as read");
        require(!isMessageRead[_ipfsHash], "Message already marked as read");
        isMessageRead[_ipfsHash] = true;
        emit MessageRead(_ipfsHash, msg.sender);
    }
}