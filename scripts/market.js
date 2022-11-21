const { getConfig, getDeployed, getMockDeployed, generateArray } = require('./library.js');
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
    FEE_ADDRESS,

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
    makeMatchOrder
 } = require('./common.js');

const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function match721Order(deployed, mockDeployed, accounts, accountsAssets)
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

async function match721BatchOrder(deployed, mockDeployed, accounts, accountsAssets)
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

async function main() {
    
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

    // await match721BatchOrder(deployed, mockDeployed, accounts, accountsAssets);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Exception:" , error);
    });