const { expect } = require("chai");
const { ethers } = require("hardhat");

const { MerkleTree } = require('merkletreejs')
const keccak256 = require('keccak256')

const ABI_721_mint = [
    "function batchMint(address to, uint256[] ids)"
];

describe("merkle", function () {
    
    it("merkle test", async function () {
        const accounts = await ethers.getSigners()
    
        signer = accounts[2];

        const Merkle = await ethers.getContractFactory("Merkle");
        const merkle = await Merkle.deploy();
        await merkle.deployed();


        calldatas = [
            "0x23b872dd000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb9226600000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c80000000000000000000000000000000000000000000000000000000000000001",
            "0x23b872dd000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb9226600000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c80000000000000000000000000000000000000000000000000000000000000002",
        ];

        // make tree with abi
        const leaves = calldatas.map(( v, k ) => {
            // roundID, index, calldata
            return ethers.utils.solidityKeccak256(['bytes'], [v]);
        })
        
        const tree = new MerkleTree(leaves, keccak256, { sort: true })
        // get tree root
        const root = tree.getHexRoot()

        const leaf = ethers.utils.solidityKeccak256(['bytes'], ["0x23b872dd000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb9226600000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c80000000000000000000000000000000000000000000000000000000000000001"]);
        const proof = tree.getHexProof(leaf)

        console.log({
            leaves,
            root,
            leaf,
            proof
        });

        data = calldatas[0];


        await merkle.launchpad(root);
        const getRoot = await merkle.merkleRoot();

        let result = await merkle.claim(data, proof);


        console.log({
            getRoot,
            result
        });

    });

});