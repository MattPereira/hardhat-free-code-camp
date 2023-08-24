require("dotenv").config()

require("@nomiclabs/hardhat-waffle")

require("@nomiclabs/hardhat-etherscan")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")

// https://github.com/wighawag/hardhat-deploy-ethers#installation
require("@nomiclabs/hardhat-ethers") // https://github.com/wighawag/hardhat-deploy#installation
require("@nomicfoundation/hardhat-ethers")
require("hardhat-deploy") // injects `deployments` and `getNamedAccounts` into hre

const { SEPOLIA_RPC_URL, PRIVATE_KEY, COINMARKETCAP_API_KEY, ETHERSCAN_API_KEY } = process.env

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
    },
    gasReporter: {
        enabled: false,
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
        player: {
            default: 1,
        },
    },
}
