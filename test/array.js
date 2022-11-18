const { expect } = require("chai");
const { ethers } = require("hardhat");



describe("array", function () {
    
    it("array test", async function () {
        const accounts = await ethers.getSigners()
    
        signer = accounts[2];

        const ArrayUtils = await ethers.getContractFactory("ArrayUtilsTest");
        const arrayUtils = await ArrayUtils.deploy();
        await arrayUtils.deployed();

        const index = await arrayUtils.getIndex();
        const compare = await arrayUtils.compare();

        console.log({
            index,
            compare
        });

    });

});