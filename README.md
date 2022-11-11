# NFT market contract

> 匹配订单 从买/卖双方订单开始。卖方创建销售订单，以固定价格或者竞拍的方式，将 NFT挂出去; 买方创建购买订单，并将卖方创建的销售订单一起，发给交易合约 Exchange Contract。交易合约将对订单校验，校验通过后，完成转移：
* 支付费用转移
* NFT产品转移

> 整体架构、订单实体、用户注册代理钱包、签名、calldata、replacementPattern 生成等 参考文档和测试用例
 
```
yarn

# ABI 在 artifacts中
yarn run compile

# support MetaMask、Dapp front-end
# 合约内已用 import "hardhat/console.sol" 进行充分打点 
npx hardhat node

# 部署合约存储在 *.deployed.json中
rm -rf ./31337.contract.deployed.json && yarn run reset

# ERC721 && ERC1155 测试
yarn run test:market

# ERC721批量 测试
yarn run test:market:wrap

# 合约接口文档
open documents/index.html

# 签名 && calldata 测试
npx hardhat test
```

### 文档

   [Market设计文档](https://github.com/hoseadevops/edec-nft-market/blob/main/docs/Market%E8%AE%BE%E8%AE%A1%E6%96%87%E6%A1%A3.pdf)

   [签名 && calldata demo  js](https://github.com/hoseadevops/edec-nft-market/blob/main/test/verify.js)

   [签名 && calldata demo  solidity](https://github.com/hoseadevops/edec-nft-market/blob/main/contracts/Verify.sol)

   * 合约接口: documents/index.html
       * 可参考 contracts/NFTMarket.sol: Exchange 合约  和  contracts/NFTMarketWrap.sol合约 
       * 可参考：测试用例

### 流程图

> 买

![image](docs/images/seller.avif)

> 卖

![image](docs/images/buyer.avif)

> 订单参数效验

![image](docs/images/wyvern-exchange-order-params-check.png)

> 订单合法性校验

![image](docs/images/wyvern-exchange-order-check.png)

> 最终价格 - 价格计算

![image](docs/images/wyvern-exchange-order-price.png)

> 最终价格

![image](docs/images/wyvern-exchange-order-final-price.png)


> 费用是由卖单中的 feeMethod 指定的，收取方式有两种：

* SplitFee： 根据卖方或者买方中的订单记录（二选一），买卖双方按照卖方订单中指定的支付币种（ether 或 erc20 token）各自支付 RelayerFee 给订单指定的 FeeRecipient，由买卖双方各自支付 ProtocolFee 给交易合约（Wyvern Exchange Contract）中指定的 protocolFeeRecipient.
* ProtocolFee： 根据卖方或者买方中的订单记录，使用交易合约中指定的 exchangeToken 支付

> protocol fee

![image](docs/images/wyvern-exchange-protocol-fee.png)

> relayer fee

![image](docs/images/wyvern-exchange-relayer-fee.png)


> 订单匹配 - 交易转账
 
![image](docs/images/wyvern-exchange-pay.png)


> 订单匹配 - NFT转移

![image](docs/images/wyvern-exchange-match.png)

    
