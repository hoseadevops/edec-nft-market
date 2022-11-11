const { deploy, getConfig } = require('./library.js');

async function main() {

    let configed = await getConfig();
    if(configed.MarketRegistry === undefined) {
        throw new Error("deploy MarketRegistry first");
    }

    const [exchangeOwner] = await ethers.getSigners();
    console.log("-----------------------------------------------------------");
    console.log("Deploying contracts with the account:", exchangeOwner.address);
    console.log("-----------------------------------------------------------\n");

    await deploy(exchangeOwner, "MarketTokenTransferProxy", "", configed.MarketRegistry);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("debug-error:" , error);
      process.exit(1);
    });