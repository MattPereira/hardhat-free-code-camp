const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async function (hre) {
    const { getNamedAccounts, deployments } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    log("-----------------------------")
    const constructorArgs = []
    const basicNft = await deploy("BasicNft", {
        from: deployer,
        args: constructorArgs,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying on Etherscan....")
        await verify(basicNft.address, constructorArgs)
    }
    log("-----------------------------")
}

module.exports.tags = ["all", "basicNft"]
