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
    MAINNET_RPC_URL,
    ARBITRUM_RPC_URL,
    DEV_PRIVATE_KEY,
    NFT_PRIVATE_KEY,
    COINMARKETCAP_API_KEY,
    ETHERSCAN_API_KEY,
} = process.env

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: { compilers: [{ version: "0.8.7" }, { version: "0.4.19" }, { version: "0.6.12" }] },
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
            forking: {
                url: MAINNET_RPC_URL,
            },
            blockConfirmations: 1,
        },
        sepolia: {
            url: SEPOLIA_RPC_URL,
            accounts: [DEV_PRIVATE_KEY],
            chainId: 11155111,
            blockConfirmations: 6,
        },
        // localhost: {
        //     url: "http://127.0.0.1:8545/",
        //     chainId: 31337,
        // },
        arbitrum: {
            chainId: 42161,
            url: ARBITRUM_RPC_URL,
            accounts: [NFT_PRIVATE_KEY],
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
    },

    mocha: {
        timeout: 300000, // 300 seconds max or test fails
    },
}
