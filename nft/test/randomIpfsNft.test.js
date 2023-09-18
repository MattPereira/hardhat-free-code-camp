const { assert, expect } = require("chai")

const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")

// HH ethers docs -> https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-ethers

// only run unit tests on local development networks
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("RandomIpfsNft Unit Tests", function () {
          // outermost scope variables so all the tests can access
          let nftContract, vrfCoordinatorV2Mock, deployer, collector, mintFee

          beforeEach(async function () {
              // getNamedAccounts comes from hardhat-deploy pkg -> https://github.com/wighawag/hardhat-deploy#hardhat-environment-extensions
              // named accounts comes from hardhat.config
              deployer = (await getNamedAccounts()).deployer // returns address only
              collector = (await getNamedAccounts()).collector // returns address only
              await deployments.fixture(["mocks", "randomipfs"]) // fixtures are declared at bottom of deploy scripts
              nftContract = await ethers.getContract("RandomIpfsNft", deployer)
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
              mintFee = await nftContract.getMintFee()
          })

          describe("constructor", function () {
              it("initializes the nftContract correctly", async function () {
                  const name = await nftContract.name()
                  const symbol = await nftContract.symbol()
                  assert.equal(name, "Random IPFS NFT")
                  assert.equal(symbol, "RIN")
              })
          })

          describe("requestNft()", function () {
              it("reverts if no funds are sent", async function () {
                  await expect(nftContract.requestNft()).to.be.revertedWithCustomError(
                      nftContract,
                      "RandomIpfsNft_InsufficientETHSent"
                  )
              })
              it("reverts if insufficient funds are sent", async function () {
                  await expect(
                      nftContract.requestNft({ value: ethers.parseEther("0.05") })
                  ).to.be.revertedWithCustomError(nftContract, "RandomIpfsNft_InsufficientETHSent")
              })
              it("emits event on successful requestNft() call", async function () {
                  await expect(nftContract.requestNft({ value: ethers.parseEther("0.1") })).to.emit(
                      nftContract,
                      "NftRequested"
                  )
              })
              it("adds msg.sender to mapping that tracks who sent the request", async function () {
                  const tx = await nftContract.requestNft({ value: mintFee })
                  const txReceipt = await tx.wait(1)
                  const requestId = txReceipt.logs[1].args.requestId
                  const requesterAddress = await nftContract.s_requestIdToSender(requestId)
                  expect(requesterAddress).to.equal(deployer)
              })
          })

          describe("fulfillRandomWords", () => {
              it("mints NFT after random number is returned", async function () {
                  await new Promise(async (resolve, reject) => {
                      nftContract.once("NftMinted", async () => {
                          try {
                              const tokenUri = await nftContract.tokenURI("0")
                              const tokenCounter = await nftContract.getTokenCounter()
                              assert.equal(tokenUri.toString().includes("ipfs://"), true)
                              assert.equal(tokenCounter.toString(), "1")
                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      try {
                          const fee = await nftContract.getMintFee()
                          const requestNftResponse = await nftContract.requestNft({
                              value: fee.toString(),
                          })
                          const requestNftReceipt = await requestNftResponse.wait(1)
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              requestNftReceipt.logs[1].args.requestId,
                              nftContract.target
                          )
                      } catch (e) {
                          console.log(e)
                          reject(e)
                      }
                  })
              })
          })

          describe("getBreedFromModdedRng", () => {
              it("should return pug if moddedRng < 10", async function () {
                  const expectedValue = await nftContract.getBreedFromModdedRng(7)
                  assert.equal(0, expectedValue)
              })
              it("should return shiba-inu if moddedRng is between 10 - 39", async function () {
                  const expectedValue = await nftContract.getBreedFromModdedRng(21)
                  assert.equal(1, expectedValue)
              })
              it("should return st. bernard if moddedRng is between 40 - 99", async function () {
                  const expectedValue = await nftContract.getBreedFromModdedRng(77)
                  assert.equal(2, expectedValue)
              })
              it("should revert if moddedRng > 99", async function () {
                  await expect(
                      nftContract.getBreedFromModdedRng(100)
                  ).to.be.revertedWithCustomError(nftContract, "RandomIpfsNft_RangeOutOfBounds")
              })
          })
      })
