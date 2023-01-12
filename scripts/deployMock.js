const { deploy } = require('./library.js');

async function main() {
    
    const [_, mocker] = await ethers.getSigners();
    console.log("-----------------------------------------------------------");
    console.log("Deploying contracts with the account:", mocker.address);
    console.log("-----------------------------------------------------------\n");

    await deploy(mocker, "ERC20Mock", "FEE", "ERC20 Mock Fee", "FEE");
    await deploy(mocker, "ERC20Mock", "UNI", "ERC20 Mock uniswap", "UNI");
    await deploy(mocker, "ERC20Mock", "HT", "ERC20 Mock huobi", "HT");
    await deploy(mocker, "ERC20Mock", "BTC", "ERC20 Mock bitcoin", "BTC");
    await deploy(mocker, "ERC20Mock", "USDT", "ERC20 Mock USDT", "USDT");

    await deploy(mocker, "ERC721Mock", "art", "ERC721 Mock art", "ART721", "ipfs://", mocker.address);
    await deploy(mocker, "ERC721Mock", "vr", "ERC721 Mock vr", "VR721", "ipfs://", mocker.address);
    await deploy(mocker, "ERC721Mock", "game", "ERC721 Mock game", "GAME721", "ipfs://", mocker.address);

    await deploy(mocker, "ERC1155Mock", "art", "ipfs://", mocker.address);
    await deploy(mocker, "ERC1155Mock", "vr", "ipfs://", mocker.address);
    await deploy(mocker, "ERC1155Mock", "game", "ipfs://", mocker.address);
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("debug-error:" , error);
      process.exit(1);
    });