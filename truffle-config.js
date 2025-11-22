require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');
module.exports = {
  networks: {
    sepolia: {
  provider: () => new HDWalletProvider(process.env.MNEMONIC, process.env.PROJECT_ID),
  network_id: 11155111, // Sepolia's specific ID
  gas: 5500000,         // Gas limit
  confirmations: 2,     // Wait 2 blocks before verifying (safety)
  timeoutBlocks: 200,   // Wait longer for slow testnets
  skipDryRun: true      // Don't double-check, just do it
},
    development: {
      host: "127.0.0.1",     // Localhost
      port: 7545,            // Standard Ganache UI port
      network_id: "*",       // Match any network id
    },
  },
  contracts_build_directory: "./src/contracts", // Output contract ABI to the React app's src folder
  compilers: {
    solc: {
      version: "0.8.19",
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
};