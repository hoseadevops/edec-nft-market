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
        address target;                 // nft or deposit or any contract
        address payable receipt;        // receive payment 
        bytes32 merkleRoot;             // merkle root
        BitMaps.BitMap bitmap;          // distribute status for index(bit)
        address payment;                // ETH or ERC20
        uint256 price;                  // nft price
        uint256 startTime;              // start
        uint256 endTime;                // end
    }

    // roundID => Project
    mapping(uint256 => Project) private round;

    constructor(address root, address creator) {
        _setupRole(DEFAULT_ADMIN_ROLE, root);
        _grantRole(CREATE_ROLE, creator);
    }

    // Repeatable Setting
    function launchpad( uint256 _roundID, address _target, bytes32 _merkleRoot, address payable _receipt, address _payment, uint256 _price, uint256 _startTime, uint256 _endTime) public onlyRole(CREATE_ROLE) {
        
        require(_endTime > block.timestamp, "End time is past");

        Project storage project = round[_roundID];
        project.merkleRoot = _merkleRoot;
        project.target = _target;
        project.receipt = _receipt;
        project.payment = _payment;
        project.price = _price;
        project.startTime = _startTime;
        project.endTime = _endTime;
    }

    // anyone can pay
    function claim(uint256 roundID, uint256 index, bytes calldata calldataABI, bytes32[] calldata merkleProof) public payable {
        
        Project storage project = round[roundID];
        
        // Verify time
        require(project.startTime <= block.timestamp, "Hasn't started");
        require(project.endTime >= block.timestamp, "It's all over");

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
        } else {
            require(msg.value == 0, "You don't need to pay eth");
            IERC20(project.payment).safeTransferFrom(msg.sender, project.receipt, project.price);
        }

        // execute
        project.target.functionCall(calldataABI, "Call function fail.");
        emit Claimed(roundID, index);
    }
    
    // Returns project details by this round.
    function getProject(uint256 roundID) external view returns (address,address, bytes32, address, uint256, uint256, uint256) {
        Project storage project = round[roundID];
        return (project.target, project.receipt, project.merkleRoot, project.payment, project.price, project.startTime, project.endTime);
    }

    // Returns true if the index has been marked claimed by this round.
    function isClaimed(uint256 roundID, uint256 index) external view returns (bool) {
        Project storage project = round[roundID];
        return project.bitmap.get(index);
    }
}