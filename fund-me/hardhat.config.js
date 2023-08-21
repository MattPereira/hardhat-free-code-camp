require("dotenv").config()

require("@nomicfoundation/hardhat-toolbox")
require("@nomiclabs/hardhat-solhint")

require("solidity-coverage")
require("hardhat-gas-reporter")

// https://github.com/wighawag/hardhat-deploy-ethers#installation
require("@nomiclabs/hardhat-ethers") // https://github.com/wighawag/hardhat-deploy#installation
require("@nomicfoundation/hardhat-ethers")
require("hardhat-deploy")

const { SEPOLIA_RPC_URL, PRIVATE_KEY, COINMARKETCAP_API_KEY } = process.env

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    // solidity: "0.8.8",
    solidity: {
        compilers: [{ version: "0.8.8" }, { version: "0.6.6" }],
    },
    defaultNetwork: "hardhat",
    networks: {
        sepolia: {
            url: SEPOLIA_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 11155111,
            blockConfirmations: 6,
        },
        localhost: {
            url: "http://127.0.0.1:8545/",
            chainId: 31337,
        },
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY,
    },
    gasReporter: {
        enabled: true,
        outputFile: "gas-report.txt",
        noColors: true,
        currency: "USD",
        coinmarketcap: COINMARKETCAP_API_KEY,
        token: "ETH",
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
        user: {
            default: 1,
        },
    },
}
