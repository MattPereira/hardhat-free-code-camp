const { ethers, network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

module.exports = async function (hre) {
    const { getNamedAccounts, deployments } = hre
    const { log } = deployments
    const { deployer } = await getNamedAccounts()

    console.log("-----------------------------")

    // Basic NFT
    const basicNft = await ethers.getContract("BasicNft", deployer)
    const mintBasicTx = await basicNft.mintNft()
    await mintBasicTx.wait(1)
    log(`Basic NFT index 0 has tokenURI: ${await basicNft.tokenURI(0)}`)
    log("-----------------------------")

    // Random IPFS NFT
    const randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer)
    const mintFee = await randomIpfsNft.getMintFee()
    await new Promise(async (resolve, reject) => {
        setTimeout(resolve, 300000) // 5 minutes
        randomIpfsNft.once("NftMinted", async function () {
            resolve()
        })
        const mintRandomNftTx = await randomIpfsNft.requestNft({ value: mintFee })
        const mintRandomNftTxReceipt = await mintRandomNftTx.wait(1)
        // pretend to be mocks if on testnet
        if (developmentChains.includes(network.name)) {
            const requestId = mintRandomNftTxReceipt.logs[1].args.requestId
            const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
            await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, randomIpfsNft.target)
        }
    })
    log(`Random IPFS NFT index 0 tokenURI: ${await randomIpfsNft.tokenURI(0)}`)
    log("-----------------------------")

    // Dynamic SVG NFT
    const highValue = ethers.parseUnits("1500", 8) // add 8 zeros to match precision of chainlink price feed
    const dynamicSvgNft = await ethers.getContract("DynamicSvgNft", deployer)
    const dynamicSvgNftMintTx = await dynamicSvgNft.mintNft(highValue)
    await dynamicSvgNftMintTx.wait(1)
    log(`Dynamic SVG NFT index 0 tokenURI: ${await dynamicSvgNft.tokenURI(0)}`)
}

module.exports.tags = ["mint"]
