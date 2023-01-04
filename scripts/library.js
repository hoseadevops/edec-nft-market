const fs = require('fs');
const hre = require('hardhat');
/** 获取配置 文件名称
 * @returns '${chainId}.contract.deployed.json'
 */
async function getConfigFile() {
    const networkName = hre.network.name;
    const suffix = ".deployed.json"
    return networkName + suffix;
}

/** 读配置 （没有则创建配置文件）
 * @returns { json }
 */
async function getConfig() {
    try {
        let rawdata = fs.readFileSync(await getConfigFile());
        return JSON.parse(rawdata);
    } catch {
        await setConfig({});
        return {};
    }
}
/** 写配置
 * @param { json } jsonData 
 */
async function setConfig(jsonData) {
    let data = JSON.stringify(jsonData);
    fs.writeFileSync(await getConfigFile(), data);
}

/** 获取项目主合约
 * 
 * @param {获取到的配置} config 
 * @param {链接的用户} signer 
 * @returns 
 */
async function getDeployed(config, signer) {
    // load contract
    const MarketRegistry = await ethers.getContractFactory("MarketRegistry", {signer : signer});
    const TokenTransferProxy = await ethers.getContractFactory("MarketTokenTransferProxy", {signer : signer});
    const MarketExchange = await ethers.getContractFactory("MarketExchange", {signer : signer});
    const NFTMarketWrap = await ethers.getContractFactory("NFTMarketWrap", {signer : signer});
    const Atomicizer = await ethers.getContractFactory("Atomicizer", {signer : signer});
   
    const registry = MarketRegistry.attach(config.MarketRegistry);
    const tokenTransferProxy = TokenTransferProxy.attach(config.MarketTokenTransferProxy);
    const exchange = MarketExchange.attach(config.MarketExchange);
    const exchangeWrap = NFTMarketWrap.attach(config.NFTMarketWrap);
    const atomicizer = Atomicizer.attach(config.Atomicizer);

    return {
        registry: registry,
        tokenTransferProxy: tokenTransferProxy, 
        exchange: exchange,
        exchangeWrap: exchangeWrap,
        atomicizer: atomicizer
    }
}

/** 获取项目 mock 合约
 * 
 * @param {获取到的配置} config 
 * @param {链接的用户} signer 
 * @returns 
 */
async function getMockDeployed(config, signer) {
    // load contract
    const ERC721Mock = await ethers.getContractFactory("ERC721Mock", {signer : signer});
    const ERC1155Mock = await ethers.getContractFactory("ERC1155Mock", {signer : signer});
    const ERC20Mock = await ethers.getContractFactory("ERC20Mock", {signer : signer});

    const ERC721Mock_art  = ERC721Mock.attach(config.ERC721Mock_art);
    const ERC721Mock_vr   = ERC721Mock.attach(config.ERC721Mock_vr);
    const ERC721Mock_game = ERC721Mock.attach(config.ERC721Mock_game);

    const ERC1155Mock_art  = ERC1155Mock.attach(config.ERC1155Mock_art);
    const ERC1155Mock_vr   = ERC1155Mock.attach(config.ERC1155Mock_vr);
    const ERC1155Mock_game = ERC1155Mock.attach(config.ERC1155Mock_game);

    const ERC20Mock_UNI  = ERC20Mock.attach(config.ERC20Mock_UNI);
    const ERC20Mock_HT   = ERC20Mock.attach(config.ERC20Mock_HT);
    const ERC20Mock_BTC  = ERC20Mock.attach(config.ERC20Mock_BTC);
    const ERC20Mock_USDT = ERC20Mock.attach(config.ERC20Mock_USDT);
    const ERC20Mock_FEE  = ERC20Mock.attach(config.ERC20Mock_FEE);

    return {
        art721: ERC721Mock_art,
        vr721: ERC721Mock_vr, 
        game721: ERC721Mock_game,

        art1155: ERC1155Mock_art,
        vr1155: ERC1155Mock_vr, 
        game1155: ERC1155Mock_game,

        ht20: ERC20Mock_HT,
        uni20: ERC20Mock_UNI,
        btc20: ERC20Mock_BTC,
        usdt20: ERC20Mock_USDT,
        fee20: ERC20Mock_FEE,
    }
}

