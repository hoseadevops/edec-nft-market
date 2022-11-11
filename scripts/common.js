const { getConfig, getDeployed, getMockDeployed, generateArray } = require('./library.js');
const helpers = require("@nomicfoundation/hardhat-network-helpers");

const encodeERC721ReplacementPatternSell  = '0x000000000000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000000';
const encodeERC721ReplacementPatternBuy   = '0x00000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
const encodeERC1155ReplacementPatternSell = '0x000000000000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
const encodeERC1155ReplacementPatternBuy  = '0x00000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

const ZERO_ADDRESS = ethers.constants.AddressZero;
const ZERO_HASH    = ethers.constants.HashZero;
const ZERO         = ethers.constants.Zero;
const SALT         = ethers.BigNumber.from(123456);
const kind = {
    "ERC721": "ERC721",
    "ERC1155": "ERC1155"
};
// feeer
const FEE_ADDRESS  = "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955";
const contract_ABI = [
    "function transferFrom(address from, address to, uint256 tokenId)",
    "function safeTransferFrom(address _from, address _to, uint256 _id, uint256 _value, bytes calldata _data)"
];
let iface = new ethers.utils.Interface(contract_ABI);

// get 721 sell calldata
function sellERC721ABI( seller, id) {
    return iface.encodeFunctionData("transferFrom", [seller, ZERO_ADDRESS, id]);
}
// get 721 buy calldata
function buyERC721ABI( buyer, id ) { 
    return iface.encodeFunctionData("transferFrom", [ZERO_ADDRESS, buyer, id]);
}
// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// get 1155 sell calldata
function sellERC1155ABI( seller, id, value) {
    return iface.encodeFunctionData("safeTransferFrom", [seller, ZERO_ADDRESS, id, value, '0x']);
}
// get 1155 buy calldata
function buyERC1155ABI( buyer, id, value, ) {
    return iface.encodeFunctionData("safeTransferFrom", [ZERO_ADDRESS, buyer, id, value, '0x']);
}

/** default order
 * @param { exchange contract address} exchange 
 * @param { maker } sender 
 * @param { exchange nft } nftAddress 
 * @returns order
 */
const makeOrder = (exchangeAddress, sender, nftAddress) => ({
    exchange: exchangeAddress,     // 当前 exhcnage 合约地址 default : exchangeAddress
    maker: sender.address,         // 订单创建者 default sender 
    taker: ZERO_ADDRESS,           // 订单参与者 require
    makerRelayerFee: 250,          // 手续费  default: 0
    takerRelayerFee: 0,            // 手续费  default: 0
    makerProtocolFee: 0,           // 协议费  default: 0
    takerProtocolFee: 0,           // 协议费  default: 0
    feeRecipient: ZERO_ADDRESS,    // 平台费 接收账户 default: 0x0
    feeMethod: 0,                  // enum FeeMethod { ProtocolFee, SplitFee }  费用收取方法：只用支付协议费，或者 是需要同时支付协议费 和 平台费
    side: 0,                       // enum Side { Buy, Sell } 该订单是 卖方单 还是 买方单 
    saleKind: 0,                   // { FixedPrice, DutchAuction } 销售方式是 固定价格，还是采用 竞拍的方式
    target: nftAddress,            // 交易的 nft 完成 NFT 转移
    howToCall: 0,                  // 调用方式是 call 还是 delegatecall
    calldata: '0x',                // target 执行时的 calldata
    replacementPattern: '0x',      // target 执行时的 calldata 可替换的参数
    staticTarget: ZERO_ADDRESS,    // 静态调用（不修改状态）的 target 账户地址；为 0 表示没有这种调用
    staticExtradata: '0x',         // 静态调用时设置的额外数据，最终交给 staticTarget 处理
    paymentToken: ZERO_ADDRESS,    // 该地址为 0 ，表示使用 ether 支付，否则，表示使用一个 erc20 token 支付
    basePrice: ZERO,               // 如果是 saleKind 固定价格，则该值就表示固定价格；否则，真正的价格，还包括 extra 部分. 价格单位为 Wei
    extra: 0,                      // 竞拍方式下，extra 表示需要额外的最大值. 价格单位为 Wei
    listingTime: 0,                // 挂单时间
    expirationTime: 0,             // 订单过期失效时间
    salt: SALT,                    // for collision
    _sender: sender.address        // for wrap【不计算 hash 】
})

