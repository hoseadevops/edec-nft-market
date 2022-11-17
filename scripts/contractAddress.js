async function main() {
    const [exchange, mocker, rock, hosea, yety, suky, tester, feeer, join, bob] = await ethers.getSigners();

    const from = exchange.address;

    let nonce = await ethers.provider.getTransactionCount(from)

    nonce +=1;

    const contract = ethers.utils.getContractAddress({ from, nonce} );

    console.log(
        {
            from,
            nonce,
            contract
        }
    );
}

main().then(() => process.exit(0)).catch((error) => {
    console.error("debug-error:" , error);
    process.exit(1);
});