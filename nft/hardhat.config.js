require("dotenv").config()

require("@nomicfoundation/hardhat-toolbox")
require("@nomiclabs/hardhat-solhint")

// require("hardhat-contract-sizer")
require("hardhat-gas-reporter")
require("solidity-coverage")

// https://github.com/wighawag/hardhat-deploy-ethers#installation
require("@nomiclabs/hardhat-ethers") // https://github.com/wighawag/hardhat-deploy#installation
require("@nomicfoundation/hardhat-ethers")
require("hardhat-deploy") // injects `deployments` and `getNamedAccounts` into hre

const {
    SEPOLIA_RPC_URL,
    PRIVATE_KEY,
    COINMARKETCAP_API_KEY,
    ETHERSCAN_API_KEY,
    ARBITRUM_RPC_URL,
    ARB_PRIVATE_KEY,
} = process.env

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: "0.8.7",
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
            blockConfirmations: 1,
        },
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
        arbitrum: {
            chainId: 42161,
            url: ARBITRUM_RPC_URL,
            accounts: [ARB_PRIVATE_KEY],
        },
    },
    gasReporter: {
        enabled: false,
        outputFile: "gas-report.txt",
        noColors: true,
        currency: "USD",
        coinmarketcap: COINMARKETCAP_API_KEY,
        token: "ETH",
    },
    etherscan: {
        apiKey: {
            sepolia: ETHERSCAN_API_KEY,
        },
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
        collector: {
            default: 1,
        },
    },

    mocha: {
        timeout: 300000, // 300 seconds max or test fails
    },
}
