# NFT market contract

> 匹配订单 从买/卖双方订单开始。卖方创建销售订单，以固定价格或者竞拍的方式，将 NFT挂出去; 买方创建购买订单，并将卖方创建的销售订单一起，发给交易合约 Exchange Contract。交易合约将对订单校验，校验通过后，完成两个转移：
* 支付费用转移
* NFT产品转移

> 整体架构、订单实体、用户注册代理钱包、签名、calldata生成等详解文档
 
```
yarn

yarn run compile

# support MetaMask、Dapp front-end
# 合约内已用 import "hardhat/console.sol" 进行充分打点 帮助开发中发现问题
npx hardhat node

# 部署合约存储在 *.deployed.json中
rm -rf ./31337.contract.deployed.json && yarn run reset

yarn run test:market

yarn run test:market:wrap

```

### 文档

   [Market设计文档](https://github.com/hoseadevops/edec-nft-market/blob/main/docs/Market%E8%AE%BE%E8%AE%A1%E6%96%87%E6%A1%A3.pdf)
   [签名 && calldata demo:js](https://github.com/hoseadevops/edec-nft-market/blob/main/test/verify.js)
   [签名 && calldata demo:sol](https://github.com/hoseadevops/edec-nft-market/blob/main/contracts/Verify.sol)