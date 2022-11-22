async function main() {

    const from = "0x3A3455DF56DF22d3197aC06E843857DE9adC106d";

    let nonce = await ethers.provider.getTransactionCount(from)
    console.log(
        {
            from,
            nonce
        }
    );
}

// npx hardhat run scripts/nonce.js --network goerli
main().then(() => process.exit(0)).catch((error) => {
    console.error("debug-error:" , error);
    process.exit(1);
});