const makeOrderWrap = (exchangeAddress, sender, nftAddress) => ({
    exchange: exchangeAddress,     // 当前 exhcnage 合约地址 default : exchangeAddress
    maker: sender.address,         // 订单创建者 default sender 
    taker: ZERO_ADDRESS,           // 订单参与者 require
    makerRelayerFee: 250,          // 手续费  default: 0
    takerRelayerFee: 0,            // 手续费  default: 0
    makerProtocolFee: 0,           // 协议费  default: 0
    takerProtocolFee: 0,           // 协议费  default: 0
    feeRecipient: ZERO_ADDRESS,    // 平台费 接收账户 default: 0x0
    feeMethod: 0,                  // enum FeeMethod { ProtocolFee, SplitFee }  费用收取方法：只用支付协议费，或者 是需要同时支付协议费 和 平台费
    side: 0,                       // enum Side { Buy, Sell } 该订单是 卖方单 还是 买方单 
    saleKind: 0,                   // { FixedPrice, DutchAuction } 销售方式是 固定价格，还是采用 竞拍的方式
    target: nftAddress,            // 交易的 nft 完成 NFT 转移
    howToCall: 0,                  // 调用方式是 call 还是 delegatecall
    calldataBeta: '0x',            // target 执行时的 calldata
    replacementPattern: '0x',      // target 执行时的 calldata 可替换的参数
    staticTarget: ZERO_ADDRESS,    // 静态调用（不修改状态）的 target 账户地址；为 0 表示没有这种调用
    staticExtradata: '0x',         // 静态调用时设置的额外数据，最终交给 staticTarget 处理
    paymentToken: ZERO_ADDRESS,    // 该地址为 0 ，表示使用 ether 支付，否则，表示使用一个 erc20 token 支付
    basePrice: ZERO,               // 如果是 saleKind 固定价格，则该值就表示固定价格；否则，真正的价格，还包括 extra 部分. 价格单位为 Wei
    extra: 0,                      // 竞拍方式下，extra 表示需要额外的最大值. 价格单位为 Wei
    listingTime: 0,                // 挂单时间
    expirationTime: 0,             // 订单过期失效时间
    salt: SALT,                    // for collision
})

const hashOrder = (order) => {
    return web3.utils.soliditySha3(
      {type: 'address', value: order.exchange},
      {type: 'address', value: order.maker},
      {type: 'address', value: order.taker},
      {type: 'uint', value: ethers.BigNumber.from(order.makerRelayerFee)},
      {type: 'uint', value: ethers.BigNumber.from(order.takerRelayerFee)},
      {type: 'uint', value: ethers.BigNumber.from(order.takerProtocolFee)},
      {type: 'uint', value: ethers.BigNumber.from(order.takerProtocolFee)},
      {type: 'address', value: order.feeRecipient},
      {type: 'uint8', value: order.feeMethod},
      {type: 'uint8', value: order.side},
      {type: 'uint8', value: order.saleKind},
      {type: 'address', value: order.target},
      {type: 'uint8', value: order.howToCall},
      {type: 'bytes', value: order.calldata ? order.calldata : order.calldataBeta},
      {type: 'bytes', value: order.replacementPattern},
      {type: 'address', value: order.staticTarget},
      {type: 'bytes', value: order.staticExtradata},
      {type: 'address', value: order.paymentToken},
      {type: 'uint', value: ethers.BigNumber.from(order.basePrice)},
      {type: 'uint', value: ethers.BigNumber.from(order.extra)},
      {type: 'uint', value: ethers.BigNumber.from(order.listingTime)},
      {type: 'uint', value: ethers.BigNumber.from(order.expirationTime)},
      {type: 'uint', value: order.salt}
    ).toString('hex')
}

