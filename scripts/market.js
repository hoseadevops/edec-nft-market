const { getConfig, getDeployed, getMockDeployed, generateArray, registerWallet } = require('./library.js');
const { 
    encodeERC721ReplacementPatternSell,
    encodeERC721ReplacementPatternBuy,
    encodeERC1155ReplacementPatternSell,
    encodeERC1155ReplacementPatternBuy,

    ZERO_ADDRESS,
    ZERO_HASH,
    ZERO,
    SALT,
    kind,

    sellERC721ABI,
    buyERC721ABI,

    makeOrder,
    signature,
    getHashOrder,
    getHashSign,
    validateOrderParameters,
    validateOrder,
    orderCalldataCanMatch,
    orderCanMatch,
    atomicMatch,
    getMockTokenAsset,
    result,
    requireMatchOrder,
    makeMatchOrder,
    makeMatchOrderGoerli
 } = require('./common.js');

const helpers = require("@nomicfoundation/hardhat-network-helpers");

const scheme_nft_to_eth = (nft, seller, buyer, item, price, paymentToken, kind) => {
    return {
        nft   : nft,
        seller: seller,
        buyer : buyer,
        item  : item, 
        basePrice:  price,
        paymentToken: paymentToken,
        kind,
    }
};

async function match721Order(deployed, mockDeployed, accounts, accountsAssets)
{
    const [rock, hosea, yety, suky, join, bob] = accounts;
    const [rock_asset, hosea_asset, yety_asset, suky_asset, join_asset, bob_asset] = accountsAssets;
    
    // rock 以 price 价格 出售 nft asset 
    const scheme = scheme_nft_to_eth(
        mockDeployed.art721, 
        rock, 
        hosea, 
        rock_asset[3],
        ethers.BigNumber.from(10000), 
        ZERO_ADDRESS,
        kind.ERC721
    );

    let param = {
        saleKind: 0,                              // enum SaleKind { FixedPrice, DutchAuction }
        howToCall: 0,                             // enum HowToCall { Call, DelegateCall }
        feeMethod: 1,                             // enum FeeMethod { ProtocolFee, SplitFee }
        extra: 0                                  // 
    }; 

    console.log(param, {
        "nft": scheme.nft.address,
        "seller": scheme.seller.address,
        "buyer" : scheme.buyer.address,
        "item" : scheme.item,
        "basePrice" : scheme.basePrice,
        "paymentToken" : scheme.paymentToken,
        "kind" : scheme.kind
    });

    param = Object.assign(param, scheme);

    const orders = await makeMatchOrder( deployed, param );

    await requireMatchOrder(deployed, orders.buy, orders.sell, hosea, rock, hosea);
    
    // sender 
    const override = {
        value: ethers.utils.parseEther("2"),
        gasLimit: 4100000
    };

    await atomicMatch(deployed, orders.buy, orders.sell, hosea, rock, hosea, override);

    await result(scheme);
}

async function match1155Order(deployed, mockDeployed, accounts, accountsAssets)
{
    const [rock, hosea, yety, suky, join, bob] = accounts;
    const [rock_asset, hosea_asset, yety_asset, suky_asset, join_asset, bob_asset] = accountsAssets;
    
    // rock 以 price 价格 出售 nft asset 
    const scheme_nft_to_eth = (nft, seller, buyer, item, price, paymentToken, kind, value) => {
        return {
            nft   : nft,
            seller: seller,
            buyer : buyer,
            item  : item, 
            basePrice:  price,
            paymentToken: paymentToken,
            kind,
            value
        }
    };
    const scheme = scheme_nft_to_eth(
        mockDeployed.art1155,
        rock, 
        hosea, 
        rock_asset[3],
        ethers.BigNumber.from(10000), 
        ZERO_ADDRESS,
        kind.ERC1155,
        1
    );

    let param = {
        saleKind: 0,                              // enum SaleKind { FixedPrice, DutchAuction }
        howToCall: 0,                             // enum HowToCall { Call, DelegateCall }
        feeMethod: 1,                             // enum FeeMethod { ProtocolFee, SplitFee }
        extra: 0                                  // 
    }; 

    
    console.log(param, {
        "nft": scheme.nft.address,
        "seller": scheme.seller.address,
        "buyer" : scheme.buyer.address,
        "item" : scheme.item,
        "basePrice" : scheme.basePrice,
        "paymentToken" : scheme.paymentToken,
        "kind" : scheme.kind
    });

    param = Object.assign(param, scheme);

    const orders = await makeMatchOrder( deployed, param );

    await requireMatchOrder(deployed, orders.buy, orders.sell, hosea, rock, hosea);
    
    // sender 
    const override = {
        value: ethers.utils.parseEther("2"),
        gasLimit: 4100000
    };

    await atomicMatch(deployed, orders.buy, orders.sell, hosea, rock, hosea, override);

    await result(scheme);
}

