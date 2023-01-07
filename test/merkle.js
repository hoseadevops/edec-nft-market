const { expect } = require("chai");
const { ethers } = require("hardhat");

const { MerkleTree } = require('merkletreejs')
const keccak256 = require('keccak256')

const ABI_721_mint = [
    "function batchMint(address to, uint256[] ids)"
];

describe("merkle", function () {
    
    it("merkle test", async function () {
        // const accounts = await ethers.getSigners()
    
        // signer = accounts[2];

        // const Merkle = await ethers.getContractFactory("Merkle");
        // const merkle = await Merkle.deploy();
        // await merkle.deployed();

        getNode = "0xfd240a711cd27d4a6660ec1994d655421391a5feb11fb9cc045ef45d4c867611";

        calldatas = [
            "0x23b872dd000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb9226600000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c80000000000000000000000000000000000000000000000000000000000000001",
            "0x23b872dd000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb9226600000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c80000000000000000000000000000000000000000000000000000000000000002",
        ];

        data = calldatas[0];
        let leaf = ethers.utils.solidityKeccak256(['uint256', 'uint256', 'bytes'], [1, 0, data]);
        // leaf = web3.utils.soliditySha3({t: 'bytes', v: data});

        console.log({
            leaf,
            getNode
        });

        // // make tree with abi
        // const leaves = calldatas.map(( v, k ) => {
        //     // roundID, index, calldata
        //     return ethers.utils.solidityKeccak256(['bytes'], [v]);        
        // })
        
        // const tree = new MerkleTree(leaves, keccak256, { sort: true })
        // // get tree root
        // const root = tree.getHexRoot()

        // data = calldatas[0];
        // const leaf = ethers.utils.solidityKeccak256(['bytes'], [data]);
        // const proof = tree.getHexProof(leaf)

        // console.log({
        //     leaves,
        //     root,
        //     leaf,
        //     proof
        // });


        // await merkle.launchpad(root);
        // const getRoot = await merkle.merkleRoot();

        // let result = await merkle.claim(data, proof);


        // console.log({
        //     getRoot,
        //     result
        // });

    });

});