const fs = require('fs');
const { MerkleTree } = require('merkletreejs')
const keccak256 = require('keccak256')

const { getConfig, generateArray, getDeployedMD } = require('./library.js');

const ZERO_ADDRESS = ethers.constants.AddressZero;
const MAX_TOKEN = ethers.constants.MaxUint256;

const ABI_721_mint = [
    "function batchMint(address to, uint256[] ids)"
];

const ABI_721 = [
    "function mint(address _to, uint256 _tokenId)",
    "function multicall(address target, bytes[] calldata data)"
];

const ABI_721_withdraw = [
    "function batchWithdrawERC721(address nft, address to, uint256[] ids)"
];

const ABI_1155_mint = [
    "function batchMint(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)"
];

const ABI_1155_withdraw = [
    "function batchWithdrawERC1155(address nft, address to, uint256[] calldata ids, uint256[] calldata amounts)"
]

const typeABI = [
    ABI_721_mint,
    ABI_721_withdraw,
    ABI_1155_mint, 
    ABI_1155_withdraw,
    ABI_721
];

const typeERC = [
    "ERC721",
    "ERC721",
    "ERC1155",
    "ERC1155",
    "ERC721",
];

// include n and m
function getRandom (n, m) {
    return Math.floor(Math.random() * (m - n + 1) + n);
}

// split array to sub array
function splitArray(arr, len) {
    let a_len = arr.length;
    var result = [];
    for( i=0; i< a_len; i += len ){
        result.push(arr.slice(i, i+len));
    }
    return result;
}

// mock player
async function player(){
    const json = JSON.parse(fs.readFileSync('./scripts/player.json', { encoding: 'utf8' }))
    if (typeof json !== 'object') throw new Error('Invalid JSON')
    return Object.keys(json);;
}

// init launchpad
function launchpad(config = {}) {
    let nft_5000 = generateArray(1, 5000);
    let project = {
        roundID : '',
        target : '',         // nft target contract
        receipt : '',       // receipt fee address 
        merkleRoot : '',    // merkle root 
        payment : '',       // how to pay erc20 or eth
        price : '',         // amount to pay
        nft : nft_5000
    }
    project = Object.assign(project, config);
    return project;
}

// mock award 
// type ERC721 || ERC1155
async function setAward(type = 'ERC721') {
    let ido = launchpad();
    
    let players = await player();
    
    let award_file = `./scripts/${type}.award.json`;
    let award = [];
    for( i = 0; i < ido.nft.length; i ++ ) {
        amount = type == 'ERC721' ? 1 : getRandom(1, 20);
        let rand = getRandom(0, 98);
        let player = players[rand];
        let item = {
            "address" : player,
            "id" : ido.nft[i],
            "amount" : amount
        }
        award[i] = item;
    }
    let data = JSON.stringify(award);
    fs.writeFileSync(award_file, data);
}

// get award
async function getAward(type = 'ERC721') {
    const json = JSON.parse(fs.readFileSync(`./scripts/${type}.award.json`, { encoding: 'utf8' }))
    if (typeof json !== 'object') throw new Error('Invalid JSON')
    return json;
}

// group and page
async function awardGroup(type = 'ERC721', count = 10) {
    let award = await getAward(type);
    // group by player
    group = {};
    for( i=0; i < award.length; i++ ){
        let to = award[i].address;
        if(!group[to]){
            group[to] = {};
        }
        if(!group[to]["ids"]){
            group[to]["ids"] = [];
        }
        if(!group[to]["amounts"]){
            group[to]["amounts"] = [];
        }
        group[to]["ids"].push(award[i].id);
        group[to]["amounts"].push(award[i].amount);
    }
    // page by player's ids with count
    award = [];
    let players = await player();
    for( j=0; j < players.length; j++ ){
        let player = players[j];
        if(group[player]["ids"].length > count) {
            group[player]["ids"] = splitArray(group[player].ids, count);
            group[player]["amounts"] = splitArray(group[player].amounts, count);
            for( k = 0; k < group[player]["ids"].length; k++ ) {
                item = {};
                item['to'] = player;
                item['ids'] = group[player]["ids"][k];
                item['amounts'] = group[player]["amounts"][k];
                award.push(item);
            }
        } else {
            item = {};
            item['to'] = player;
            item['ids'] = group[player]["ids"];
            item['amounts'] = group[player]["amounts"];
            award.push(item);
        }
    }
    return award;
}

