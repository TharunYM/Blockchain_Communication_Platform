const SecureMessaging = artifacts.require("SecureMessaging");

contract("SecureMessaging", (accounts) => {
    let contractInstance;
    const [alice, bob] = accounts;

    before(async () => {
        contractInstance = await SecureMessaging.deployed();
    });

    it("should deploy the contract successfully", async () => {
        assert(contractInstance.address, "Contract address should exist");
    });

    it("should allow a user to register a public key", async () => {
        const testPublicKey = "my-test-public-key";
        
        // Register from Alice's account
        await contractInstance.registerPublicKey(testPublicKey, { from: alice });
        
        // Retrieve the key
        const storedKey = await contractInstance.publicKeys(alice);
        
        assert.equal(storedKey, testPublicKey, "The public key was not stored correctly");
    });

    it("should not allow sending a message if receiver has no key", async () => {
    const ipfsHash = "QmTestHash123";
        
    try {
        // Alice tries to send to Bob, but Bob hasn't registered a key
        await contractInstance.sendMessage(bob, ipfsHash, { from: alice });
        assert.fail("The transaction should have failed");
    } catch (error) {
        assert.include(
            error.message,
            "Receiver must have a registered public key",
            "Error message should indicate missing receiver key"
        );
    }
    })
})


