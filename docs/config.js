const CONFIG = {
    contractAddresses: {
        hardhat: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // local address
        sepolia: "0xeCF7688E2FEB55c6C58bB188E8FF0695883D633D",
        polygon: "0x0000000000000000000000000000000000000000" // polygon address
    },
    chainIds: {
        hardhat: "0x7A69",
        polygon: "0x89",
        sepolia: "0xaa36a7"
    },
    chainNames: {
        hardhat: "Hardhat Local",
        polygon: "Polygon Mainnet",
        sepolia: "Sepolia Testnet"
    },
    rpcUrls: {
        hardhat: "http://127.0.0.1:8545",
        polygon: "https://polygon-rpc.com",
        sepolia: "https://eth-sepolia.g.alchemy.com/v2/Fet10_Bu9eq_NJpE84WQHgmLq7IcBNmA"
    },
    debug: {
        hardhat: true,
        polygon: false,
        sepolia: true
    }
}; 