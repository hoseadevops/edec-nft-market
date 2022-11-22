async function main() {
    const [exchange, mocker, rock, hosea, yety, suky, tester, feeer, join, bob] = await ethers.getSigners();

    const from = exchange.address;

    let nonce = await ethers.provider.getTransactionCount(from)

    const contract = ethers.utils.getContractAddress({ from, nonce} );

    console.log(
        {
            from,
            nonce,
            contract
        }
    );


    const transactions = [
        {calldata: '0x', value: web3.utils.toWei('1'), address: '0x0084a81668b9a978416abeb88bc1572816cc7cac'},
        {calldata: '0x', value: web3.utils.toWei('1'), address: '0xa839D4b5A36265795EbA6894651a8aF3d0aE2e68'}
    ]
      
    const params = [
        transactions.map(t => t.address),
        transactions.map(t => t.value),
        transactions.map(t => (t.calldata.length - 2) / 2), // subtract 2 for '0x', divide by 2 for hex
        transactions.map(t => t.calldata).reduce((x, y) => x + y.slice(2)) // cut off the '0x'
    ]
      
      console.log(params)
}

main().then(() => process.exit(0)).catch((error) => {
    console.error("debug-error:" , error);
    process.exit(1);
});