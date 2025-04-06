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
        process.env.LOCAL_PRIVATE_KEY1,
        process.env.LOCAL_PRIVATE_KEY2,
        process.env.LOCAL_PRIVATE_KEY3
      ]
    }
    // Add your network configurations here
    // Example for testnet:
    // sepolia: {
    //   url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
    //   accounts: [process.env.PRIVATE_KEY]
    // }
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
