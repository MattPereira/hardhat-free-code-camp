const networkConfig = {
    31337: {
        name: "hardhat",
        wethToken: { symbol: "WETH", address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" },
        daiToken: { symbol: "DAI", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F" },
        lendingPoolAddressesProvider: "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
    },
}

module.exports = { networkConfig }
