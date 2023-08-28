const { ethers } = require("hardhat")
const { abi } = require("../utils/challengeAbi")

const contractAddress = "0xB29eA9ad260B6DC980513bbA29051570b2115110"

async function getStorage() {
    // Get value at storage slot 777
    const value = await ethers.provider.getStorage(contractAddress, "777")

    // Create signer for transaction
    const signer = await ethers.provider.getSigner()
    // Create contract instance for interactions
    const contract = new ethers.BaseContract(contractAddress, abi, signer)

    const balanceBefore = await ethers.provider.getBalance(signer.address)
    console.log("Balance before:", ethers.formatEther(balanceBefore))

    const tx = await contract.mintNft(value)
    console.log(tx)
    const txReceipt = await tx.wait(1)

    console.log(txReceipt)

    const balanceAfter = await ethers.provider.getBalance(signer.address)
    console.log("Balance after:", ethers.formatEther(balanceAfter))
}

getStorage()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
