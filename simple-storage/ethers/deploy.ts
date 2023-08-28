import { ethers } from "ethers"
import * as fs from "fs-extra"
import "dotenv/config"

async function main() {
    // http://0.0.0.0:8545
    // connect to local blockchain

    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL!)
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider)

    const abi = fs.readFileSync("./SimpleStorage_sol_SimpleStorage.abi", "utf8")

    const binary = fs.readFileSync(
        "./SimpleStorage_sol_SimpleStorage.bin",
        "utf8",
    )

    const factory = new ethers.ContractFactory(abi, binary, wallet)
    console.log("Deploying, please wait....")
    const contract = await factory.deploy()
    await contract.waitForDeployment()
    console.log(`Contract Address: ${contract.getAddress()}`)

    const currentFavoriteNumber = await contract.retrieve()
    console.log(`CURRENT FAV NUM: ${currentFavoriteNumber.toString()}`)
    const transactionResponse = await contract.store("7")
    console.log("RESPONSE:", transactionResponse)
    const transactionReceipt = await transactionResponse.wait(1)
    console.log("RECEIPT:", transactionReceipt)
    const updatedFavoriteNumber = await contract.retrieve()
    console.log(`UPDATED FAV NUM: ${updatedFavoriteNumber.toString()}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
