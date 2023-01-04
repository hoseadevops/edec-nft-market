const { deploy } = require('./library.js');

async function main() {
    const [exchangeOwner, mocker] = await ethers.getSigners();
    console.log("-----------------------------------------------------------");
    console.log("Deploying contracts with the account:", exchangeOwner.address, mocker.address);
    console.log("-----------------------------------------------------------\n");
    const mdObj = await deploy(exchangeOwner, "MerkleDistributor", "", exchangeOwner.address, exchangeOwner.address);
    await deploy(mocker, "Deposit", "", exchangeOwner.address, mdObj.address);

    await deploy(mocker, "ERC721Mock", "art", "ERC721 Mock art", "ART721", "ipfs://", mdObj.address);
    await deploy(mocker, "ERC1155Mock", "art", "ipfs://", mdObj.address);
    await deploy(mocker, "ERC20Mock", "FEE", "ERC20 Mock Fee", "FEE");
    
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("debug-error:" , error);
      process.exit(1);
    });