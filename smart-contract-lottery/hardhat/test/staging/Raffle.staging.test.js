const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const helpers = require("@nomicfoundation/hardhat-network-helpers")

/** STAGING TEST SET UP
 * 1. Get subscriptionId from vrf.chain.link
 * 2. Deploy contract using the subscriptionId
 * 3. Register the deployed contract with Chainlink VRF
 * 4. Register the contract with Chainlink keepers
 * 5. Run the staging tests below
 */

// do not run staging tests on local development networks
developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Tests", function () {
          let raffle, raffleEntranceFee, deployer

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              raffle = await ethers.getContract("Raffle", deployer)
              raffleEntranceFee = await raffle.getEntranceFee()
          })

          describe("fullfillRandomWords", function () {
              it("works with live Chainlink Keepers and Chainlink VRF, we get a random winner", async function () {
                  console.log("begin staging test...")
                  const startingTimestamp = await raffle.getLatestTimeStamp()
                  const accounts = await ethers.getSigners()

                  console.log("Setting up Listener...")
                  await new Promise(async (resolve, reject) => {
                      // Set up listener before we enter the raffle
                      raffle.once("WinnerPicked", async () => {
                          console.log("WinnerPicked event fired!")
                          try {
                              console.log("gathering raffle state data...")
                              const recentWinner = await raffle.getRecentWinner()
                              const raffleState = await raffle.getRaffleState()
                              const winnerEndingBalance = await ethers.provider.getBalance(
                                  accounts[0]
                              )
                              const endingTimestamp = await raffle.getLatestTimeStamp()

                              console.log("expecing revert...")
                              await expect(raffle.getPlayer(0)).to.be.reverted
                              console.log("asserting raffle winner...")
                              assert.equal(recentWinner.toString(), accounts[0].address)
                              assert.equal(raffleState, 0)
                              console.log("asserting raffle winner's ending balance...")
                              assert.equal(
                                  winnerEndingBalance,
                                  winnerStartingBalance + raffleEntranceFee
                              )
                              assert(endingTimestamp > startingTimestamp)
                              resolve()
                          } catch (e) {
                              console.log("OH NO AN ERROR!")
                              console.log(e)
                              reject(e)
                          }
                      })
                      console.log("entering the raffle...")
                      const tx = await raffle.enterRaffle({ value: raffleEntranceFee })
                      console.log("trasaction sent!")
                      await tx.wait(1)
                      console.log("transaction mined!")
                      console.log("Waiting for event listener for WinnerPicked to fire...")
                      const winnerStartingBalance = await ethers.provider.getBalance(accounts[0])
                  })

                  // code wont complete until the event listener is triggered
              })
          })
      })
