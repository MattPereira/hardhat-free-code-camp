const { run } = require("hardhat")

async function verify(contractAddress, args) {
    console.log("Verifying contract....")
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        })
    } catch (err) {
        if (err.message.toLowerCase().includes("already verified")) {
            console.log("Contract already verified")
        } else {
            console.log("Failed to verify contract")
            console.log(err)
        }
    }
}

module.exports = { verify }
