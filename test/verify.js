const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Verify", function () {
    it("Check signature", async function () {
   
    const accounts = await ethers.getSigners()
    
    signer = accounts[2];

    const Verify = await ethers.getContractFactory("Verify");
    const verify = await Verify.deploy();
    await verify.deployed()

    originMsg = "0x3d0eda954fcafd6acca3dae8d41fab5f2a14268cb5d33523be32fad23d9b106d";

    messageHashBytes = ethers.utils.arrayify(originMsg);
    signature = await signer.signMessage(messageHashBytes)

    vrs = await ethers.utils.splitSignature(signature);
    // assert that the value is correct
    const getSigner = await verify.verifyMessage(
        originMsg,
        vrs.v,
        vrs.r,
        vrs.s
    );
    
    console.log({
        originMsg: originMsg,
        messageHashBytes: messageHashBytes,
        signature: signature,
        vrs: vrs,
        signer: signer.address,
        getSigner: getSigner
    });

    const encodeERC721ReplacementPatternSell = await verify.encodeERC721ReplacementPatternSell();
    const encodeERC721ReplacementPatternBuy = await verify.encodeERC721ReplacementPatternBuy();

    const encodeERC1155ReplacementPatternSell = await verify.encodeERC1155ReplacementPatternSell();
    const encodeERC1155ReplacementPatternBuy = await verify.encodeERC1155ReplacementPatternBuy();
    
    console.log({
        encodeERC721ReplacementPatternSell: encodeERC721ReplacementPatternSell,
        encodeERC721ReplacementPatternBuy: encodeERC721ReplacementPatternBuy,
        encodeERC1155ReplacementPatternSell: encodeERC1155ReplacementPatternSell, 
        encodeERC1155ReplacementPatternBuy: encodeERC1155ReplacementPatternBuy

    });
    
    expect(signer.address).to.equal(getSigner);
  
});
});