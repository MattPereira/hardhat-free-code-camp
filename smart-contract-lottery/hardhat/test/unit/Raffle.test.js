const { assert, expect } = require("chai")

const helpers = require("@nomicfoundation/hardhat-network-helpers")

const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

// only run unit tests on local development networks
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Tests", function () {
          let raffle, vrfCoordinatorV2Mock, raffleEntranceFee, deployer, interval
          const chainId = network.config.chainId

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              raffle = await ethers.getContract("Raffle", deployer)
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
              raffleEntranceFee = await raffle.getEntranceFee()
              interval = await raffle.getInterval()
          })

          describe("constructor", function () {
              it("initializes the raffle correctly", async function () {
                  const raffleState = await raffle.getRaffleState()
                  const interval = await raffle.getInterval()
                  assert.equal(raffleState.toString(), "0") // 0 = OPEN
                  assert.equal(interval.toString(), networkConfig[chainId]["interval"])
              })
          })

          describe("enterRaffle", function () {
              it("reverts when you dont pay enough", async function () {
                  // helper-hardhat-config sets the entrance fee to 0.01 ETH
                  await expect(
                      raffle.enterRaffle({ value: ethers.parseEther("0.009") })
                  ).to.be.revertedWithCustomError(raffle, "Raffle__SendMoreToEnterRaffle")
              })
              it("records players when they enter", async function () {
                  // signer is "deployer" by default
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  const player = await raffle.getPlayer(0)
                  assert.equal(player, deployer)
              })

              it("emits event on enter", async function () {
                  await expect(raffle.enterRaffle({ value: raffleEntranceFee }))
                      .to.emit(raffle, "RaffleEnter")
                      .withArgs(deployer)
              })

              it("doesnt allow entrance while raffle state is calculating", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })

                  /***** low level JSON-RPC calls to EVM *****/
                  //   await network.provider.send("evm_increaseTime", [Number(interval) + 1])
                  //   await network.provider.send("evm_mine", [])
                  /***** hardhat-network-helpers plugin syntax to ff and mine *****/
                  await helpers.time.increase(interval + 1n) // fast forward time
                  await helpers.mine() // mine a block

                  // we pretend to be a chainlink keeper
                  await raffle.performUpkeep("0x") // arg is blank bytes object
                  await expect(
                      raffle.enterRaffle({ value: raffleEntranceFee })
                  ).to.be.revertedWithCustomError(raffle, "Raffle__NotOpen")
              })
          })

          describe("checkUpkeep", function () {
              it("returns false if people haven't sent any ETH", async function () {
                  await helpers.time.increase(Number(interval) + 1) // fast forward time
                  await helpers.mine() // mine a block
                  // https://docs.ethers.org/v6/api/contract/#BaseContractMethod-staticCall
                  console.log("-------------------------")
                  const { upkeepNeeded } = await raffle.checkUpkeep.staticCall("0x")
                  assert(!upkeepNeeded)
              })

              it("returns false if raffle isn't open", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee }) // enter raffle as deployer
                  await helpers.time.increase(interval + 1n) // fast forward time
                  await helpers.mine() // mine a block
                  await raffle.performUpkeep("0x") // arg is blank bytes object
                  const raffleState = await raffle.getRaffleState()
                  // https://docs.ethers.org/v6/api/contract/#BaseContractMethod-staticCall
                  const { upkeepNeeded } = await raffle.checkUpkeep.staticCall("0x") // arg is blank bytes object
                  assert.equal(raffleState.toString(), "1") // "1" -> CALCULATING
                  assert.equal(upkeepNeeded, false)
              })

              it("returns false if not enough time has passed", async function () {
                  // const interval = await raffle.getInterval()
                  // const lastTime = Number(await raffle.getLatestTimeStamp())
                  await raffle.enterRaffle({ value: raffleEntranceFee }) // enter raffle as deployer
                  await helpers.time.increase(interval - 5n) // less than interval time of "30"
                  //   const currTime = (await ethers.provider.getBlock()).timestamp
                  await helpers.mine() // mine a block
                  // https://docs.ethers.org/v6/api/contract/#BaseContractMethod-staticCall
                  const { upkeepNeeded } = await raffle.checkUpkeep.staticCall("0x") // arg is blank bytes object
                  assert.equal(upkeepNeeded, false)
              })

              it("returns true if enough time has passed, has playes, eth, and is open", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee }) // enter raffle as deployer
                  await helpers.time.increase(interval + 1n) // fast forward time
                  await helpers.mine() // mine a block
                  const { upkeepNeeded } = await raffle.checkUpkeep.staticCall("0x") // arg is blank bytes object
                  assert.equal(upkeepNeeded, true)
              })
          })

          describe("performUpkeep", function () {
              it("can only run if checkupkeep is true", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [Number(interval) + 1]) // move time forward
                  await network.provider.send("evm_mine", [])
                  const tx = await raffle.performUpkeep("0x") // empty bytes object
                  assert(tx)
              })

              it("reverts if checkupkeep is false", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee }) // enter raffle as deployer
                  await expect(raffle.performUpkeep("0x")).to.be.revertedWithCustomError(
                      raffle,
                      "Raffle__UpkeepNotNeeded"
                  )
              })

              it("updates the raffle state, emits an event, and calls the vrf coordinator", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await helpers.time.increase(Number(interval) + 1) // fast forward time
                  await helpers.mine() // mine a block
                  const txResponse = await raffle.performUpkeep("0x")
                  const txReceipt = await txResponse.wait(1)
                  // second event emitted by "performUpkeep" contains the requestId
                  const requestId = txReceipt.logs[1].args.requestId
                  const raffleState = await raffle.getRaffleState()
                  assert(requestId > 0n)
                  assert(Number(raffleState) === 1)
              })

              describe("fullfillRandomWords", function () {
                  beforeEach(async function () {
                      // necessary conditions to set up before calling fulfillRandomWords
                      await raffle.enterRaffle({ value: raffleEntranceFee }) // enter raffle ( as deployer )
                      await network.provider.send("evm_increaseTime", [Number(interval) + 1]) // fast forward time
                      await network.provider.send("evm_mine", []) // mine a block
                  })

                  it("can only be called after performUpkeep", async function () {
                      // https://github.com/smartcontractkit/chainlink/blob/fcf7da19a1ae4106101185aaf94ce3fcffbd194f/contracts/src/v0.8/mocks/VRFCoordinatorV2Mock.sol#L102C17-L102C17
                      await expect(
                          vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.target)
                      ).to.be.revertedWith("nonexistent request")

                      await expect(
                          vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.target)
                      ).to.be.revertedWith("nonexistent request")
                  })

                  it("picks a winner, resets the lottery, and sends the money", async function () {
                      const additionalEntrants = 3
                      const startingAccountIdx = 1 // rembmer deployer = 0
                      const accounts = await ethers.getSigners()
                      // enter 3 additional players into the lotto
                      for (
                          let i = startingAccountIdx;
                          i < startingAccountIdx + additionalEntrants;
                          i++
                      ) {
                          const accountConnectedRaffle = raffle.connect(accounts[i])
                          await accountConnectedRaffle.enterRaffle({ value: raffleEntranceFee })
                      }

                      const startingTimeStamp = await raffle.getLatestTimeStamp()

                      // performUpkeep (mock being chainlink keepers)
                      // fulfillRandomWords (mock being chainlink VRF)
                      // We will have to wait for the fullfillRandomWords to be called
                      await new Promise(async (resolve, reject) => {
                          // Setting up the listener
                          raffle.once("WinnerPicked", async () => {
                              console.log("Listener found the event!")
                              try {
                                  // Found accounts[idx] of winner with console.logs of recent winner and accounts. Will be the same winner every time in testing environment
                                  const raffleState = await raffle.getRaffleState()
                                  const endingTimestamp = await raffle.getLatestTimeStamp()
                                  const numPlayers = await raffle.getNumberOfPlayers()
                                  const winnerEndingBalance = await ethers.provider.getBalance(
                                      accounts[1]
                                  )
                                  assert.equal(numPlayers, 0n)
                                  assert.equal(raffleState, 0n)
                                  assert(endingTimestamp > startingTimeStamp)
                                  assert.equal(
                                      winnerEndingBalance,
                                      winnerStartingBalance +
                                          (raffleEntranceFee * BigInt(additionalEntrants) +
                                              raffleEntranceFee)
                                  )
                                  resolve()
                              } catch (e) {
                                  reject(e)
                              }
                          })
                          // As "WinnerPicked" event is fired the listener will pick it up and resovle the promise
                          const tx = await raffle.performUpkeep("0x")
                          const txReceipt = await tx.wait(1)
                          const requestId = txReceipt.logs[1].args.requestId
                          const consumerAddress = raffle.target
                          const winnerStartingBalance = await ethers.provider.getBalance(
                              accounts[1]
                          )
                          await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, consumerAddress)
                      })
                  })
              })
          })
      })
