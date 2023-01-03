// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract Merkle {

    bytes32 public merkleRoot;

    function launchpad(bytes32 _merkleRoot) public {
        merkleRoot = _merkleRoot;
    }

    function claim(string memory test,  bytes32[] calldata merkleProof) public view returns(bool) {
        bytes32 node = keccak256(abi.encodePacked(test));
        return (!MerkleProof.verify(merkleProof, merkleRoot, node));
    }
}