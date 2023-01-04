const fs = require('fs');
const { MerkleTree } = require('merkletreejs')
const keccak256 = require('keccak256')

const { getConfig, generateArray, getDeployedMD } = require('./library.js');

const ZERO_ADDRESS = ethers.constants.AddressZero;
const MAX_TOKEN = ethers.constants.MaxUint256;

const ABI_721_mint = [
    "function batchMint(address to, uint256[] ids)"
];

const ABI_721_withdraw = [
    "function batchWithdrawERC721(address nft, address to, uint256[] calldata ids)"
];

const ABI_1155_mint = [
    "function batchMint(address to, uint256[] ids, uint256[] amounts, bytes data)",
];

const ABI_1155_withdraw = [
    "function batchWithdrawERC1155(address nft, address to, uint256[] calldata ids, uint256[] calldata amounts)"
]

const typeABI = [
    ABI_721_mint,
    ABI_721_withdraw,
    ABI_1155_mint, 
    ABI_1155_withdraw
];

const typeERC = [
    "ERC721",
    "ERC721",
    "ERC1155",
    "ERC1155"
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
        token : '',         // nft token contract
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
async function awardGroup(type='ERC721', count = 10) {
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


async function runCase(deployed, sender, testCase, project) {
    // paging awards
    const type     = typeERC[testCase];    // ERC721 、ERC1155
    let award = await awardGroup(type);

    //abi
    const iface = new ethers.utils.Interface(typeABI[testCase]);    
    calldatas = [];
    for(i = 0; i < award.length; i++ ) {
        // "function batchMint(address to, uint256[] ids)"
        if( testCase == 0 ) {
            calldata = iface.encodeFunctionData("batchMint", [award[i].to, award[i].ids]);
        }
        // "function batchWithdrawERC721(address nft, address to, uint256[] calldata ids)"
        if( testCase == 1 ) {
            calldata = iface.encodeFunctionData("batchWithdrawERC721", [project.token.address, award[i].to, award[i].ids]);
        }
        // "function batchMint(address to, uint256[] ids, uint256[] amounts, bytes data)",
        if( testCase == 2 ) {
            calldata = iface.encodeFunctionData("batchMint", [award[i].to, award[i].ids, award[i].amounts, ""]);
        }
        "function batchWithdrawERC1155(address nft, address to, uint256[] calldata ids, uint256[] calldata amounts)"
        if( testCase == 3 ) {
            calldata = iface.encodeFunctionData("batchWithdrawERC1155", [project.token.address, award[i].to, award[i].ids, award[i].amounts]);
        }
        calldatas.push(calldata);
    }
    
    // make tree with abi
    const leaves = calldatas.map(( v, k ) => {
        // roundID, index, calldata
        return ethers.utils.solidityKeccak256(['uint256', 'uint256', 'bytes'], [project.roundID, k, v]);
    })
    const tree = new MerkleTree(leaves, keccak256, { sort: true })
    // get tree root
    const root = tree.getHexRoot()

    // for test 
    testIndex = 4;
    const leaf = ethers.utils.solidityKeccak256(['uint256', 'uint256', 'bytes'], [project.roundID, testIndex, calldatas[testIndex]]);
    const proof = tree.getHexProof(leaf)

    console.log({
        root, 
        calldata : calldatas[testIndex], 
        proof, 
        verify : tree.verify(proof, leaf, root),
        length : calldatas.length,
    });

    // launchpad
    await deployed.merkleDistributor.launchpad(project.roundID, project.token.address, root, project.receipt, project.payment, project.price);

    // for pay eth 
    const override = {
        value: ethers.utils.parseEther("0.3"),
        gasLimit: 4100000
    };
    if(project.payment == '0x0000000000000000000000000000000000000000'){
        await deployed.merkleDistributor.connect(sender).claim(project.roundID, testIndex, calldatas[testIndex], proof, override);
    }else{
        await deployed.merkleDistributor.connect(sender).claim(project.roundID, testIndex, calldatas[testIndex], proof);
    }

    // get result
    const to_nft = await project.token.balanceOf(award[testIndex].to);
    const receipt_eth_balance =  await ethers.provider.getBalance(project.receipt);
    const receipt_erc20_balance = await deployed.erc20.balanceOf(project.receipt);

    console.log("claim result", [
        award[testIndex],
        to_nft,
        receipt_eth_balance,
        receipt_erc20_balance
    ]);
}

function getProject(roundID, tokens, testCase, payment=ZERO_ADDRESS){
    return launchpad({
        roundID,
        token : tokens[testCase],   // nft token contract
        receipt : ZERO_ADDRESS,     // receipt fee address 
        payment,                    // how to pay erc20 or eth
        price : 10000,              // amount to pay
    });
}

async function fixture(deployed, mocker, sender) {
    // transfer fee to sender
    // approve token to merkleDistributor
    let eth_1_000_000_wei = ethers.utils.parseEther('1000000');
    await deployed.erc20.connect(mocker).transfer(sender.address, eth_1_000_000_wei);
    await deployed.erc20.connect(sender).approve(deployed.merkleDistributor.address, MAX_TOKEN);

    // mint nfts
    // transfer nft to deposit
}

async function mockAward() {
    // mock award to json
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
    const tokens = [ deployed.art721, deployed.deposit, deployed.art1155, deployed.deposit];
    const sender = join;

    // await mockAward();
    // await fixture(deployed, mocker, sender);

    // for test 
    const proejcts = [
        getProject(1, tokens, 0),
        getProject(2, tokens, 1),
        getProject(3, tokens, 2),
        getProject(4, tokens, 3)
    ];

    for(testCase = 0; testCase <proejcts.length; testCase++){
        await runCase(deployed, sender, testCase, proejcts[testCase]);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Exception:", error);
    });