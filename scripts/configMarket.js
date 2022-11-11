const {getConfig, gasCalculate} = require('./library.js');

async function main() {
    
    const [exchangeOwner] = await ethers.getSigners();
    console.log("-----------------------------------------------------------");
    console.log("signer with the account:", exchangeOwner.address);
    console.log("-----------------------------------------------------------\n");
    
    // load contract
    const MarketRegistry = await ethers.getContractFactory("MarketRegistry", {signer : exchangeOwner});
    const MarketExchange = await ethers.getContractFactory("MarketExchange", {signer : exchangeOwner});
    const NFTMarketWrap  = await ethers.getContractFactory("NFTMarketWrap", {signer : exchangeOwner});
    
    let configed = await getConfig();
    
    // check parameters
    if(configed.MarketRegistry === undefined) {
        throw new Error("deploy MarketRegistry first");
    }
    if(configed.MarketExchange === undefined) {
        throw new Error("deploy MarketExchange first");
    }
    if(configed.NFTMarketWrap === undefined) {
        throw new Error("deploy NFTMarketWrap first");
    }

    const marketRegistry = MarketRegistry.attach(configed.MarketRegistry);
    const marketExchange = MarketExchange.attach(configed.MarketExchange);
    const nftMarketWrap  = MarketExchange.attach(configed.NFTMarketWrap);

    // dapp configed 
    let isInit = await marketRegistry.initialAddressSet();
    console.log(`Got register init state is: ${isInit}`);
    if (!isInit) {
        // gas
        await gasCalculate (
            await marketRegistry.estimateGas.grantInitialAuthentication(marketExchange.address)
        );
        const tx1 = await marketRegistry.grantInitialAuthentication(marketExchange.address);
        console.log("marketRegistry grantInitialAuthentication transaction:", tx1);
        await tx1.wait();
        console.log(`grantInitialAuthentication done as ${marketExchange.address}`);

        // wrap
        const tx2 = await marketExchange.changeExchangeWrap(nftMarketWrap.address);
        await tx2.wait();
        getExchangeWrap = await marketExchange.exchangeWrap();
        console.log(`set ExchangeWrap done as ${getExchangeWrap}`);
    }else{
        console.log("grantInitialAuthentication already!");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("debug-error:" , error);
      process.exit(1);
    });