async function getDeployedMD(config, signer) {
    console.log("debug", config);
    // load contract
    const MerkleDistributor = await ethers.getContractFactory("MerkleDistributor", {signer : signer});
    const Deposit = await ethers.getContractFactory("Deposit", {signer : signer});

    const ERC721Mock = await ethers.getContractFactory("ERC721Mock", {signer : signer});
    const ERC1155Mock = await ethers.getContractFactory("ERC1155Mock", {signer : signer});
    const ERC20Mock = await ethers.getContractFactory("ERC20Mock", {signer : signer});
   
    const art1155  = ERC1155Mock.attach(config.ERC1155Mock_art);
    const art721  = ERC721Mock.attach(config.ERC721Mock_art);
    const erc20  = ERC20Mock.attach(config.ERC20Mock_FEE);

    const merkleDistributor = MerkleDistributor.attach(config.MerkleDistributor);
    const deposit = Deposit.attach(config.Deposit);

    return {
        merkleDistributor,
        deposit,
        art1155,
        art721,
        erc20
    }
}


/**  部署合约
 * 
 * @param {acount object} signer 
 * @param {need to deploy contract name} contract 
 * @param {tag} tag 
 * @param  {...any} arg 
 * @returns 部署的合约
 */
async function deploy(signer, contract, tag, ...arg ) {

    // get config
    let config = await getConfig();
    let mark = contract;
    if(tag){
        mark = contract + "_" + tag;
    }
    // config checkout 
    if(config[mark] !== undefined) {
        console.log(`${mark} deployed already!: `, config[mark]);
        return;
    }
    // init
    const Contract = await ethers.getContractFactory(contract, { signer: signer });
    
    // calculate gas
    await gasCalculate( await signer.estimateGas(Contract.getDeployTransaction(...arg)) );

    // deploy
    const instance = await Contract.deploy(...arg);
    
    // verify
    const networkName = hre.network.name;
    console.log(`yarn run verify --network ${networkName} ${instance.address} ${arg.join(" ")}`);

    // log
    delete instance.deployTransaction['data'];
    console.log(`${mark} deployTransaction`, instance.deployTransaction);

    // waitting deployed
    await instance.deployTransaction.wait();
    console.log(`${mark} deployed ${instance.address} \n`);

    // set config
    config[mark] = instance.address;
    await setConfig(config);

    // return contract
    return instance;
}

/** 计算 gas && 检测 gas
 * @param {gas} estimatedGas 
 */
async function gasCalculate(estimatedGas) {
    const [signer] = await ethers.getSigners();
    const gasPrice = await signer.getGasPrice();
    const deploymentPrice = gasPrice.mul(estimatedGas);
    const deployerBalance = await signer.getBalance();
    console.log({
        "Current gas price": gasPrice,
        "Estimated gas" : estimatedGas,
        "Deployer balance" : ethers.utils.formatEther(deployerBalance),
        "Deployment need price" : ethers.utils.formatEther(deploymentPrice) 
    });   

    if (Number(deployerBalance) < Number(deploymentPrice)) {
        throw new Error("You dont have enough balance to send.");
    }
}

// cancel demo
async function cancelTX(nonceOfPendingTx, gasPriceHigherThanPendingTx) {
    const [deployer] = await ethers.getSigners();
    const tx = {
        nonce: nonceOfPendingTx,
        to: ethers.constants.AddressZero,
        data: '0x',
        gasPrice: gasPriceHigherThanPendingTx
      }; // costs 21000 gas
      
      await signer.sendTransaction(tx);
}

// speed up demo
// https://stats.goerli.net/
// https://goerli.etherscan.io/txs
let overrides = {
    gasPrice: 75490945963, // (75.49 Gwei)
    nonce: 24
};

function generateArray (start, end) {
    return Array.from(new Array(end + 1).keys()).slice(start)
}

/** 用户注册自己的钱包
 *  
 * @param {*} deployed
 * @param {*} user 
 */
 async function registerWallet(deployed, user) {
    const register = await deployed.registry.proxies(user.address);
    console.log("debug-register:", register);
    if(register == '0x0000000000000000000000000000000000000000') {
        const tx = await deployed.registry.connect(user).registerProxy();
        console.log(tx);
        await tx.wait();
        console.log(`User ${ (user.address)} is registed.`);
    }else{
        console.log(`User ${ (user.address)} is registed already!`);
    }
}

module.exports = { gasCalculate, getConfig, setConfig , deploy, getMockDeployed, getDeployed, generateArray, overrides, registerWallet, getDeployedMD }