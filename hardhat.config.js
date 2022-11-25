/** @type import('hardhat/config').HardhatUserConfig */
require("@nomicfoundation/hardhat-toolbox");

require("@nomiclabs/hardhat-web3");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require('hardhat-docgen');
require("xdeployer");

require("dotenv").config();
const { ALCHEMY_API_KEY, GOERLI_PRIVATE_KEY1,GOERLI_PRIVATE_KEY2, ETHERSCAN_API_KEY, BSCSCAN_API_KEY } = process.env;

module.exports = {
    docgen: {
        path: './documents',
        clear: true,
        runOnCompile: true,
    },      
    solidity: {
        compilers: [
            {
                version: "0.4.19",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: "0.4.26",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: "0.8.17",
                settings: {
                    viaIR: true,
                    optimizer: {
                        enabled: true,
                        runs: 1000000,
                    },
                },
            },
        ],
    },
    networks: {
        hardhat: {
            allowUnlimitedContractSize: true
        },
        localhost : {
            allowUnlimitedContractSize: true,
            gas: 30000000
        },
        goerli: {
          url: `https://eth-goerli.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
          accounts: [GOERLI_PRIVATE_KEY1, GOERLI_PRIVATE_KEY2],
          gasMultiplier: 1.3,
        },
        bsctest: {
            url: `https://data-seed-prebsc-1-s1.binance.org:8545`,
            accounts: [GOERLI_PRIVATE_KEY1],
            chainId: 97,
        },
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
        // apiKey: BSCSCAN_API_KEY
    }
};
