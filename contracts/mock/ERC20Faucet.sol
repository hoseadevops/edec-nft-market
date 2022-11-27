// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Faucet is ERC20 {

    constructor() ERC20("EF20", "EF") {}

    function faucet() public {
        _mint(msg.sender, 100000000 * 10 ** 18);
    }
}