async function runCase(deployed, mocker, sender, testCase, project, testIndex = 4) {

    // paging awards
    const type     = typeERC[testCase];    // ERC721 、ERC1155
    let award = await awardGroup(type);

    //abi
    const iface = new ethers.utils.Interface(typeABI[testCase]);

    // abi calldata
    let calldatas = [];
    for(i = 0; i < 10; i++ ) {
        let calldata = "";
        // "function batchMint(address to, uint256[] ids)"
        if( testCase == 0 ) {
            calldata = iface.encodeFunctionData("batchMint", [award[i].to, award[i].ids]);
        }
        // "function batchWithdrawERC721(address nft, address to, uint256[] calldata ids)"
        if( testCase == 1 ) {
            calldata = iface.encodeFunctionData("batchWithdrawERC721", [deployed.art721.address, award[i].to, award[i].ids]);   
        }
        // "function batchMint(address to, uint256[] ids, uint256[] amounts, bytes data)",
        if( testCase == 2 ) {
            calldata = iface.encodeFunctionData("batchMint", [award[i].to, award[i].ids, award[i].amounts, '0x']);
        }
        // "function batchWithdrawERC1155(address nft, address to, uint256[] calldata ids, uint256[] calldata amounts)"
        if( testCase == 3 ) {
            calldata = iface.encodeFunctionData("batchWithdrawERC1155", [deployed.art1155.address, award[i].to, award[i].ids, award[i].amounts]);
        }
        if( testCase == 4 ) {
            let subCalldatas = [];
            for( j = 0; j < award[i].ids.length; j++ ) {
                subCalldatas.push (
                    iface.encodeFunctionData("mint", [award[i].to, award[i].ids[j]])
                );
            }
            calldata = iface.encodeFunctionData("multicall", [deployed.art721.address, subCalldatas]);
        }

        calldatas.push(calldata);
    }
    // mock nft
    if([1, 3].includes(testCase)) {
        await fixtureNFT(deployed, mocker, award[testIndex].ids, award[testIndex].amounts, type);
    }
    if([4].includes(testCase)) {
        const WITHDRAW_ROLE = await deployed.art721.connect(mocker).WITHDRAW_ROLE();
        await deployed.art721.connect(mocker).grantRole(WITHDRAW_ROLE, deployed.deposit.address);
    }

    // make tree with abi
    const leaves = calldatas.map(( v, k ) => {
        // roundID, index, calldata
        return ethers.utils.solidityKeccak256(['uint256', 'uint256', 'uint256', 'bytes'], [project.roundID, k, award[k].ids.length, v]);
    })
    const tree = new MerkleTree(leaves, keccak256, { sort: true })
    // get tree root
    const root = tree.getHexRoot()

    // for test
    const leaf = ethers.utils.solidityKeccak256(['uint256', 'uint256', 'uint256', 'bytes'], [project.roundID, testIndex, award[testIndex].ids.length, calldatas[testIndex]]);
    const proof = tree.getHexProof(leaf)

    console.log({
        testCase,
        testIndex,
        root, 
        testaward : award[testIndex],
        calldata : calldatas[testIndex], 
        proof, 
        verify : tree.verify(proof, leaf, root),
        length : calldatas.length,
    });

    // launchpad（end at 2023-10-05）
    await deployed.merkleDistributor.launchpad(project.roundID, project.target.address, root, project.receipt, project.payment, project.price, 0, 1696497563);

    // for pay eth 
    const override = {
        value: ethers.utils.parseEther("0.3"),
        gasLimit: 4100000
    };

    if( project.payment == "0x0000000000000000000000000000000000000000") {
        await deployed.merkleDistributor.connect(sender).claim(project.roundID, testIndex, award[testIndex].ids.length, calldatas[testIndex], proof, override);
    }else{
        await deployed.merkleDistributor.connect(sender).claim(project.roundID, testIndex, award[testIndex].ids.length, calldatas[testIndex], proof);
    }

    // get result
    const nft_721 = await deployed.art721.balanceOf(award[testIndex].to);
    const receipt_eth_balance = await ethers.provider.getBalance(project.receipt);
    const receipt_erc20_balance = await deployed.erc20.balanceOf(project.receipt);

    console.log("claim result", [
        award[testIndex],
        nft_721,
        receipt_eth_balance,
        receipt_erc20_balance
    ]);
}

function getProject(roundID, targets, testCase, payment=ZERO_ADDRESS){
    receipt = '0xdafea492d9c6733ae3d56b7ed1adb60692c98bc5';
    return launchpad({
        roundID,
        target : targets[testCase],   // nft target contract
        receipt,                      // receipt fee address 
        payment,                      // how to pay erc20 or eth
        price : 10000,                // amount to pay
    });
}

// mint nfts to deposit
async function fixtureNFT(deployed, mocker, ids, amounts, type) {
    try{
        if(type == "ERC721"){
            await deployed.art721.connect(mocker).batchMint(deployed.deposit.address, ids);
        } else {
            await deployed.art1155.connect(mocker).batchMint(deployed.deposit.address, ids, amounts, '0x');
        }
    }catch( error ){
        console.log("fixtureNFT: ", error);
    }
}

// transfer fee to sender
// sender approve target to merkleDistributor
async function fixtureERC20(deployed, mocker, sender) {
    let eth_1_000_000_wei = ethers.utils.parseEther('1000000');
    await deployed.erc20.connect(mocker).transfer(sender.address, eth_1_000_000_wei);
    await deployed.erc20.connect(sender).approve(deployed.merkleDistributor.address, MAX_TOKEN);
}

// mock award to json
async function mockAward() {
    await setAward("ERC721");
    await setAward("ERC1155");
}

async function main () {    
    
    const [exchange, mocker, rock, hosea, yety, suky, tester, feeer, join, bob] = await ethers.getSigners();

    // test user
    const accounts = [rock, hosea, yety, suky, join, bob];

    console.log("-----------------------------------------------------------");
    console.log("test account:", [exchange.address, mocker.address]);
    console.log("test account:", [rock.address, hosea.address, yety.address, suky.address, join.address, bob.address]);
    console.log("-----------------------------------------------------------");

    // config
    const configed = await getConfig();
    const deployed = await getDeployedMD(configed, exchange);
    const targets = [ deployed.art721, deployed.deposit, deployed.art1155, deployed.deposit,  deployed.deposit];
    const sender = join;

    // mock award
    // await mockAward();

    await fixtureERC20(deployed, mocker, sender);

    // for test 
    const fee = deployed.erc20.address;
    const proejcts = [
        getProject(1, targets, 0, fee),
        getProject(2, targets, 1, fee),
        getProject(3, targets, 2),
        getProject(4, targets, 3),
        getProject(5, targets, 4),
    ];

    for( testCase = 0; testCase <proejcts.length; testCase++ ){
        const testIndex = (testCase+1);
        try {
            await runCase(deployed, mocker, sender, testCase, proejcts[testCase], testIndex);
        } catch(error) {
            console.error(`Exception Debug : ${testCase} :`, error);
        }
        console.log("___________________________________________________________________________________________\n\n")
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Exception:", error);
    });