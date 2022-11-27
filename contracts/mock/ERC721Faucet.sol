// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ERC721Faucet is ERC721 {
    
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIds;

    uint256 public constant count = 20;

    uint256 public maxTokenId = 0;

    constructor() ERC721("EF721", "EF") {}

    function faucet() public returns( uint256, uint256 ) {
        uint tokenId = _tokenIds.current();
        uint first = tokenId; 
        maxTokenId = tokenId + count - 1;
        while( tokenId <= maxTokenId ) {
            _mint(msg.sender, tokenId);
            _tokenIds.increment();
            tokenId = _tokenIds.current();
        }
        return (first, maxTokenId);
    }
}