const { getConfig, getMockDeployed, getDeployed, generateArray, registerWallet } = require('./library.js');


/** 初始化测试token 【erc20, erc721, erc1155】
 * 
 * @param {*} deployed 
 * @param {*} user 
 * @param {*} counter 
 */
async function mockToken(deployed, user, counter){
    // mock token 100w
    let eth_1_000_000_wei = ethers.utils.parseEther('1000000');

    await deployed.ht20.transfer(user.address, eth_1_000_000_wei);
    await deployed.uni20.transfer(user.address, eth_1_000_000_wei);
    await deployed.btc20.transfer(user.address, eth_1_000_000_wei);
    await deployed.usdt20.transfer(user.address, eth_1_000_000_wei);
    await deployed.fee20.transfer(user.address, eth_1_000_000_wei);

    console.log(`mint erc20 token to : ${user.address} value : ${eth_1_000_000_wei} in [ht20、uni20、btc20、usdt20、fee20]`);

    let ids20 = generateArray(1, 20);
    ids20 = ids20.map(function (id) {
        id = (counter*20 + id);
        return id;
    });
    const values_same_1 = Array.from({length: 20}, (_, i) => 1);
    
    let ids1020 = generateArray(1001, 1020);
    ids1020 = ids1020.map(function (id) {
        id = (counter*20 + id);
        return id;
    });
    
    const data1155 = ethers.utils.arrayify("0x");

    await deployed.vr721.batchMint(user.address, ids20);
    await deployed.art721.batchMint(user.address, ids20);
    await deployed.game721.batchMint(user.address, ids20);

    await deployed.vr1155.batchMint(user.address, ids20, values_same_1, data1155);
    await deployed.art1155.batchMint(user.address, ids20, values_same_1, data1155);
    await deployed.game1155.batchMint(user.address, ids20, values_same_1, data1155);

    await deployed.vr1155.batchMint(user.address, ids1020, ids1020, data1155);
    await deployed.art1155.batchMint(user.address, ids1020, ids1020, data1155);
    await deployed.game1155.batchMint(user.address, ids1020, ids1020, data1155);

    console.log({
        "mint" : `mint to ${user.address} nft in [vr721, art721, game721, vr1155, art1155, game1155]`,
        ids20,
        values_same_1,
        ids1020
    });

}

/** 用户授权自己的所有的 token【erc721、erc155】
 * 
 * @param {*} deployed 
 * @param {*} mockDeployed 
 * @param {*} user 
 */
async function setApprovalForAll(deployed, mockDeployed, user){
    
    const userRegisterProxy = await deployed.registry.proxies(user.address);
    
    const proxy = deployed.tokenTransferProxy.address;
    const all_token = ethers.constants.MaxUint256;
    await mockDeployed.ht20.connect(user).approve(proxy, all_token);
    await mockDeployed.uni20.connect(user).approve(proxy, all_token);
    await mockDeployed.btc20.connect(user).approve(proxy, all_token);
    await mockDeployed.fee20.connect(user).approve(proxy, all_token);
    await mockDeployed.usdt20.connect(user).approve(proxy, all_token);

    await mockDeployed.vr721.connect(user).setApprovalForAll(userRegisterProxy, true);
    await mockDeployed.art721.connect(user).setApprovalForAll(userRegisterProxy, true);
    await mockDeployed.game721.connect(user).setApprovalForAll(userRegisterProxy, true);

    await mockDeployed.vr1155.connect(user).setApprovalForAll(userRegisterProxy, true);
    await mockDeployed.art1155.connect(user).setApprovalForAll(userRegisterProxy, true);
    await mockDeployed.game1155.connect(user).setApprovalForAll(userRegisterProxy, true);

    console.log(`user ${user.address} call setApprovalForAll pass to : ${userRegisterProxy} in [vr721, art721, game721, vr1155, art1155, game1155]`);
}

async function main() {
    // test user
    const [exchangeOwner, mocker, rock, hosea, yety, suky, tester, fee, join, bob] = await ethers.getSigners();
    
    accounts = [rock, hosea, yety, suky, join, bob];
    
    console.log("-----------------------------------------------------------");
    console.log("test account:", [rock.address, hosea.address, yety.address, suky.address, join.address, bob.address]);
    console.log("-----------------------------------------------------------\n");

    const configed = await getConfig();
    const deployed = await getDeployed(configed, exchangeOwner);
    const mockDeployed = await getMockDeployed(configed, mocker);

    for(index = 0; index < accounts.length; index++) {
        await registerWallet(deployed, accounts[index]);
        await mockToken(mockDeployed, accounts[index], index);
        await setApprovalForAll(deployed, mockDeployed, accounts[index]);
    };
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("debug-error:" , error);
      process.exit(1);
    });