const { deploy } = require('./library.js');

async function main() {
    const [exchangeOwner] = await ethers.getSigners();
    console.log("-----------------------------------------------------------");
    console.log("Deploying contracts with the account:", exchangeOwner.address);
    console.log("-----------------------------------------------------------\n");
    await deploy(exchangeOwner, "Create2Deployer", "");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("debug-error:" , error);
      process.exit(1);
    });