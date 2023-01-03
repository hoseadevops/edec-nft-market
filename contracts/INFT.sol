// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

interface IERC721 {
    function batchMint(address to, uint256[] calldata ids) external;
}

interface IER1155 {
    function batchMint(address to, uint256[] calldata ids, uint256[] calldata amounts, bytes calldata data) external;
}

interface IDEPOSIT {
    function batchWithdrawERC721(address nft, address to, uint256[] calldata ids) external;
}