const { getConfig, getDeployed, getMockDeployed, generateArray, registerWallet } = require('./library.js');
const {
    encodeERC721ReplacementPatternSell,
    encodeERC721ReplacementPatternBuy,
    encodeERC1155ReplacementPatternSell,
    encodeERC1155ReplacementPatternBuy,
    encodeERC721OfferReplacementPatternBuy,
    encodeERC721OfferReplacementPatternSell,
    encodeERC1155OfferReplacementPatternBuy,
    encodeERC1155OfferReplacementPatternSell,

    ZERO_ADDRESS,
    ZERO_HASH,
    ZERO,
    SALT,
    kind,
    FEE_RECIPIENT,

    sellERC721ABI,
    buyERC721ABI,
    batchERC721Atomicized,
    ERC721ABI,
    ERC1155ABI,
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

const deepcopy = require("deepcopy");

const scheme_nft_to_eth = (nft, seller, buyer, item, price, paymentToken, kind, value) => {
    return {
        nft: nft,
        seller: seller,
        buyer: buyer,
        item: item,
        basePrice: price,
        paymentToken: paymentToken,
        kind,
        value
    }
};

async function match721Order (deployed, mockDeployed, accounts, accountsAssets) {
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
        "buyer": scheme.buyer.address,
        "item": scheme.item,
        "basePrice": scheme.basePrice,
        "paymentToken": scheme.paymentToken,
        "kind": scheme.kind
    });

    param = Object.assign(param, scheme);

    const orders = await makeMatchOrder(deployed, param);

    await requireMatchOrder(deployed, orders.buy, orders.sell, hosea, rock, hosea);

    // sender 
    const override = {
        value: ethers.utils.parseEther("2"),
        gasLimit: 4100000
    };

    await atomicMatch(deployed, orders.buy, orders.sell, hosea, rock, hosea, override);

    await result(scheme);
}

async function resultBatch(mockDeployed, seller, buyer, tokenId) {
    seller_art = await mockDeployed.art721.balanceOf(seller.address);
    seller_vr = await mockDeployed.vr721.balanceOf(seller.address);
    seller_game = await mockDeployed.game721.balanceOf(seller.address);
   
    buyer_art = await mockDeployed.art721.balanceOf(buyer.address);
    buyer_vr = await mockDeployed.vr721.balanceOf(buyer.address);
    buyer_game = await mockDeployed.game721.balanceOf(buyer.address);

    console.log({
        seller_art,
        seller_vr,
        seller_game,
        buyer_art,
        buyer_vr,
        buyer_game
    })
}

async function resultSingle721(nft, erc20, seller, buyer) {
    seller_balance_nft = await nft.balanceOf(seller.address);
    buyer_balance_nft = await nft.balanceOf(buyer.address);

    seller_balance_erc20 = await erc20.balanceOf(seller.address);
    buyer_balance_erc20 = await erc20.balanceOf(buyer.address);

    console.log({
        seller_balance_nft,
        buyer_balance_nft,
        seller_balance_erc20,
        buyer_balance_erc20
    })
}

async function resultSingle1155(nft, id ,erc20, seller, buyer) {
    seller_balance_nft = await nft.balanceOf(seller.address, id);
    buyer_balance_nft = await nft.balanceOf(buyer.address, id);

    seller_balance_erc20 = await erc20.balanceOf(seller.address);
    buyer_balance_erc20 = await erc20.balanceOf(buyer.address);

    console.log({
        seller_balance_nft,
        buyer_balance_nft,
        seller_balance_erc20,
        buyer_balance_erc20
    })
}


