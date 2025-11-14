module.exports = {
  networks: {
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