async function match721OrderToERC20(deployed, mockDeployed, accounts, accountsAssets)
{
    const [rock, hosea, yety, suky, join, bob] = accounts;
    const [rock_asset, hosea_asset, yety_asset, suky_asset, join_asset, bob_asset] = accountsAssets;
    
    // rock 以 price 价格 出售 nft asset 
    const scheme_nft_to_eth = (nft, seller, buyer, item, price, paymentToken, kind) => {
        return {
            nft   : nft,
            seller: seller,
            buyer : buyer,
            item  : item, 
            basePrice:  price,
            paymentToken: paymentToken,
            kind,
        }
    };
    const scheme = scheme_nft_to_eth(
        mockDeployed.art721, 
        rock,
        hosea, 
        rock_asset[5],
        ethers.BigNumber.from(10000), 
        mockDeployed.usdt20,
        kind.ERC721
    );

    let param = {
        saleKind: 0,                              // enum SaleKind { FixedPrice, DutchAuction }
        howToCall: 0,                             // enum HowToCall { Call, DelegateCall }
        feeMethod: 1,                             // enum FeeMethod { ProtocolFee, SplitFee }
        extra: 0                                  // 
    }; 

    console.log(param, {
        "nft": scheme.nft.address,
        "seller": scheme.seller.address,
        "buyer" : scheme.buyer.address,
        "item" : scheme.item,
        "basePrice" : scheme.basePrice,
        "paymentToken" : scheme.paymentToken,
        "kind" : scheme.kind
    });

    param = Object.assign(param, scheme);

    const orders = await makeMatchOrder( deployed, param );

    await requireMatchOrder(deployed, orders.buy, orders.sell, hosea, rock, hosea);
    
    // sender 
    const override = {
        gasLimit: 4100000
    };

    await atomicMatch(deployed, orders.buy, orders.sell, hosea, rock, rock, override);

    await result(scheme);
}

async function main() {
    
    const networkName = hre.network.name;
    if(networkName == "goerli"){
        return testGoerli();
    }
    
    const [exchange, mocker, rock, hosea, yety, suky, tester, feeer, join, bob] = await ethers.getSigners();
    
    // test user
    const accounts = [rock, hosea, yety, suky, join, bob];
    
    console.log("-----------------------------------------------------------");
    console.log("test account:", [exchange.address, mocker.address]);
    console.log("test account:", [rock.address, hosea.address, yety.address, suky.address, join.address, bob.address]);
    console.log("-----------------------------------------------------------");

    // get config
    const configed = await getConfig();
    const deployed = await getDeployed(configed, rock);
    const mockDeployed = await getMockDeployed(configed, mocker);

    // get user mock token 
    const accountsAssets = getMockTokenAsset(accounts);
    
    // submit orders
    await match721Order(deployed, mockDeployed, accounts, accountsAssets);
    
    await match1155Order(deployed, mockDeployed, accounts, accountsAssets);

    await match721OrderToERC20(deployed, mockDeployed, accounts, accountsAssets);
}
async function testGoerli() {
    // 0x3A3455DF56DF22d3197aC06E843857DE9adC106d
    // 0x2F4fc3920f99531067781725825B2BC8BA99F939
    const [rock, hosea] = await ethers.getSigners();
    console.log("-----------------------------------------------------------");
    console.log("test account:", [rock.address, hosea.address]);
    console.log("-----------------------------------------------------------");

    const configed = await getConfig();
    const deployed = await getDeployed(configed, rock);

    const NFT = '0xC0Fe3203Fa908e4875dDC2757cD1C3B49a7fae1C';

    const scheme = scheme_nft_to_eth(
        NFT, 
        rock, 
        hosea, 
        1,
        ethers.BigNumber.from(10000), 
        ZERO_ADDRESS,
        kind.ERC721
    );

    let param = {
        saleKind: 0,                              // enum SaleKind { FixedPrice, DutchAuction }
        howToCall: 0,                             // enum HowToCall { Call, DelegateCall }
        feeMethod: 1,                             // enum FeeMethod { ProtocolFee, SplitFee }
        extra: 0                                  // 
    }; 

    console.log(param, {
        "nft": scheme.nft,
        "seller": scheme.seller.address,
        "buyer" : scheme.buyer.address,
        "item" : scheme.item,
        "basePrice" : scheme.basePrice,
        "paymentToken" : scheme.paymentToken,
        "kind" : scheme.kind
    });

    param = Object.assign(param, scheme);

    const orders = await makeMatchOrderGoerli( deployed, param );
    
    // await requireMatchOrder(deployed, orders.buy, orders.sell, hosea, hosea, hosea);

    const override = {
        value: ethers.utils.parseEther("0.3"),
        gasLimit: 4100000
    };
    
    // 注册代理
    await registerWallet(deployed, rock);
    await registerWallet(deployed, hosea);

    // 授权token
    const rockRegisterProxy = await deployed.registry.proxies(rock.address);
    const ERC721Faucet = await ethers.getContractFactory("ERC721Faucet", {signer : rock});
    const ERC721FaucetObj  = ERC721Faucet.attach(NFT);
    await ERC721FaucetObj.connect(rock).setApprovalForAll(rockRegisterProxy, true);

    // 调用
    await atomicMatch(deployed, orders.buy, orders.sell, hosea, rock, hosea, override);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Exception:" , error);
    });