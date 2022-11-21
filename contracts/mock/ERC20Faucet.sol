// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ERC20Faucet is ERC20 {

    constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) {
        _mint(address(this), 1000000000000000 * 10 ** 18);
    }

    function faucet() public {
        IERC20(address(this)).transfer(msg.sender, 10000000 * 10 ** 18);
    }

}