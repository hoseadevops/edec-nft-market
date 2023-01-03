const { expect } = require("chai");
const { ethers } = require("hardhat");



describe("merkle", function () {
    
    it("merkle test", async function () {
        const accounts = await ethers.getSigners()
    
        signer = accounts[2];

        const Merkle = await ethers.getContractFactory("Merkle");
        const merkle = await Merkle.deploy();
        await merkle.deployed();

        const root = "0x11381fb36c881488e2da280d765e9ab67f628633101f1bea93bdefa8c9584c3b";
        
        const data = "0x6f35ef4ca71a4ee8a720aea738a6760254077ee70d99e8ce-a514-4cba-99ff-0e67123d4fed";

        const merkleProof = [
            '0x40B260087CC91E8F18058566B79C04A77BF1CA829FD4BF206D46B527F9432700', 
            '0x82629F198AFBD91749E2BCEC863BC3B86FA83BA08B87BFFDA381222F002958AA', 
            '0x0CA4B0ED8321489EFBC5540780192348F9BEF4AAF2E8DE92AB682380CC73613E', 
            '0xD185D348FDF2E901502FA93F39A63507F532D6209F15A08080D3D6DA2447B99E'
        ]

        await merkle.launchpad(root);
        const getRoot = await merkle.merkleRoot();

        let result = await merkle.claim(data, merkleProof);


        console.log({
            getRoot,
            result
        });

    });

});