const hashToSign = (order) => {
    const packed = web3.utils.soliditySha3(
      {type: 'address', value: order.exchange},
      {type: 'address', value: order.maker},
      {type: 'address', value: order.taker},
      {type: 'uint', value: ethers.BigNumber.from(order.makerRelayerFee)},
      {type: 'uint', value: ethers.BigNumber.from(order.takerRelayerFee)},
      {type: 'uint', value: ethers.BigNumber.from(order.takerProtocolFee)},
      {type: 'uint', value: ethers.BigNumber.from(order.takerProtocolFee)},
      {type: 'address', value: order.feeRecipient},
      {type: 'uint8', value: order.feeMethod},
      {type: 'uint8', value: order.side},
      {type: 'uint8', value: order.saleKind},
      {type: 'address', value: order.target},
      {type: 'uint8', value: order.howToCall},
      {type: 'bytes', value: order.calldata ? order.calldata : order.calldataBeta},
      {type: 'bytes', value: order.replacementPattern},
      {type: 'address', value: order.staticTarget},
      {type: 'bytes', value: order.staticExtradata},
      {type: 'address', value: order.paymentToken},
      {type: 'uint', value: ethers.BigNumber.from(order.basePrice)},
      {type: 'uint', value: ethers.BigNumber.from(order.extra)},
      {type: 'uint', value: ethers.BigNumber.from(order.listingTime)},
      {type: 'uint', value: ethers.BigNumber.from(order.expirationTime)},
      {type: 'uint', value: order.salt}
    ).toString('hex')
    return web3.utils.soliditySha3(
      {type: 'string', value: '\x19Ethereum Signed Message:\n32'},
      {type: 'bytes32', value: packed}
    ).toString('hex')
}

/** sign
 * 
 * @param {签名数据} hash 
 * @param {签名用户} senderAddress 
 * @returns 
 */
async function signature(order, sender) {
    
    const hash = hashOrder(order);
    const hashSign = hashToSign(order);
    const hashBytes = ethers.utils.arrayify(hash);
    
    // vrs = await ethers.utils.splitSignature(signature);
    // vrs = splitSignature(signature)
    // ...vrs
    function splitSignature (signature) {
        const raw = web3.utils.hexToBytes(signature);
        switch (raw.length) {
        case 64:
            return [
                web3.utils.bytesToHex(raw.slice(0, 32)), // r
                web3.utils.bytesToHex(raw.slice(32, 64)), // vs
            ];
        case 65:
            return [
                raw[64], // v
                web3.utils.bytesToHex(raw.slice(0, 32)), // r
                web3.utils.bytesToHex(raw.slice(32, 64)), // s
            ];
        default:
        expect.fail('Invalid signature length, cannot split');
    }
}
    // signMessage already add prefix
    const signature = await sender.signMessage(hashBytes);

    const vrs = await ethers.utils.splitSignature(signature);

    const sig = {
        signature : signature,
        v : vrs.v,
        s : vrs.s,
        r : vrs.r
    }
    // testing 
    addr1 = ethers.utils.recoverAddress(hashSign, { r: sig.r, s: sig.s, v: sig.v });
    addr2 = ethers.utils.recoverAddress(hashSign, sig.signature);
    addr3 = await ethers.utils.verifyMessage(hashBytes, sig.signature);
    console.log("sign-address-verfiy:", sender.address, addr1, addr2, addr3);

    return sig;
}

//get hash order from contract
async function getHashOrder(deployed, order, sender){
    return await deployed.exchange.connect(sender).hashOrder_(
        [order.exchange, order.maker, order.taker, order.feeRecipient, order.target, order.staticTarget, order.paymentToken, sender.address],
        [order.makerRelayerFee, order.takerRelayerFee, order.makerProtocolFee, order.takerProtocolFee, order.basePrice, order.extra, order.listingTime, order.expirationTime, order.salt],
        order.feeMethod,
        order.side,
        order.saleKind,
        order.howToCall,
        order.calldata,
        order.replacementPattern,
        order.staticExtradata       
    );
}

