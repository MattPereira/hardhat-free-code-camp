// imports
const {ethers, run, network} = require("hardhat");

//async main
async function main() {
  const SimpleStorageFactory = await ethers.getContractFactory("SimpleStorage");
  console.log("Sending Deployment Transaction...");
  const simpleStorage = await SimpleStorageFactory.deploy();
  console.log("Waiting for deployment transaction to be mined...");
  await simpleStorage.waitForDeployment();

  console.log("Deployed contract to: " + simpleStorage.target);

  if(network.name === "sepolia" && process.env.ETHERSCAN_API_KEY){
    console.log("Waiting for 5 blocks to be mined...");
    await waitForBlocks(5);
    await verify(await simpleStorage.getAddress(), []);
  }

  const currentValue = await simpleStorage.retrieve();
  console.log("Current Value:", currentValue.toString());

  const transactionResponse = await simpleStorage.store(7);
  await transactionResponse.wait(1);
  const updatedValue = await simpleStorage.retrieve();
  console.log("Updated Value is:", updatedValue.toString());

}

async function verify(contractAddress, args) {
  console.log("Verifying contract....");
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (err){
    if(err.message.toLowerCase().includes("already verified")){
      console.log("Contract already verified");
    } else {  
      console.log("Failed to verify contract");
      console.log(err);
    }
  }
}

async function waitForBlocks(numBlocks) {
  const currentBlock = await ethers.provider.getBlockNumber();
  const targetBlock = currentBlock + numBlocks;
  console.log('currentBlock:', currentBlock);
  console.log('targetBlock:', targetBlock);
  
  while (true) {
      const latestBlock = await ethers.provider.getBlockNumber();
      console.log('latest block: ' + latestBlock);
      
      if (latestBlock >= targetBlock) {
        console.log('target block reached');
          break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before checking again
  }
}

// main
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
