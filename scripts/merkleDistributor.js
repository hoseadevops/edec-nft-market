const fs = require('fs');
const { MerkleTree } = require('merkletreejs')
const keccak256 = require('keccak256')

const { getConfig, getDeployed, getMockDeployed, generateArray } = require('./library.js');

const ABI_721 = [
    "function batchMint(address to, uint256[] ids)",
    "function batchTransfer(address to, uint256[] ids)"
];
const ABI_1155 = [
    "function batchMint(address to, uint256[] ids, uint256[] amounts, bytes data)",
    "function batchTransfer(address to, uint256[] ids, uint256[] amounts, bytes data)"
]

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

async function getAward(type = 'ERC721') {
    const json = JSON.parse(fs.readFileSync(`./scripts/${type}.award.json`, { encoding: 'utf8' }))
    if (typeof json !== 'object') throw new Error('Invalid JSON')
    return json;
}

async function awardGroup(type='ERC721', count = 10) {
    let award = await getAward(type);
    
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
    
    // await setAward("ERC721");
    // await setAward("ERC1155");
    
    const typeABI = {
        "ERC721" : ABI_721,
        "ERC1155" : ABI_1155
    };

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

    // for test
    const type = "ERC721";
    const roundID = 1;
    
    let award = await awardGroup(type);
    const iface = new ethers.utils.Interface(typeABI[type]);
    
    calldatas = [];
    
    for(i = 0; i < award.length; i++ ) {
        if( type == "ERC721" ) {
            calldata = iface.encodeFunctionData("batchMint", [award[i].to, award[i].ids]);
            calldatas.push(calldata);
        }

        if( type == "ERC1155" ) {
            calldata = iface.encodeFunctionData("batchMint", [award[i].to, award[i].ids, award[i].amounts, ""]);
            calldatas.push(calldata);
        }
    }
    
    const leaves = calldatas.map(( v, k ) => {
        console.log(k, v);
        return keccak256([roundID, k, v]);
    })
    const tree = new MerkleTree(leaves, keccak256, { sort: true })
    const root = tree.getHexRoot()

    const leaf = keccak256([roundID, 0, calldatas[0]]);
    const proof = tree.getHexProof(leaf)
    
    console.log(root, calldatas[0], proof, calldatas.length);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Exception:", error);
    });