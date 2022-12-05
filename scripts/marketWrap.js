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

    sellERC721ABI,
    buyERC721ABI,

    makeOrder,
    hashOrder,
    hashToSign,
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

// 7
async function _makeMatchOrder(deployed, mockDeployed, seller, buyer, seller_asset, _price){
    // rock 以 price 价格 出售 nft asset 
    const scheme = scheme_nft_to_eth(
        mockDeployed.art721, seller, buyer, 
        seller_asset, _price,
        ZERO_ADDRESS, kind.ERC721
    );

    let param = {
        saleKind: 0,                              // enum SaleKind { FixedPrice, DutchAuction }
        howToCall: 0,                             // enum HowToCall { Call, DelegateCall }
        feeMethod: 1,                             // enum FeeMethod { ProtocolFee, SplitFee }
        extra: 0                                  // 
    }; 

    param = Object.assign(param, scheme); // merge after cover before

    const orders = await makeMatchOrder( deployed, param , true);

    return {
        'orders' : orders,
        'scheme' : scheme
    }
}

function changeKey(obj, old_key, new_key){
    Object.keys(obj).forEach(key => {
        if (key === old_key) {
            obj[new_key] = obj[key];
            delete obj[key];
        } else {
            obj[`_${key}`] = obj[key];
            delete obj[key];
    
            obj[`${key}`] = obj[`_${key}`];
            delete obj[`_${key}`];
        }
    });

    return obj;
}

async function matchOrder(deployed, mockDeployed, accounts, accountsAssets)
{
    const [rock, hosea, yety, suky, join, bob] = accounts;
    const [rock_asset, hosea_asset, yety_asset, suky_asset, join_asset, bob_asset] = accountsAssets;
    

    match1 = await _makeMatchOrder(deployed, mockDeployed, rock, hosea, rock_asset[16], ethers.BigNumber.from(100000));
    match2 = await _makeMatchOrder(deployed, mockDeployed, rock, hosea, rock_asset[17], ethers.BigNumber.from(200000));

    
    matchOrder1 = match1.orders;
    matchOrder2 = match2.orders;

    console.log({matchOrder1, matchOrder2});

    scheme1 = match1.scheme;
    scheme2 = match2.scheme;

    let sigBuy1 = await signature(deployed, matchOrder1.buy, hosea);
    let sigBuy2 = await signature(deployed, matchOrder2.buy, hosea);

    let sigSell1 = await signature(deployed, matchOrder1.sell, rock);
    let sigSell2 = await signature(deployed, matchOrder2.sell, rock);

    matchOrder1.buy = changeKey(matchOrder1.buy, 'calldata', 'calldataBeta');
    matchOrder2.buy = changeKey(matchOrder2.buy, 'calldata', 'calldataBeta');
    matchOrder1.sell = changeKey(matchOrder1.sell, 'calldata', 'calldataBeta');
    matchOrder2.sell = changeKey(matchOrder2.sell, 'calldata', 'calldataBeta');

    buys    = [matchOrder1.buy, matchOrder2.buy];
    buySigs = [
        {'v': sigBuy1.v, 'r': sigBuy1.r, 's': sigBuy1.s},
        {'v': sigBuy2.v, 'r': sigBuy2.r, 's': sigBuy2.s}, 
    ];
    
    sells   = [matchOrder1.sell, matchOrder2.sell];
    sellSigs= [
        {'v': sigSell1.v, 'r': sigSell1.r, 's': sigSell1.s}, 
        {'v': sigSell2.v, 'r': sigSell2.r, 's': sigSell2.s} 
    ];

    console.log({
        buys,
        buySigs,
        sells,
        sellSigs 
    });

    // sender 
    const override = {
        value: ethers.BigNumber.from(300000),
        gasLimit: 4100000
    };

    const tx = await deployed.exchangeWrap.connect(hosea).atomicMatchWrap(
        buys,
        buySigs,
        sells,
        sellSigs,
        ZERO_HASH,
        [matchOrder1.sell.basePrice, matchOrder2.sell.basePrice],
        override
    );

    console.log("atomicMatchWrap tx:", tx);

    await tx.wait();

    await result(scheme1);
    await result(scheme2);
}

async function testGoerli () {
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
        2,
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

    param = Object.assign(param, scheme);

    const orders = await makeMatchOrderGoerli(deployed, param);

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
    const ERC721Faucet = await ethers.getContractFactory("ERC721Faucet", { signer: rock });
    const ERC721FaucetObj = ERC721Faucet.attach(NFT);
    await ERC721FaucetObj.connect(rock).setApprovalForAll(rockRegisterProxy, true);

    // 调用
    await atomicMatch(deployed, orders.buy, orders.sell, hosea, rock, hosea, override);
}

async function main() {
    
    const networkName = hre.network.name;
    if (networkName == "goerli") {
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
    await matchOrder(deployed, mockDeployed, accounts, accountsAssets);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Exception:" , error);
    });