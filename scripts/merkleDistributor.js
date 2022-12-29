const fs = require('fs');
const MerkleTree = require('merkletreejs')
const keccak256 = require('keccak256')

const { getConfig, getDeployed, getMockDeployed, generateArray } = require('./library.js');

const contract_ABI = [
    "function mint(address to, uint256 id)",
    "function batchMint(address to, uint256[] ids)",
    
    "function mint(address to, uint256 id, uint256 amount, bytes data)",
    "function batchMint(address to, uint256[] ids, uint256[] amounts, bytes data)"
];

const iface = new ethers.utils.Interface(contract_ABI);

function getRandom (n, m) {
    var num = Math.floor(Math.random() * (m - n + 1) + n)
    return num
}

function splitArray(arr, len) {
    let a_len = arr.length;
    var result = [];
    for( i=0; i< a_len; i += len ){
        result.push(arr.slice(i, i+len));
    }
    return result;
}

async function player(){
    const json = JSON.parse(fs.readFileSync('./scripts/player.json', { encoding: 'utf8' }))
    if (typeof json !== 'object') throw new Error('Invalid JSON')
    return Object.keys(json);;
}

function launchpad() {
    let nft_5000 = generateArray(1, 5000);
    let project = {
        token : '',         // nft token contract
        receipt : '',       // receipt fee address 
        merkleRoot : '',    // merkle root 
        payment : '',       // how to pay erc20 or eth
        price : '',         // amount to pay
        nft : nft_5000
    }
    return project;
}

// type 721 || 1155
async function setAward(type = 721) {
    let ido = launchpad();
    
    let players = await player();
    
    let award_file = './scripts/award.json';
    let award = [];
    for( i = 0; i < ido.nft.length; i ++ ) {
        amount = type == 721 ? 1 : getRandom(1, 20);
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

async function getAward() {
    const json = JSON.parse(fs.readFileSync('./scripts/award.json', { encoding: 'utf8' }))
    if (typeof json !== 'object') throw new Error('Invalid JSON')
    return json;
}

async function awardGroup(count = 10) {
    let award = await getAward();
    
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

async function main () {
    const [exchange, mocker, rock, hosea, yety, suky, tester, feeer, join, bob] = await ethers.getSigners();

    // test user
    const accounts = [rock, hosea, yety, suky, join, bob];

    console.log("-----------------------------------------------------------");
    console.log("test account:", [exchange.address, mocker.address]);
    console.log("test account:", [rock.address, hosea.address, yety.address, suky.address, join.address, bob.address]);
    console.log("-----------------------------------------------------------");

    // get config
    // const configed = await getConfig();
    // const deployed = await getDeployed(configed, rock);
    // const mockDeployed = await getMockDeployed(configed, mocker);

    let award = await awardGroup();

    for(i = 0; i < award.length; i++){
        calldata = iface.encodeFunctionData("batchMint", [award[i].to, award[i].ids]);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Exception:", error);
    });