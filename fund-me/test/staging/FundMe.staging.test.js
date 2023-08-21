const { getNamedAccounts, ethers, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { assert } = require("chai")

// staging tests only run on testnets like "sepolia"
developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe
          let deployer
          const sendValue = ethers.parseUnits("1", "ether") // 1000000000000000000 wei

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              fundMe = await ethers.getContract("FundMe", deployer)
          })

          it("allows people to fund and withdraw", async function () {
              console.log("Funding...")
              const fundTxResponse = await fundMe.fund({ value: sendValue })
              await fundTxResponse.wait(1)
              console.log("Withdrawing...")
              const withdrawTxResponse = await fundMe.withdraw()
              await withdrawTxResponse.wait(1)
              const endingContractBalance = await ethers.provider.getBalance(
                  fundMe.target
              )
              assert.equal(endingContractBalance.toString(), "0")
          })
      })
