const { ethers } = require("hardhat")
const fs = require("fs")

const CLIENT_ADDRESSES_PATH = "../client/constants/contractAddresses.json"

const CLIENT_ABI_PATH = "../client/constants/abi.json"

module.exports = async function () {
    if (process.env.DEVELOPMENT) {
        console.log("Updating front end...")
        await updateContractAddresses()
        await updateAbi()
    }
}

async function updateAbi() {
    const raffle = await ethers.getContract("Raffle")
    const abi = raffle.interface.formatJson()
    fs.writeFileSync(CLIENT_ABI_PATH, abi)
}

async function updateContractAddresses() {
    const raffle = await ethers.getContract("Raffle")
    const currentAddresses = JSON.parse(fs.readFileSync(CLIENT_ADDRESSES_PATH, "utf8"))
    const chainId = network.config.chainId.toString()
    if (chainId in currentAddresses) {
        if (!currentAddresses[chainId].includes(raffle.target)) {
            currentAddresses[chainId].push(raffle.target)
        }
    } else {
        currentAddresses[chainId] = [raffle.target]
    }
    fs.writeFileSync(CLIENT_ADDRESSES_PATH, JSON.stringify(currentAddresses))
}

module.exports.tags = ["all", "frontend"]
