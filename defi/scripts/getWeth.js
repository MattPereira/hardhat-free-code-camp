const { getNamedAccounts } = require("hardhat")

const AMOUNT = ethers.parseEther("0.02")

async function getWeth() {
    const { deployer } = await getNamedAccounts()
    const signer = await ethers.getSigner(deployer)

    // always need the ABI and contract address to interact with a contract
    // abi -> IWeth.sol interface
    // contract address -> 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
    const iWeth = await ethers.getContractAt(
        "IWeth",
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        signer
    )

    const tx = await iWeth.deposit({ value: AMOUNT })
    const txReceipt = await tx.wait(1)
    const wethBalance = await iWeth.balanceOf(signer.address)
    console.log(`Got ${ethers.formatEther(wethBalance)} WETH`)
}

module.exports = { getWeth, AMOUNT }
