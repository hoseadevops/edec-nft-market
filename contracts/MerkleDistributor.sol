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
        address token;
        address payable receipt;
        bytes32 merkleRoot;
        BitMaps.BitMap bitmap;
        address payment;
        uint256 price;
    }

    // roundID => Project
    mapping(uint256 => Project) private round;

    constructor(address root, address creator) {
        _setupRole(DEFAULT_ADMIN_ROLE, root);
        _grantRole(CREATE_ROLE, creator);
    }

    function create( uint256 _roundID, address _token, bytes32 _merkleRoot, address payable _receipt, address _payment, uint256 _price) public onlyRole(CREATE_ROLE) {
        Project storage project = round[_roundID];
        project.merkleRoot = _merkleRoot;
        project.token = _token;
        project.receipt = _receipt;
        project.payment = _payment;
        project.price = _price;
    }

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
            require(msg.value >= project.price, 'You have to pay enough money.');
            uint256 refund = msg.value -  project.price;
            if(refund > 0) payable(msg.sender).transfer(refund);
            project.receipt.transfer(project.price);
        }else{
            require(msg.value == 0, 'You do not pay ERC20 money.');
            IERC20(project.payment).safeTransferFrom(msg.sender, project.receipt, project.price);
        }

        // Mint token or transfer token
        project.token.functionCall(calldataABI);
        emit Claimed(roundID, index);
    }
}