//get hash order sign from contract
async function getHashSign(deployed, order, sender){
    return await deployed.exchange.connect(sender).hashToSign_(
        [order.exchange, order.maker, order.taker, order.feeRecipient, order.target, order.staticTarget, order.paymentToken, sender.address],
        [order.makerRelayerFee, order.takerRelayerFee, order.makerProtocolFee, order.takerProtocolFee, order.basePrice, order.extra, order.listingTime, order.expirationTime, order.salt],
        order.feeMethod,
        order.side,
        order.saleKind,
        order.howToCall,
        order.calldata,
        order.replacementPattern,
        order.staticExtradata    
    );
}

// validate order parameters
async function validateOrderParameters(deployed, order, sender){
    return await deployed.exchange.connect(sender).validateOrderParameters_(
        [order.exchange, order.maker, order.taker, order.feeRecipient, order.target, order.staticTarget, order.paymentToken, sender.address],
        [order.makerRelayerFee, order.takerRelayerFee, order.makerProtocolFee, order.takerProtocolFee, order.basePrice, order.extra, order.listingTime, order.expirationTime, order.salt],
        order.feeMethod,
        order.side,
        order.saleKind,
        order.howToCall,
        order.calldata,
        order.replacementPattern,
        order.staticExtradata
    );
}

// validate order
async function validateOrder(deployed, order, sender){
    
    let sig = await signature(order, sender);

    return await deployed.exchange.connect(sender).validateOrder_(
        [order.exchange, order.maker, order.taker, order.feeRecipient, order.target, order.staticTarget, order.paymentToken, sender.address],
        [order.makerRelayerFee, order.takerRelayerFee, order.makerProtocolFee, order.takerProtocolFee, order.basePrice, order.extra, order.listingTime, order.expirationTime, order.salt],
        order.feeMethod,
        order.side,
        order.saleKind,
        order.howToCall,
        order.calldata,
        order.replacementPattern,
        order.staticExtradata,
        sig.v, sig.r, sig.s
    );
}
// order calldata can match
async function orderCalldataCanMatch(deployed, buy, sell, sender) {
    return await deployed.exchange.connect(sender).orderCalldataCanMatch(
        buy.calldata,
        buy.replacementPattern,
        sell.calldata,
        sell.replacementPattern
    );
}

// order can match
async function orderCanMatch(deployed, buy, sell, sender) {
    return await deployed.exchange.connect(sender).ordersCanMatch_(
        [buy.exchange, buy.maker, buy.taker, buy.feeRecipient, buy.target, buy.staticTarget, buy.paymentToken, sell.exchange, sell.maker, sell.taker, sell.feeRecipient, sell.target, sell.staticTarget, sell.paymentToken, sender.address],
        [buy.makerRelayerFee, buy.takerRelayerFee, buy.makerProtocolFee, buy.takerProtocolFee, buy.basePrice, buy.extra, buy.listingTime, buy.expirationTime, buy.salt, sell.makerRelayerFee, sell.takerRelayerFee, sell.makerProtocolFee, sell.takerProtocolFee, sell.basePrice, sell.extra, sell.listingTime, sell.expirationTime, sell.salt],
        [buy.feeMethod, buy.side, buy.saleKind, buy.howToCall, sell.feeMethod, sell.side, sell.saleKind, sell.howToCall],
        buy.calldata,
        sell.calldata,
        buy.replacementPattern,
        sell.replacementPattern,
        buy.staticExtradata,
        sell.staticExtradata
    );
}