async function match721BatchOrder (deployed, mockDeployed, accounts, accountsAssets) {
    const [rock, hosea, yety, suky, join, bob] = accounts;
    const [rock_asset, hosea_asset, yety_asset, suky_asset, join_asset, bob_asset] = accountsAssets;

    const [seller1, seller2, seller3, seller1_asset, seller2_asset, seller3_asset] = [
        rock,
        yety,
        suky,
        rock_asset,
        yety_asset,
        suky_asset
    ];

    const buyer = hosea;


    transactions = [
        { token: mockDeployed.art721.address, seller: seller1.address, buyer: buyer.address, id: 4, value: '0' },
        { token: mockDeployed.vr721.address, seller: seller1.address, buyer: buyer.address, id: 5, value: '0' },
        { token: mockDeployed.game721.address, seller: seller1.address, buyer: buyer.address, id: 6, value: '0' }
    ];

    const calldata = batchERC721Atomicized(transactions);

    console.log({
        'asset' : [seller1_asset, seller2_asset, seller3_asset],
        transactions,
        calldata
    })

    sellOrder = makeOrder(deployed.exchange.address, seller1, deployed.atomicizer.address);
    sellOrder.taker = ZERO_ADDRESS
    sellOrder.side = 1
    sellOrder.feeMethod = 1
    sellOrder.paymentToken = ZERO_ADDRESS
    sellOrder.howToCall = 1
    sellOrder.saleKind = 0
    sellOrder.basePrice = ethers.BigNumber.from(10000)
    sellOrder.extra = 0
    sellOrder.listingTime = parseInt(1638283031)
    sellOrder.expirationTime = 0
    sellOrder.feeRecipient = FEE_RECIPIENT
    sellOrder.calldata = calldata;

    buyOrder = deepcopy(sellOrder);
    buyOrder.side = 0
    buyOrder.maker = buyer.address
    buyOrder.taker = seller1.address
    buyOrder.feeRecipient = ZERO_ADDRESS;

    console.log({
        sellOrder,
        buyOrder
    })

    await requireMatchOrder(deployed, buyOrder, sellOrder, hosea, rock, hosea);

    // sender 
    const override = {
        value: ethers.utils.parseEther("2"),
        gasLimit: 4100000
    };

    await resultBatch(mockDeployed, seller1, buyer);

    await atomicMatch(deployed, buyOrder, sellOrder, hosea, rock, hosea, override);
    
    await resultBatch(mockDeployed, seller1, buyer);
}

async function match1155Order (deployed, mockDeployed, accounts, accountsAssets) {
    const [rock, hosea, yety, suky, join, bob] = accounts;
    const [rock_asset, hosea_asset, yety_asset, suky_asset, join_asset, bob_asset] = accountsAssets;

    // rock 以 price 价格 出售 nft asset 
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
        "buyer": scheme.buyer.address,
        "item": scheme.item,
        "basePrice": scheme.basePrice,
        "paymentToken": scheme.paymentToken,
        "kind": scheme.kind
    });

    param = Object.assign(param, scheme);

    const orders = await makeMatchOrder(deployed, param);

    await requireMatchOrder(deployed, orders.buy, orders.sell, hosea, rock, hosea);

    // sender 
    const override = {
        value: ethers.utils.parseEther("2"),
        gasLimit: 4100000
    };

    await atomicMatch(deployed, orders.buy, orders.sell, hosea, rock, hosea, override);

    await result(scheme);
}

async function match721OrderToERC20 (deployed, mockDeployed, accounts, accountsAssets) {
    const [rock, hosea, yety, suky, join, bob] = accounts;
    const [rock_asset, hosea_asset, yety_asset, suky_asset, join_asset, bob_asset] = accountsAssets;

    // rock 以 price 价格 出售 nft asset 
    const scheme = scheme_nft_to_eth(
        mockDeployed.art721,
        rock,
        hosea,
        rock_asset[6],
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
        "buyer": scheme.buyer.address,
        "item": scheme.item,
        "basePrice": scheme.basePrice,
        "paymentToken": scheme.paymentToken,
        "kind": scheme.kind
    });

    param = Object.assign(param, scheme);

    const orders = await makeMatchOrder(deployed, param);

    await requireMatchOrder(deployed, orders.buy, orders.sell, hosea, rock, hosea);

    // sender 
    const override = {
        gasLimit: 4100000
    };

    await atomicMatch(deployed, orders.buy, orders.sell, hosea, rock, rock, override);

    await result(scheme);
}
//报价 721
async function match721OrderOfferToERC20 (deployed, mockDeployed, accounts, accountsAssets) {
    const [rock, hosea, yety, suky, join, bob] = accounts;
    const [rock_asset, hosea_asset, yety_asset, suky_asset, join_asset, bob_asset] = accountsAssets;

    const seller = rock
    const buyer = hosea
    const tokenID = rock_asset[10]

    // 721
    const sellCalldata = ERC721ABI(seller.address, buyer.address, tokenID);
    const buyCalldata = ERC721ABI(ZERO_ADDRESS, buyer.address, 0);

    sellOrder = makeOrder(deployed.exchange.address, seller, mockDeployed.art721.address);
    sellOrder.taker = buyer.address
    sellOrder.side = 1
    sellOrder.feeMethod = 1
    sellOrder.paymentToken = mockDeployed.usdt20.address
    sellOrder.howToCall = 0
    sellOrder.saleKind = 0
    sellOrder.basePrice = ethers.BigNumber.from(10000)
    sellOrder.extra = 0
    sellOrder.listingTime = parseInt(1638283031)
    sellOrder.expirationTime = 0
    sellOrder.feeRecipient = ZERO_ADDRESS
    sellOrder.calldata = sellCalldata
    sellOrder.replacementPattern = encodeERC721OfferReplacementPatternSell

    buyOrder = deepcopy(sellOrder);
    buyOrder.calldata = buyCalldata
    buyOrder.replacementPattern = encodeERC721OfferReplacementPatternBuy
    buyOrder.side = 0
    buyOrder.maker = buyer.address
    buyOrder.taker = ZERO_ADDRESS
    buyOrder.feeRecipient = FEE_RECIPIENT

    console.log({
        buyOrder, sellOrder
    })
    await requireMatchOrder(deployed, buyOrder, sellOrder, buyer, seller, seller);

    // sender 
    const override = {
        gasLimit: 4100000
    };

    await resultSingle721(mockDeployed.art721, mockDeployed.usdt20, seller, buyer);
    
    await atomicMatch(deployed, buyOrder, sellOrder, buyer, seller, seller, override);

    await resultSingle721(mockDeployed.art721, mockDeployed.usdt20, seller, buyer);
}

