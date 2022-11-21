const { deploy, getConfig } = require('./library.js');

require("dotenv").config();

const { FEE_TOKEN, PROTOCAL_FEE_ADDRESS } = process.env;


async function main() {

    let configed = await getConfig();
    if(configed.MarketRegistry === undefined || configed.MarketTokenTransferProxy === undefined) {
        throw new Error(`deploy MarketRegistry or MarketTokenTransferProxy first`);
    }
    const [exchangeOwner] = await ethers.getSigners();
    console.log("-----------------------------------------------------------");
    console.log("Deploying contracts with the account:", exchangeOwner.address);
    console.log("Env:", configed.MarketRegistry, configed.MarketTokenTransferProxy, FEE_TOKEN, PROTOCAL_FEE_ADDRESS);
    console.log("-----------------------------------------------------------\n");
    await deploy(exchangeOwner, "MarketExchange", "", configed.MarketRegistry, configed.MarketTokenTransferProxy, FEE_TOKEN, PROTOCAL_FEE_ADDRESS);
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("debug-error:" , error);
      process.exit(1);
    });