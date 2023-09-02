const { getWeth, AMOUNT } = require("../scripts/getWeth")
const { getNamedAccounts } = require("hardhat")
const { networkConfig } = require("../helper-hardhat-config")

/** Script for interactions with Aave
 *
 *   1. Deposit collateral : ETH / WETH
 *   2. Borrow another asset : DAI
 *   3. Repay the DAI
 */

const { wethToken, daiToken } = networkConfig[network.config.chainId]

async function main() {
    // the protocol only allows ERC20 tokens so we need to swap ETH for WETH first
    console.log("Swapping ETH for WETH...")
    await getWeth()
    const { deployer } = await getNamedAccounts()
    const signer = await ethers.getSigner(deployer)
    const signerAddress = signer.address

    const lendingPool = await getLendingPool(signer)
    // https://docs.aave.com/developers/v/2.0/the-core-protocol/addresses-provider#getaddress
    const lendingPoolAddress = await lendingPool.getAddress()

    /***** DEPOSIT *****/
    // 1. must approve aave to spend my WETH before I can deposit!
    await approveErc20(wethToken, lendingPoolAddress, AMOUNT, signer)

    // 2. call deposit function on Aave contract
    console.log("Depositing...")
    await lendingPool.deposit(wethToken.address, AMOUNT, signerAddress, 0)

    /***** BORROW *****/
    // 1. Ask Aave how much we are allowed to borrow (response is in ETH value)
    let { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(lendingPool, signerAddress)

    // 2. Convert ETH value to DAI value
    const daiPrice = await getDaiPrice()
    const amountDaiToBorrow = Number(availableBorrowsETH) * 0.95 * (1 / Number(daiPrice)) // 95% of what allowed borrow
    const amountDaiToBorrowInWei = ethers.parseEther(amountDaiToBorrow.toString()).toString()

    // 3. Call borrow function on Aave contract
    console.log(`Borrowing ${amountDaiToBorrow} DAI...`)
    await borrowDai(daiToken.address, lendingPool, amountDaiToBorrowInWei, signerAddress)
    await getBorrowUserData(lendingPool, signerAddress)

    /***** REPAY *****/
    // 1. approve aave to spend my DAI before I can repay!
    await approveErc20(daiToken, lendingPool.target, amountDaiToBorrowInWei, signer)
    // 2. call repay function on Aave contract
    await repay(daiToken.address, amountDaiToBorrowInWei, lendingPool, signer.address)
    await getBorrowUserData(lendingPool, signerAddress)

    // still owe small amount of DAI because of interest accrued
}

async function getLendingPool(signer) {
    const lendingPoolAddressesProviderAddress =
        networkConfig[network.config.chainId].lendingPoolAddressesProvider
    const lendingPoolAddressesProvider = await ethers.getContractAt(
        "ILendingPoolAddressesProvider",
        lendingPoolAddressesProviderAddress,
        signer
    )
    const lendingPoolAddress = await lendingPoolAddressesProvider.getLendingPool()
    const lendingPool = await ethers.getContractAt("ILendingPool", lendingPoolAddress, signer)
    return lendingPool
}

async function approveErc20(token, spenderAddress, amountToSpend, signer) {
    try {
        console.log("Approving...")
        const erc20Token = await ethers.getContractAt("IERC20", token.address, signer)
        const tx = await erc20Token.approve(spenderAddress, amountToSpend)
        await tx.wait(1)
        console.log(`Approved Aave to spend ${amountToSpend} of ${token.symbol}...`)
    } catch (e) {
        console.log(e)
    }
}

async function getBorrowUserData(lendingPool, account) {
    const { totalCollateralETH, totalDebtETH, availableBorrowsETH, healthFactor } =
        await lendingPool.getUserAccountData(account)
    console.log(`You have ${totalCollateralETH} of ETH deposited`)
    console.log(`You have ${totalDebtETH} of ETH borrowed`)
    console.log(`You can borrow up to ${ethers.formatEther(availableBorrowsETH)} more ETH`)
    return { availableBorrowsETH, totalDebtETH }
}

async function getDaiPrice() {
    // read only so don't need a signer
    const daiEthPriceFeed = await ethers.getContractAt(
        "AggregatorV3Interface",
        "0x773616E4d11A78F511299002da57A0a94577F1f4"
    )
    const feedResponse = await daiEthPriceFeed.latestRoundData()
    // https://docs.chain.link/data-feeds/api-reference#latestrounddata
    const price = feedResponse[1]
    console.log(`CONVERSTION RATE: 1.0 DAI == ${ethers.formatEther(price)} ETH`)
    return price
}

async function borrowDai(daiAddress, lendingPool, amount, onBehalfOf) {
    // https://docs.aave.com/developers/v/2.0/the-core-protocol/lendingpool#borrow
    // amount must be in wei units
    const interestRateMode = 2 // variable rate
    const referralCode = 0 // no referall code
    try {
        const tx = await lendingPool.borrow(
            daiAddress,
            amount,
            interestRateMode,
            referralCode,
            onBehalfOf
        )
        await tx.wait(1)
    } catch (e) {
        console.log("Borrow failed!")
        console.log(e)
    }
}

async function repay(assetAddress, amount, lendingPool, signerAddress) {
    console.log("Repaying...")

    // https://docs.aave.com/developers/v/2.0/the-core-protocol/lendingpool#repay
    const rateMode = 2 // variable rate
    const repayTx = await lendingPool.repay(assetAddress, amount, rateMode, signerAddress)
    await repayTx.wait(1)
    console.log(`Repaid ${ethers.formatEther(amount)} DAI`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
