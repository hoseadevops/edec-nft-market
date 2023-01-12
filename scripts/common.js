const { getConfig, getDeployed, getMockDeployed, generateArray } = require('./library.js');
const helpers = require("@nomicfoundation/hardhat-network-helpers");

const encodeERC721ReplacementPatternSell       = '0x000000000000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000000'
const encodeERC721ReplacementPatternBuy        = '0x00000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
const encodeERC1155ReplacementPatternSell      = '0x000000000000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
const encodeERC1155ReplacementPatternBuy       = '0x00000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
const encodeERC721OfferReplacementPatternBuy   = '0x00000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
const encodeERC721OfferReplacementPatternSell  = '0x'
const encodeERC1155OfferReplacementPatternBuy  = '0x00000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
const encodeERC1155OfferReplacementPatternSell = '0x'

const ZERO_ADDRESS = ethers.constants.AddressZero;
const ZERO_HASH    = ethers.constants.HashZero;
const ZERO         = ethers.constants.Zero;
const SALT         = ethers.BigNumber.from(123456);
const kind = {
    "ERC721": "ERC721",
    "ERC1155": "ERC1155"
};
// feeer EOA if an contract  must can reciver eth.
const FEE_RECIPIENT = "0xB3b765AC9DD4A9Bde5B157fDDc492b1F5BB8547f";

const contract_ABI = [
    "function transferFrom(address from, address to, uint256 tokenId)",
    "function safeTransferFrom(address _from, address _to, uint256 _id, uint256 _value, bytes calldata _data)",
    "function safeBatchTransferFrom(address from, address to, uint256[] calldata ids, uint256[] calldata amounts, bytes calldata data)",
    "function atomicize(address[] calldata addrs, uint256[] calldata values, uint256[] calldata calldataLengths, bytes calldata calldatas)"
];
let iface = new ethers.utils.Interface(contract_ABI);

// transactions = [
//     { token: mockDeployed.art721.address, seller: seller1.address, buyer: buyer.address, id: seller1_asset[1], value: '0' },
//     { token: mockDeployed.vr721.address, seller: seller2.address, buyer: buyer.address, id: seller2_asset[1], value: '0' },
//     { token: mockDeployed.game721.address, seller: seller3.address, buyer: buyer.address, id: seller3_asset[1], value: '0' },
// ];

// get 721 sell calldata
function sellERC721ABI(seller, id, to) {
    if(!to) {
        to = ZERO_ADDRESS;
    }
    return iface.encodeFunctionData("transferFrom", [seller, to, id]);
}

function ERC721ABI(from, to, id) {
    return iface.encodeFunctionData("transferFrom", [from, to, id]);
}

function ERC1155ABI( from, to, id, value ) {
    return iface.encodeFunctionData("safeTransferFrom", [from, to, id, value, '0x']);
}

function batchERC721Atomicized(transactions) {
    const atomicize = [
        transactions.map(t => t.token),
        transactions.map(t => t.value),
        transactions.map(t => {
            t.calldata = iface.encodeFunctionData("transferFrom", [t.seller, t.buyer, t.id])
            return (t.calldata.length - 2) / 2;
        }),
       transactions.map(t => t.calldata).reduce((x, y) => x + y.slice(2))
    ]
    return iface.encodeFunctionData("atomicize", [...atomicize]);
}

