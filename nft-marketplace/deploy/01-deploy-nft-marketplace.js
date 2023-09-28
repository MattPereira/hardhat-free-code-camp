const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async function (hre) {
    const { getNamedAccounts, deployments } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    log("-----------------------------")
    const args = []
    const basicNft = await deploy("NftMarketplace", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    // verify on etherscan
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(basicNft.address, args)
    }

    log("NFT MARKETPLACE DEPLOYED!")
}

module.exports.tags = ["all", "marketplace"]
