// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ERC1155Faucet is ERC1155 {
    
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIds;

    uint256 public constant count = 10;

    uint256 public maxTokenId = 0;

    constructor() ERC1155("") {}

    function faucet(uint256[] calldata amounts) public returns( uint256, uint256 ) {
        
        require(amounts.length == count, 'length must 10');

        uint tokenId = _tokenIds.current();
        uint first = tokenId; 
        maxTokenId = tokenId + count - 1;
        uint index = 0;
        while( tokenId <= maxTokenId) {
            _mint(msg.sender, tokenId, amounts[index], '');
            _tokenIds.increment();
            tokenId = _tokenIds.current();
            index++;
        }

        return (first, maxTokenId);
    }
}