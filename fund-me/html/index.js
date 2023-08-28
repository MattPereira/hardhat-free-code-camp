import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js"
import { abi, contractAddress } from "./constants.js"

const connectButton = document.getElementById("connectButton")
const fundButton = document.getElementById("fundButton")
const balanceButton = document.getElementById("balanceButton")
const withdrawButton = document.getElementById("withdrawButton")

connectButton.onclick = connect
fundButton.onclick = fund
balanceButton.onclick = getBalance
withdrawButton.onclick = withdraw

console.log(ethers)

async function connect() {
    if (typeof window.ethereum !== "undefined") {
        await window.ethereum.request({ method: "eth_requestAccounts" })
        document.getElementById("connectButton").innerHTML = "Connected!"
        connectButton.innerHTML = "Connected!"
    } else {
        connectButton.innerHTML = "Please install metamask!"
    }
}

async function fund() {
    const ethAmount = document.getElementById("ethAmount").value
    console.log(`Funding with ${ethAmount}...`)
    if (typeof window.ethereum !== "undefined") {
        try {
            // connection to the blockchain
            const provider = new ethers.BrowserProvider(window.ethereum)

            // the user who will interact with the blockchain
            const signer = await provider.getSigner()

            // contract that we are interacting with (address, abi, signer)
            const contract = new ethers.BaseContract(
                contractAddress,
                abi,
                signer
            )

            // interact with the contract
            const transactionResponse = await contract.fund({
                value: ethers.parseEther(ethAmount),
            })
            // listen for the tx to be mined
            await listenForTransactionMine(transactionResponse, provider)

            console.log("Done")
        } catch (error) {
            console.log(error)
        }
    }
}

function listenForTransactionMine(transactionResponse, provider) {
    console.log(`Mining ${transactionResponse.hash}...`)
    // listen for tranaction to finish
    return new Promise(async (resolve, reject) => {
        provider.once(transactionResponse.hash, (transactionReceipt) => {
            console.log(
                `Completed with ${transactionReceipt.confirmations} confirmations`
            )
            resolve()
        })
    })
}

async function getBalance() {
    if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.BrowserProvider(window.ethereum)

        const balance = await provider.getBalance(contractAddress)

        console.log(ethers.formatEther(balance))
    }
}

async function withdraw() {
    if (typeof window.ethereum !== "undefined") {
        console.log("Withdrawing...")
        const provider = new ethers.BrowserProvider(window.ethereum)
        // the user who will interact with the blockchain
        const signer = await provider.getSigner()

        // contract that we are interacting with (address, abi, signer)
        const contract = new ethers.BaseContract(contractAddress, abi, signer)

        try {
            const txResponse = await contract.withdraw()
            await listenForTransactionMine(txResponse, provider)
        } catch (error) {}
    }
}