// get 721 buy calldata
function buyERC721ABI( buyer, id , from) { 
    if(!from){
        from = ZERO_ADDRESS;
    }
    return iface.encodeFunctionData("transferFrom", [from, buyer, id]);
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

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
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

function getEIP712TypedData(orderStr, eip712Domain, nonce) {
    const order = JSON.parse(orderStr);
    return {
        types: {
            Order: [
                {type: 'address', name: 'exchange'},
                {type: 'address', name: 'maker'},
                {type: 'address', name: 'taker'},
                {type: 'uint256', name: 'makerRelayerFee'},
                {type: 'uint256', name: 'takerRelayerFee'},
                {type: 'uint256', name: 'makerProtocolFee'},
                {type: 'uint256', name: 'takerProtocolFee'},
                {type: 'address', name: 'feeRecipient'},
                {type: 'uint8', name: 'feeMethod'},
                {type: 'uint8', name: 'side'},
                {type: 'uint8', name: 'saleKind'},
                {type: 'address', name: 'target'},
                {type: 'uint8', name: 'howToCall'},
                {type: 'bytes', name: 'calldata'},
                {type: 'bytes', name: 'replacementPattern'},
                {type: 'address', name: 'staticTarget'},
                {type: 'bytes', name: 'staticExtradata'},
                {type: 'address', name: 'paymentToken'},
                {type: 'uint256', name: 'basePrice'},
                {type: 'uint256', name: 'extra'},
                {type: 'uint256', name: 'listingTime'},
                {type: 'uint256', name: 'expirationTime'},
                {type: 'uint256', name: 'salt'},
                {type: 'uint256', name: 'nonce'}
            ]
        },
        domain: eip712Domain,
        primaryType: 'Order',
        message: {
            exchange: order.exchange,
            maker: order.maker,
            taker: order.taker,
            makerRelayerFee: order.makerRelayerFee,
            takerRelayerFee: order.takerRelayerFee,
            makerProtocolFee: order.makerProtocolFee,
            takerProtocolFee: order.takerProtocolFee,
            feeRecipient: order.feeRecipient,
            feeMethod: Number(order.feeMethod),
            side: Number(order.side),
            saleKind: Number(order.saleKind),
            target: order.target,
            howToCall: Number(order.howToCall),
            calldata: order.calldata,
            replacementPattern: order.replacementPattern,
            staticTarget: order.staticTarget,
            staticExtradata: order.staticExtradata,
            paymentToken: order.paymentToken,
            basePrice: order.basePrice,
            extra: order.extra,
            listingTime: order.listingTime,
            expirationTime: order.expirationTime,
            salt: order.salt,
            nonce
        }
    }
}

/** sign
 * 
 * @param {签名数据} hash 
 * @param {签名用户} senderAddress 
 * @returns 
 */
async function signature(deployed, order, sender) {
    const eip712Domain = {
        name: 'Core Sky Exchange Contract',
        version: '1.0',
        chainId: 1,
        verifyingContract: deployed.exchange.address,
    };
    const nonces = await deployed.exchange.nonces(sender.address);
    const nonce = nonces.toString();

    const typedData = getEIP712TypedData(JSON.stringify(order), eip712Domain, Number(nonce))


    const signature = await sender._signTypedData(
        typedData.domain,
        typedData.types,
        typedData.message
    );

    const vrs = await ethers.utils.splitSignature(signature);

    const sig = {
        signature : signature,
        v : vrs.v,
        s : vrs.s,
        r : vrs.r
    }
    // // testing 
    let verifiedAddress = ethers.utils.verifyTypedData(typedData.domain, typedData.types, typedData.message, signature)

    console.log({
        "sender": sender.address,
        verifiedAddress
    });

    return sig;
}

//get hash order from contract
async function getHashOrder(deployed, order, sender){
    return await deployed.exchange.connect(sender).hashOrder_(
        [order.exchange, order.maker, order.taker, order.feeRecipient, order.target, order.staticTarget, order.paymentToken],
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
        [order.exchange, order.maker, order.taker, order.feeRecipient, order.target, order.staticTarget, order.paymentToken],
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
        [order.exchange, order.maker, order.taker, order.feeRecipient, order.target, order.staticTarget, order.paymentToken],
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
    
    let sig = await signature(deployed, order, sender);
    
    return await deployed.exchange.connect(sender).validateOrder_(
        [order.exchange, order.maker, order.taker, order.feeRecipient, order.target, order.staticTarget, order.paymentToken],
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
        [buy.exchange, buy.maker, buy.taker, buy.feeRecipient, buy.target, buy.staticTarget, buy.paymentToken, sell.exchange, sell.maker, sell.taker, sell.feeRecipient, sell.target, sell.staticTarget, sell.paymentToken],
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

    let sigBuyy = await signature(deployed, buy, buyyer);
    let sigSell = await signature(deployed, sell, seller);

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
    const oneDayBefore  = 1669132800;

    sellOrder = makeOrder(deployed.exchange.address, param.seller, param.nft.address);
    
    sellOrder.taker = ZERO_ADDRESS;
    sellOrder.side = 1;
    
    buyyOrder = makeOrder(deployed.exchange.address, param.buyer, param.nft.address);
    
    buyyOrder.taker = sellOrder.maker;
    buyyOrder.side = 0;
    
    // 相等
    sellOrder.feeMethod = buyyOrder.feeMethod = param.feeMethod;
    paymentToken = (param.paymentToken == ZERO_ADDRESS) ? ZERO_ADDRESS : param.paymentToken.address;
    sellOrder.paymentToken = buyyOrder.paymentToken = paymentToken;
    sellOrder.howToCall = buyyOrder.howToCall = param.howToCall;

    // 计算 卖方双方 pirce
    sellOrder.saleKind  = buyyOrder.saleKind  = param.saleKind;
    sellOrder.basePrice = buyyOrder.basePrice = param.basePrice;
    sellOrder.extra     = buyyOrder.extra     = param.extra;
    sellOrder.listingTime = buyyOrder.listingTime = oneDayBefore;
    sellOrder.expirationTime = buyyOrder.expirationTime = 0;

    // 互斥 根据该字段 判断最终结算价格
    sellOrder.feeRecipient = FEE_RECIPIENT;
    buyyOrder.feeRecipient = ZERO_ADDRESS;

    // calldata
    if(param.kind == "ERC721") {
        sellOrder.calldata = sellERC721ABI(param.seller.address, param.item);
        buyyOrder.calldata = buyERC721ABI(param.buyer.address, param.item);
        
        sellOrder.replacementPattern = encodeERC721ReplacementPatternSell;
        buyyOrder.replacementPattern = encodeERC721ReplacementPatternBuy;
    }else{
        sellOrder.calldata = sellERC1155ABI(param.seller.address, param.item, param.value);
        buyyOrder.calldata = buyERC1155ABI(param.buyer.address, param.item, param.value);
        
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

async function makeMatchOrderGoerli(deployed, param, warp) {
    const oneDayBefore  = 1669132800;
    sellOrder = makeOrder(deployed.exchange.address, param.seller, param.nft);
    
    sellOrder.taker = ZERO_ADDRESS;
    sellOrder.side = 1;
    
    buyyOrder = makeOrder(deployed.exchange.address, param.buyer, param.nft);
    
    buyyOrder.taker = sellOrder.maker;
    buyyOrder.side = 0;
    
    // 相等
    sellOrder.feeMethod = buyyOrder.feeMethod = param.feeMethod;
    paymentToken = (param.paymentToken == ZERO_ADDRESS) ? ZERO_ADDRESS : param.paymentToken.address;
    sellOrder.paymentToken = buyyOrder.paymentToken = paymentToken;
    sellOrder.howToCall = buyyOrder.howToCall = param.howToCall;

    // 计算 卖方双方 pirce
    sellOrder.saleKind  = buyyOrder.saleKind  = param.saleKind;
    sellOrder.basePrice = buyyOrder.basePrice = param.basePrice;
    sellOrder.extra     = buyyOrder.extra     = param.extra;
    sellOrder.listingTime = buyyOrder.listingTime = oneDayBefore;
    sellOrder.expirationTime = buyyOrder.expirationTime = 0;

    // 互斥 根据该字段 判断最终结算价格
    sellOrder.feeRecipient = FEE_RECIPIENT;
    buyyOrder.feeRecipient = ZERO_ADDRESS;

    // calldata
    if(param.kind == "ERC721") {
        sellOrder.calldata = sellERC721ABI(param.seller.address, param.item);
        buyyOrder.calldata = buyERC721ABI(param.buyer.address, param.item);
        
        sellOrder.replacementPattern = encodeERC721ReplacementPatternSell;
        buyyOrder.replacementPattern = encodeERC721ReplacementPatternBuy;
    }else{
        sellOrder.calldata = sellERC1155ABI(param.seller.address, param.item, param.value);
        buyyOrder.calldata = buyERC1155ABI(param.buyer.address, param.item, param.value);
        
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
function getMockTokenAsset(accounts, ERC1155 = false) {
    asset = [];
    let ids20 = [];
    if(!ERC1155){
        ids20 = generateArray(1, 20);
    }else{
        ids20 = generateArray(1001, 1020);
    }

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

    let callBalanceOfSell = callBalanceOfBuy = callNFTContractOwner = "";
    
    if(scheme.kind == "ERC721") {
        callNFTContractOwner =  await scheme.nft.ownerOf(scheme.item);
    } else {
        callBalanceOfSell =  await scheme.nft.balanceOf(scheme.seller.address, scheme.item);
        callBalanceOfBuy =  await scheme.nft.balanceOf(scheme.buyer.address, scheme.item);
    }
    
    const fee_balance = await ethers.provider.getBalance(FEE_RECIPIENT);
    const zero_balance = await ethers.provider.getBalance(ZERO_ADDRESS);
    
    const seller_balance = await ethers.provider.getBalance(scheme.seller.address);
    const buyer_balance = await ethers.provider.getBalance(scheme.buyer.address);

    
    let paymentToken = scheme.paymentToken;
    let paymentTokenSell = 0;
    let paymentTokenBuy = 0;

    if(scheme.paymentToken != ZERO_ADDRESS) {
        paymentToken = scheme.paymentToken.address;
        paymentTokenSell = await scheme.paymentToken.balanceOf(scheme.seller.address);
        paymentTokenBuy = await scheme.paymentToken.balanceOf(scheme.buyer.address);
    }

    console.log({
        "kind": scheme.kind,
        seller: scheme.seller.address,
        buyer: scheme.buyer.address,
        paymentToken,
        paymentTokenSell,
        paymentTokenBuy,
        callNFTContractOwner,
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
    makeMatchOrderGoerli,
    FEE_RECIPIENT,
    encodeERC721OfferReplacementPatternBuy,
    encodeERC721OfferReplacementPatternSell,
    encodeERC1155OfferReplacementPatternBuy,
    encodeERC1155OfferReplacementPatternSell
 }