//报价 1155
async function match1155OrderOfferToERC20 (deployed, mockDeployed, accounts, accountsAssets) {
    const [rock, hosea, yety, suky, join, bob] = accounts;
    const [rock_asset, hosea_asset, yety_asset, suky_asset, join_asset, bob_asset] = accountsAssets;

    const seller = rock
    const buyer = hosea
    const tokenID = rock_asset[2]

    seller_balance_nft = await mockDeployed.art1155.balanceOf(seller.address, tokenID)
    const amount = seller_balance_nft - 100;

    // 1155
    const sellCalldata = ERC1155ABI(seller.address, buyer.address, tokenID, amount);
    const buyCalldata = ERC1155ABI(ZERO_ADDRESS, buyer.address, 0, amount);

    sellOrder = makeOrder(deployed.exchange.address, seller, mockDeployed.art1155.address);
    sellOrder.taker = buyer.address
    sellOrder.side = 1
    sellOrder.feeMethod = 1
    sellOrder.paymentToken = mockDeployed.usdt20.address
    sellOrder.howToCall = 0
    sellOrder.saleKind = 0
    sellOrder.basePrice = ethers.BigNumber.from(10000)
    sellOrder.extra = 0
    sellOrder.listingTime = parseInt(1638283031)
    sellOrder.expirationTime = 0
    sellOrder.feeRecipient = ZERO_ADDRESS;
    sellOrder.calldata = sellCalldata
    sellOrder.replacementPattern = encodeERC1155OfferReplacementPatternSell

    buyOrder = deepcopy(sellOrder);
    buyOrder.calldata = buyCalldata
    buyOrder.replacementPattern = encodeERC1155OfferReplacementPatternBuy
    buyOrder.side = 0
    buyOrder.maker = buyer.address
    buyOrder.taker = ZERO_ADDRESS
    buyOrder.feeRecipient = FEE_RECIPIENT;

    console.log({
        buyOrder, sellOrder
    })
    await requireMatchOrder(deployed, buyOrder, sellOrder, buyer, seller, seller);

    // sender 
    const override = {
        gasLimit: 4100000
    };

    await resultSingle1155(mockDeployed.art1155, tokenID, mockDeployed.usdt20, seller, buyer);
    
    await atomicMatch(deployed, buyOrder, sellOrder, buyer, seller, seller, override);

    await resultSingle1155(mockDeployed.art1155, tokenID, mockDeployed.usdt20, seller, buyer);
}

async function main () {

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
    // 1155 
    // let accountsAssets = getMockTokenAsset(accounts, true);
    // 721
    accountsAssets = getMockTokenAsset(accounts);

    // submit orders
    // await match721Order(deployed, mockDeployed, accounts, accountsAssets);

    // await match1155Order(deployed, mockDeployed, accounts, accountsAssets);

    // await match721OrderToERC20(deployed, mockDeployed, accounts, accountsAssets);

    // await match721BatchOrder(deployed, mockDeployed, accounts, accountsAssets);

    await match721OrderOfferToERC20(deployed, mockDeployed, accounts, accountsAssets);

    // await match1155OrderOfferToERC20(deployed, mockDeployed, accounts, accountsAssets);
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
        "buyer": scheme.buyer.address,
        "item": scheme.item,
        "basePrice": scheme.basePrice,
        "paymentToken": scheme.paymentToken,
        "kind": scheme.kind
    });

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

// test account: [
//     '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', 1
//     '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
//     '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', 2
//     '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc', 3
//     '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
//     '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720'
// ]

