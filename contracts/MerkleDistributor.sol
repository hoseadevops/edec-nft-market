// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/structs/BitMaps.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

error AlreadyClaimed();
error InvalidProof();

contract MerkleDistributor is AccessControl {
    
    using SafeERC20 for IERC20;
    using BitMaps for BitMaps.BitMap;
    using Address for address;
    
    bytes32 public constant CREATE_ROLE = keccak256("CREATE_ROLE");

    event Claimed(uint256 roundID, uint256 index);

    struct Project {
        address target;                 // nft token or deposit
        address payable receipt;        // receive payment
        bytes32 merkleRoot;             // merkle root
        BitMaps.BitMap bitmap;          // distribute status for index
        address payment;                // ETH or ERC20
        uint256 price;                  // nft price
    }

    // roundID => Project
    mapping(uint256 => Project) private round;

    constructor(address root, address creator) {
        _setupRole(DEFAULT_ADMIN_ROLE, root);
        _grantRole(CREATE_ROLE, creator);
    }

    // Repeatable Setting
    function launchpad( uint256 _roundID, address _target, bytes32 _merkleRoot, address payable _receipt, address _payment, uint256 _price) public onlyRole(CREATE_ROLE) {
        Project storage project = round[_roundID];
        project.merkleRoot = _merkleRoot;
        project.target = _target;
        project.receipt = _receipt;
        project.payment = _payment;
        project.price = _price;
    }

    // anyone can pay
    function claim(uint256 roundID, uint256 index, bytes calldata calldataABI, bytes32[] calldata merkleProof) public payable {
        Project storage project = round[roundID];
        
        // Verify claim
        if (project.bitmap.get(index)) revert AlreadyClaimed();

        // Verify the merkle proof.
        bytes32 node = keccak256(abi.encodePacked(roundID, index, calldataABI));
        if (!MerkleProof.verify(merkleProof, project.merkleRoot, node)) revert InvalidProof();
        
        // Mark it claimed
        project.bitmap.set(index);

        // Receipt token && Refund token
        if( project.payment == address(0) ) {
            require(msg.value >= project.price, 'You have to pay enough eth.');
            uint256 refund = msg.value - project.price;
            if(refund > 0) payable(msg.sender).transfer(refund);
            project.receipt.transfer(project.price);
        }else{
            require(msg.value == 0, "You don't need to pay eth");
            IERC20(project.payment).safeTransferFrom(msg.sender, project.receipt, project.price);
        }

        // Mint token or transfer token
        project.target.functionCall(calldataABI, "call function fail.");
        emit Claimed(roundID, index);
    }
    
    // Returns the address of the token distributed by this round.
    function token(uint256 roundID) external view returns (address) {
        Project storage project = round[roundID];
        return project.target;
    }

    // Returns the merkle root of the merkle tree containing account balances available to claim by this round.
    function merkleRoot(uint256 roundID) external view returns (bytes32) {
        Project storage project = round[roundID];
        return project.merkleRoot;
    }

    // Returns true if the index has been marked claimed by this round.
    function isClaimed(uint256 roundID, uint256 index) external view returns (bool) {
        Project storage project = round[roundID];
        return project.bitmap.get(index);
    }
}