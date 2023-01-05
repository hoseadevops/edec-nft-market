// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract Merkle {
    
    using Address for address;
    bytes32 public merkleRoot;

    function launchpad(bytes32 _merkleRoot) public {
        merkleRoot = _merkleRoot;
    }

    function claim(address target, uint256 roundID, uint256 index, bytes calldata calldataABI, bytes32[] calldata merkleProof) public {
        // Verify the merkle proof.
        bytes32 node = keccak256(abi.encodePacked(roundID, index, calldataABI));
        require(MerkleProof.verify(merkleProof, merkleRoot, node), "Invalid Proof");

        target.functionCall(calldataABI, "call function fail.");
    }
}