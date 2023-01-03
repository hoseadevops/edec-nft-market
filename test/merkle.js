const { expect } = require("chai");
const { ethers } = require("hardhat");



describe("merkle", function () {
    
    it("merkle test", async function () {
        const accounts = await ethers.getSigners()
    
        signer = accounts[2];

        const Merkle = await ethers.getContractFactory("Merkle");
        const merkle = await Merkle.deploy();
        await merkle.deployed();

        const root = '0x11381fb36c881488e2da280d765e9ab67f628633101f1bea93bdefa8c9584c3b';
        const data = '0x6f35ef4ca71a4ee8a720aea738a6760254077ee70d99e8ce-a514-4cba-99ff-0e67123d4fed';
        const merkleProof = [];

        merkle.launchpad(root);
        const result = await merkle.claim(data, merkleProof);

        console.log({
            result
        });

    });

});