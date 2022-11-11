const { deploy, getConfig } = require('./library.js');

async function main() {

    let configed = await getConfig();
    
    if(configed.MarketExchange === undefined) {
        throw new Error("deploy MarketExchangeWrap first");
    }

    const [exchangeOwner] = await ethers.getSigners();
    console.log("-----------------------------------------------------------\n");
    console.log("Deploying contracts with the account:", exchangeOwner.address);
    console.log("-----------------------------------------------------------\n");

    await deploy(exchangeOwner, "NFTMarketWrap", "", configed.MarketExchange);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("debug-error:" , error);
      process.exit(1);
    });