// call atomicMatch 
async function atomicMatch(deployed, buy, sell, buyyer, seller, sender, override){

    let sigBuyy = await signature(buy, buyyer);
    let sigSell = await signature(sell, seller);

    const tx =  await deployed.exchange.connect(sender).atomicMatch_(
        [buy.exchange, buy.maker, buy.taker, buy.feeRecipient, buy.target, buy.staticTarget, buy.paymentToken, sell.exchange, sell.maker, sell.taker, sell.feeRecipient, sell.target, sell.staticTarget, sell.paymentToken, sender.address],
        [buy.makerRelayerFee, buy.takerRelayerFee, buy.makerProtocolFee, buy.takerProtocolFee, buy.basePrice, buy.extra, buy.listingTime, buy.expirationTime, buy.salt, sell.makerRelayerFee, sell.takerRelayerFee, sell.makerProtocolFee, sell.takerProtocolFee, sell.basePrice, sell.extra, sell.listingTime, sell.expirationTime, sell.salt],
        [buy.feeMethod, buy.side, buy.saleKind, buy.howToCall, sell.feeMethod, sell.side, sell.saleKind, sell.howToCall],
        buy.calldata,
        sell.calldata,
        buy.replacementPattern,
        sell.replacementPattern,
        buy.staticExtradata,
        sell.staticExtradata,
        [sigBuyy.v, sigSell.v],
        [sigBuyy.r, sigBuyy.s, sigSell.r, sigSell.s, ZERO_HASH],
        override
    );

    console.log("atomicMatch tx:", tx);

    await tx.wait();
}

/** 验证匹配订单
 * 
 * @param {*} deployed 
 * @param {*} buy 
 * @param {*} sell 
 * @param {*} buyyer 
 * @param {*} seller 
 * @param {*} sender 
 */
 async function requireMatchOrder(deployed, buy, sell, buyyer, seller, sender) {

    const is_validateOrderParameters_buy  = await validateOrderParameters(deployed, buy, sender);
    const is_validateOrderParameters_sell = await validateOrderParameters(deployed, sell, sender);

    const is_validateOrder_buy            = await validateOrder(deployed, buy, buyyer);
    const is_validateOrder_sell           = await validateOrder(deployed, sell, seller);

    const is_orderCanMatch                = await orderCanMatch(deployed, buy, sell, sender)
    const is_orderCalldataCanMatch        = await orderCalldataCanMatch(deployed, buy, sell, sender);

    console.log({
        "matchOrder": "require",
        is_validateOrderParameters_buy,
        is_validateOrderParameters_sell,
        is_validateOrder_buy,
        is_validateOrder_sell,
        is_orderCanMatch,
        is_orderCalldataCanMatch
    });
}

/** 创建订单 [nft - listing] User[seller] sell token[nftAddress] with price
 * 
 * @param {*} deployed 
 * @param {*} seller 
 * @param {*} buyyer 
 * @param {*} nftAddress 
 * @param {*} kind  721 1155
 * @param {*} param order: feeMethod、paymentToken、howToCall、asset、basePrice、saleKind、extra
 */
