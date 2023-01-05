// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.8.17;

import {MerkleDistributor} from "./MerkleDistributor.sol";

error EndTimeInPast();
error ClaimWindowFinished();

contract MerkleDistributorWithDeadline is MerkleDistributor {

    uint256 public immutable endTime;

    constructor(address root, address creator, uint256 _endTime) MerkleDistributor(root, creator) {
        if (_endTime <= block.timestamp) revert EndTimeInPast();
        endTime = _endTime;
    }

    function claim(uint256 roundID, uint256 index, bytes calldata calldataABI, bytes32[] calldata merkleProof) public override payable {
        if (block.timestamp > endTime) revert ClaimWindowFinished();
        super.claim(roundID, index, calldataABI, merkleProof);
    }
}
