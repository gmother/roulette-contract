require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ignition");
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: [
        process.env.LOCAL_PRIVATE_KEY
      ]
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: [process.env.SEPOLIA_PRIVATE_KEY]
    },
  },
  // Ignition configuration
  ignition: {
    // Optional: Configure gas settings
    gasPrice: "auto",
    // Optional: Configure deployment settings
    deployment: {
      // Optional: Configure deployment timeout
      timeout: 300000, // 5 minutes
    }
  }
};
