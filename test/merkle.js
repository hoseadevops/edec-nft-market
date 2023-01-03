const { expect } = require("chai");
const { ethers } = require("hardhat");



describe("merkle", function () {
    
    it("merkle test", async function () {
        const accounts = await ethers.getSigners()
    
        signer = accounts[2];

        const Merkle = await ethers.getContractFactory("Merkle");
        const merkle = await Merkle.deploy();
        await merkle.deployed();

        const root = "0xd92e0c446a9c7e1541113c4e5a0089bcf9989ecc3a53b682251725519accb255";
        
        const data = "0x4684d7e9000000000000000000000000f3c6f5f265f503f53ead8aae90fc257a5aa49ac10000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000023c000000000000000000000000000000000000000000000000000000000000024c00000000000000000000000000000000000000000000000000000000000002ac00000000000000000000000000000000000000000000000000000000000002e600000000000000000000000000000000000000000000000000000000000002f000000000000000000000000000000000000000000000000000000000000003130000000000000000000000000000000000000000000000000000000000000358000000000000000000000000000000000000000000000000000000000000042600000000000000000000000000000000000000000000000000000000000004380000000000000000000000000000000000000000000000000000000000000458";

        const merkleProof = [
            '0x76a6e9a3f303480c3d472d6bfae159b66299021d7e8b81b6c186a26539252370',
            '0xe8533814f726bbf67d6955edc626d54ea74820999672813013f676f8e06fe085',
            '0xfe8796b28aef6bdba22cc48fe68675ce52e0b00970bc12d42e3094a675a3f3d5',
            '0x186cb1968554b7176d7bb57ffe57f14a70c857aa78dd691fac36720b9fc01d28',
            '0x290e8f09c9f5907bf68d2e5efafab59324b022be10c7d8d4bcaf8e53a71a88b0',
            '0x70f0e0d170c3826bc47d5dbc59e375a17b0b66ea79950c00d17002f7d1b7364e',
            '0x0e43c2cf3d73cf1ca5d5220d732ac7f22c13bd4d6ce8876d39951a5c0bfc59ad',
            '0xf30991db0ccc7e8acf76e9ca029115eb77717012c80aeaa76fb640c87854b66d',
            '0xb4998a88d183395434a50d076fae85482c37d17c12916cb84a00c2fa8d81a07c',
            '0xf4da1d303790451a0f8cd7b75aeae41d9bf31a88a0a21984fe1da2513dd048fa'
        ];

        // const leaves = calldatas.map(( v, k ) => {
        //     return ethers.utils.solidityKeccak256(['uint256', 'uint256', 'bytes'], [roundID, k, v]);
        // })

        // const tree = new MerkleTree(leaves, keccak256, { sort: true })
        // const root = tree.getHexRoot()
    
        
        // const leaf = ethers.utils.solidityKeccak256(['uint256', 'uint256', 'bytes'], [roundID, index, calldatas[index]]);
        // const proof = tree.getHexProof(leaf)
    
        // console.log(tree.verify(proof, leaf, root)) // true
        // console.log(root, calldatas[index], proof, calldatas.length);


        ethers.utils.solidityKeccak256(['uint256', 'uint256', 'bytes'], [roundID, k, v]);

        merkle.launchpad(root);
        const result = await merkle.claim(data, merkleProof);

        console.log({
            result
        });

    });

});