// {
//     mint: 'mint to 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC nft in [vr721, art721, game721, vr1155, art1155, game1155]',
//     ids20: [
//        1,  2,  3,  4,  5,  6,  7,
//        8,  9, 10, 11, 12, 13, 14,
//       15, 16, 17, 18, 19, 20
//     ],
//     values_same_1: [
//       1, 1, 1, 1, 1, 1, 1,
//       1, 1, 1, 1, 1, 1, 1,
//       1, 1, 1, 1, 1, 1
//     ],
//     ids1020: [
//       1001, 1002, 1003, 1004,
//       1005, 1006, 1007, 1008,
//       1009, 1010, 1011, 1012,
//       1013, 1014, 1015, 1016,
//       1017, 1018, 1019, 1020
//     ]
//   }
// {
//     mint: 'mint to 0x90F79bf6EB2c4f870365E785982E1f101E93b906 nft in [vr721, art721, game721, vr1155, art1155, game1155]',
//     ids20: [
//       21, 22, 23, 24, 25, 26, 27,
//       28, 29, 30, 31, 32, 33, 34,
//       35, 36, 37, 38, 39, 40
//     ],
//     values_same_1: [
//       1, 1, 1, 1, 1, 1, 1,
//       1, 1, 1, 1, 1, 1, 1,
//       1, 1, 1, 1, 1, 1
//     ],
//     ids1020: [
//       1021, 1022, 1023, 1024,
//       1025, 1026, 1027, 1028,
//       1029, 1030, 1031, 1032,
//       1033, 1034, 1035, 1036,
//       1037, 1038, 1039, 1040
//     ]
// }
// {
//     mint: 'mint to 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65 nft in [vr721, art721, game721, vr1155, art1155, game1155]',
//     ids20: [
//       41, 42, 43, 44, 45, 46, 47,
//       48, 49, 50, 51, 52, 53, 54,
//       55, 56, 57, 58, 59, 60
//     ],
//     values_same_1: [
//       1, 1, 1, 1, 1, 1, 1,
//       1, 1, 1, 1, 1, 1, 1,
//       1, 1, 1, 1, 1, 1
//     ],
//     ids1020: [
//       1041, 1042, 1043, 1044,
//       1045, 1046, 1047, 1048,
//       1049, 1050, 1051, 1052,
//       1053, 1054, 1055, 1056,
//       1057, 1058, 1059, 1060
//     ]
// }
// {
//     mint: 'mint to 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc nft in [vr721, art721, game721, vr1155, art1155, game1155]',
//     ids20: [
//       61, 62, 63, 64, 65, 66, 67,
//       68, 69, 70, 71, 72, 73, 74,
//       75, 76, 77, 78, 79, 80
//     ],
//     values_same_1: [
//       1, 1, 1, 1, 1, 1, 1,
//       1, 1, 1, 1, 1, 1, 1,
//       1, 1, 1, 1, 1, 1
//     ],
//     ids1020: [
//       1061, 1062, 1063, 1064,
//       1065, 1066, 1067, 1068,
//       1069, 1070, 1071, 1072,
//       1073, 1074, 1075, 1076,
//       1077, 1078, 1079, 1080
//     ]
// }

// {
//     mint: 'mint to 0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f nft in [vr721, art721, game721, vr1155, art1155, game1155]',
//     ids20: [
//       81, 82, 83, 84, 85,  86, 87,
//       88, 89, 90, 91, 92,  93, 94,
//       95, 96, 97, 98, 99, 100
//     ],
//     values_same_1: [
//       1, 1, 1, 1, 1, 1, 1,
//       1, 1, 1, 1, 1, 1, 1,
//       1, 1, 1, 1, 1, 1
//     ],
//     ids1020: [
//       1081, 1082, 1083, 1084,
//       1085, 1086, 1087, 1088,
//       1089, 1090, 1091, 1092,
//       1093, 1094, 1095, 1096,
//       1097, 1098, 1099, 1100
//     ]
// }

// {
//     mint: 'mint to 0xa0Ee7A142d267C1f36714E4a8F75612F20a79720 nft in [vr721, art721, game721, vr1155, art1155, game1155]',
//     ids20: [
//       101, 102, 103, 104, 105,
//       106, 107, 108, 109, 110,
//       111, 112, 113, 114, 115,
//       116, 117, 118, 119, 120
//     ],
//     values_same_1: [
//       1, 1, 1, 1, 1, 1, 1,
//       1, 1, 1, 1, 1, 1, 1,
//       1, 1, 1, 1, 1, 1
//     ],
//     ids1020: [
//       1101, 1102, 1103, 1104,
//       1105, 1106, 1107, 1108,
//       1109, 1110, 1111, 1112,
//       1113, 1114, 1115, 1116,
//       1117, 1118, 1119, 1120
//     ]
// }

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Exception:", error);
    });