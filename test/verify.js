const { expect } = require("chai");
const { ethers } = require("hardhat");

function toEthSignedMessageHash (messageHex) {
    const messageBuffer = Buffer.from(messageHex.substring(2), 'hex');
    const prefix = Buffer.from(`\u0019Ethereum Signed Message:\n${messageBuffer.length}`);
    return web3.utils.sha3(Buffer.concat([prefix, messageBuffer]));
}

describe("Verify", function () {
    
    it("Check signature", async function () {
   
        const accounts = await ethers.getSigners()
    
        signer = accounts[2];

        const Verify = await ethers.getContractFactory("Verify");
        const verify = await Verify.deploy();
        await verify.deployed()

        const TEST_MESSAGE = "0x3d0eda954fcafd6acca3dae8d41fab5f2a14268cb5d33523be32fad23d9b106d";

        messageHashBytes = ethers.utils.arrayify(TEST_MESSAGE);
        
        signature = await signer.signMessage(messageHashBytes)

        vrs = await ethers.utils.splitSignature(signature);
        
        // assert that the value is correct
        const getSigner = await verify.verifyMessage191(
            TEST_MESSAGE,
            vrs.v,
            vrs.r,
            vrs.s
        );
    
        console.log({
            TEST_MESSAGE: TEST_MESSAGE,
            messageHashBytes: messageHashBytes,
            signature: signature,
            vrs: vrs,
            signer: signer.address,
            getSigner: getSigner
        });

        expect(signer.address).to.equal(getSigner);

        // test teplacement pattern
        const encodeERC721ReplacementPatternSell = await verify.encodeERC721ReplacementPatternSell();
        const encodeERC721ReplacementPatternBuy = await verify.encodeERC721ReplacementPatternBuy();
        const encodeERC721OfferReplacementPatternBuy = await verify.encodeERC721OfferReplacementPatternBuy();

        const encodeERC1155ReplacementPatternSell = await verify.encodeERC1155ReplacementPatternSell();
        const encodeERC1155ReplacementPatternBuy = await verify.encodeERC1155ReplacementPatternBuy();
        const encodeERC1155OfferReplacementPatternBuy = await verify.encodeERC1155OfferReplacementPatternBuy();

        console.log({
            encodeERC721ReplacementPatternSell,
            encodeERC721ReplacementPatternBuy,
            encodeERC1155ReplacementPatternSell,
            encodeERC1155ReplacementPatternBuy,
            encodeERC721OfferReplacementPatternBuy,
            encodeERC1155OfferReplacementPatternBuy
        });
        
        // 712 + 1272
        expect(await verify.verifyMessage712_1271(
            signer.address,
            toEthSignedMessageHash(TEST_MESSAGE),
            signature
        )).to.equal(true);

        // 

        const domainSeparator = await verify.deriveDomainSeparator(signer.address);

        console.log(
            {
                domainSeparator
            }
        );
        

    });
});