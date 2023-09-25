const { assert, expect } = require("chai")

const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")

// HH ethers docs -> https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-ethers

// only run unit tests on local development networks
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("BasicNft Unit Tests", function () {
          // outermost scope variables so all the tests can access
          let basicNft, deployer, collector

          beforeEach(async function () {
              // getNamedAccounts comes from hardhat-deploy pkg -> https://github.com/wighawag/hardhat-deploy#hardhat-environment-extensions
              // named accounts comes from hardhat.config
              deployer = (await getNamedAccounts()).deployer // returns address only
              collector = (await getNamedAccounts()).collector // returns address only
              await deployments.fixture(["all"]) // fixtures are declared at bottom of deploy scripts
              basicNft = await ethers.getContract("BasicNft", deployer)
          })

          describe("constructor", function () {
              it("initializes the BasicNft correctly", async function () {
                  const name = await basicNft.name()
                  const symbol = await basicNft.symbol()
                  assert.equal(name, "Doggie")
                  assert.equal(symbol, "DOG")
              })
          })

          describe("mint", function () {
              it("allows collectors to mint NFTs", async function () {
                  console.log("COLECTOOOR", collector)
                  const collectorSigner = await ethers.getSigner(collector)
                  const basicNftAsCollector = await basicNft.connect(collectorSigner)
                  await basicNftAsCollector.mintNft()

                  // https://docs.openzeppelin.com/contracts/4.x/api/token/erc721#IERC721
                  const ownerAddress = await basicNft.ownerOf(0)
                  assert.equal(ownerAddress, collector)
                  const balance = await basicNft.balanceOf(collector)
                  assert.equal(balance, 1)
              })

              it("updates token counter after mint", async function () {
                  const tokenCounterBefore = await basicNft.getTokenCounter()
                  assert.equal(tokenCounterBefore, 0)

                  await basicNft.mintNft()
                  const tokenCounterAfter = await basicNft.getTokenCounter()
                  assert.equal(tokenCounterAfter, 1)
              })
          })

          describe("tokenURI", function () {
              it("has the correct tokenURI", async function () {
                  await basicNft.mintNft()

                  const tokenUri = await basicNft.tokenURI(0)
                  assert.equal(
                      tokenUri,
                      "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4"
                  )
              })

              it("reverts if the token id does not exist", async function () {
                  await expect(basicNft.tokenURI(0)).to.be.revertedWith(
                      "ERC721Metadata: URI query for nonexistent token"
                  )
              })
          })
      })