async function makeMatchOrder(deployed, param, warp) {
    const latestTime = await helpers.time.latest();
    const oneDayBefore  = latestTime - 3600 * 24;

    // sell --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- 
    if(warp){
        sellOrder = makeOrderWrap(deployed.exchange.address, param.seller, param.nft.address);
    }else{
        sellOrder = makeOrder(deployed.exchange.address, param.seller, param.nft.address);
    }
    sellOrder.taker = ZERO_ADDRESS;
    sellOrder.side = 1;
    

    // buy --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- 
    if(warp){
        buyyOrder = makeOrderWrap(deployed.exchange.address, param.buyer, param.nft.address);
    }else{
        buyyOrder = makeOrder(deployed.exchange.address, param.buyer, param.nft.address);
    }
    buyyOrder.taker = sellOrder.maker;
    buyyOrder.side = 0;
    
    // 相等
    sellOrder.feeMethod = buyyOrder.feeMethod = param.feeMethod;
    sellOrder.paymentToken = buyyOrder.paymentToken = param.paymentToken;
    sellOrder.howToCall = buyyOrder.howToCall = param.howToCall;

    // 计算 卖方双方 pirce
    sellOrder.saleKind  = buyyOrder.saleKind  = param.saleKind;
    sellOrder.basePrice = buyyOrder.basePrice = param.basePrice;
    sellOrder.extra     = buyyOrder.extra     = param.extra;
    sellOrder.listingTime = buyyOrder.listingTime = oneDayBefore;
    sellOrder.expirationTime = buyyOrder.expirationTime = 0;

    // 互斥 根据该字段 判断最终结算价格
    sellOrder.feeRecipient = FEE_ADDRESS;
    buyyOrder.feeRecipient = ZERO_ADDRESS;

    // calldata
    if(param.kind == "ERC721") {
        if(warp){
            sellOrder.calldataBeta = sellERC721ABI(param.seller.address, param.item);
            buyyOrder.calldataBeta = buyERC721ABI(param.buyer.address, param.item);
        }else{
            sellOrder.calldata = sellERC721ABI(param.seller.address, param.item);
            buyyOrder.calldata = buyERC721ABI(param.buyer.address, param.item);
        }
        sellOrder.replacementPattern = encodeERC721ReplacementPatternSell;
        buyyOrder.replacementPattern = encodeERC721ReplacementPatternBuy;
    }else{
        if(warp){
            sellOrder.calldataBeta = sellERC1155ABI(param.seller.address, param.item, param.value);
            buyyOrder.calldataBeta = buyERC1155ABI(param.buyer.address, param.item, param.value);
        }else{
            sellOrder.calldata = sellERC1155ABI(param.seller.address, param.item, param.value);
            buyyOrder.calldata = buyERC1155ABI(param.buyer.address, param.item, param.value);
        }
        sellOrder.replacementPattern = encodeERC1155ReplacementPatternSell;
        buyyOrder.replacementPattern = encodeERC1155ReplacementPatternBuy;
    }

    const orders = {
        sell: sellOrder,
        buy: buyyOrder
    };
    console.log(orders);

    return orders;
}


/** 获取用户 mock 资产集合
 * @param {*} accounts 
 * @returns 
 */
function getMockTokenAsset(accounts) {
    asset = [];
    let ids20 = generateArray(1, 20);
    for(index = 0; index < accounts.length; index++) {
        ids20 = ids20.map(function (id) {
            id = (index*20 + id);
            return id;
        });

        asset[index] = ids20;
    }
    console.log(asset);
    return asset;
}

/** 查看结果
 * requireAsset
 * @param {*} asset 
 * @returns 
            nft   : nft,
            seller: seller,
            buyer : buyer,
            item  : item, 
            price:  price,
            paymentToken: paymentToken,
 */
async function result(scheme) {

    let callBalanceOfSell = callBalanceOfBuy = callContractOwner = "";
    
    if(scheme.kind == "ERC721") {
        callContractOwner =  await scheme.nft.ownerOf(scheme.item);
    } else {
        callBalanceOfSell =  await scheme.nft.balanceOf(scheme.seller.address, scheme.item);
        callBalanceOfBuy =  await scheme.nft.balanceOf(scheme.buyer.address, scheme.item);
    }

    const fee_balance = await ethers.provider.getBalance(FEE_ADDRESS);
    const zero_balance = await ethers.provider.getBalance(ZERO_ADDRESS);
    
    const seller_balance = await ethers.provider.getBalance(scheme.seller.address);
    const buyer_balance = await ethers.provider.getBalance(scheme.buyer.address);

    
    console.log({
        "kind": scheme.kind,
        seller: scheme.seller.address,
        buyer: scheme.buyer.address,
        callContractOwner,
        callBalanceOfSell,
        callBalanceOfBuy,
        fee_balance,
        zero_balance,
        seller_balance,
        buyer_balance,
    });
}


module.exports = { 
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
    makeMatchOrder
 }