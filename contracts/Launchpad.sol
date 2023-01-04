// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/structs/BitMaps.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import { IERC721, IERC1155, IDEPOSIT } from "./INFT.sol";

error AlreadyClaimed();
error InvalidProof();

contract Launchpad is AccessControl {
    
    using SafeERC20 for IERC20;
    using BitMaps for BitMaps.BitMap;
    using Address for address;
    using EnumerableMap for EnumerableMap.UintToUintMap;

    uint256 public constant PAGE = 20;

    bytes32 public constant CREATE_ROLE = keccak256("CREATE_ROLE");

    enum Kinds {
        ERC721,
        ERC1155,
        DEPOSIT
    }

    event Claimed(uint256 roundID, uint256 index);

    struct Project {
        address token;                               // nft token
        address payable receipt;                     // receive payment
        bytes32 merkleRoot;                          // merkle root
        BitMaps.BitMap bitmap;                       // distribute status for award index
        address payment;                             // ETH or ERC20
        uint256 price;                               // nft price
        EnumerableMap.UintToUintMap idAmountMap;     // nft map( id => amount )
        Kinds kind;
    }

    // roundID => Project
    mapping(uint256 => Project) private round;

    constructor(address root, address creator) {
        _setupRole(DEFAULT_ADMIN_ROLE, root);
        _grantRole(CREATE_ROLE, creator);
    }

    // Repeatable Setting
    function launchpadProject( uint256 _roundID, address _token, bytes32 _merkleRoot, address payable _receipt, address _payment, uint256 _price, Kinds _kind) public onlyRole(CREATE_ROLE) {
        Project storage project = round[_roundID];
        project.merkleRoot = _merkleRoot;
        project.token = _token;
        project.receipt = _receipt;
        project.payment = _payment;
        project.price = _price;
        project.kind = _kind; 
    }
    
    // Repeatable Setting
    function launchpadNFT(uint256 _roundID, uint256[] calldata ids, uint256[] calldata amounts) public onlyRole(CREATE_ROLE) {
        Project storage project = round[_roundID];
        
        require(ids.length  == amounts.length, "Length must eq.");

        for(uint256 i= 0; i < ids.length; i++ ){
            project.idAmountMap.set(ids[i], amounts[i]);
        }
    }

    // anyone can pay
    function claim(uint256 roundID, uint256 index, address to, uint256 nonce, bytes32[] calldata merkleProof) public payable {
        Project storage project = round[roundID];
        
        require(nonce > 0 && nonce <= PAGE, "nonce must less than page");

        uint256 awardNumber = project.idAmountMap.length();
        require(awardNumber > 0, "sell out");

        // Verify claim
        if (project.bitmap.get(index)) revert AlreadyClaimed();

        // Verify the merkle proof.
        bytes32 node = keccak256(abi.encodePacked(roundID, index, to, nonce));
        if (!MerkleProof.verify(merkleProof, project.merkleRoot, node)) revert InvalidProof();

        project.bitmap.set(index);

        // Receipt token && Refund token
        if( project.payment == address(0) ) {
            require(msg.value >= project.price, 'You have to pay enough money.');
            uint256 refund = msg.value - project.price;
            if(refund > 0) payable(msg.sender).transfer(refund);
            project.receipt.transfer(project.price);
        }else{
            require(msg.value == 0, 'You do not pay ERC20 money.');
            IERC20(project.payment).safeTransferFrom(msg.sender, project.receipt, project.price);
        }

        // get getAward

        // construct abi
        bytes memory calldataABI = bytes("");

        // if( project.kind == Kinds.ERC721 )
        //     calldataABI = abi.encodeWithSelector(
        //         IERC721.batchMint.selector,
        //         to,
        //         ,
        //         identifier
        //     ); 
        // }
        // require(calldataABI, "calldata error.");

        // Mint token or transfer token
        project.token.functionCall(calldataABI);
        emit Claimed(roundID, index);
    }

    // function getAwards(uint256 roundID, uint256 nonce) public view returns(uint256[] ids, uint256[] amounts) {
    //     Project storage project = round[roundID];

    //     uint256 awardNumber = project.idAmountMap.length();
    //     require(awardNumber > 0, "sell out");

    //     for( uint256 i = 0; i < nonce; i++ ) {
    //         uint256 id, uint256 amount = project.idAmountMap.at(random);
    //         ids.push(id);
    //         amounts.push(amount);
    //     }

    //     return (ids, amounts);   
    // }

    function getRandom(uint256 count) public view returns(uint256) {

    }

    // unsafeRandom
    // Between min and max:
    // randomness % (max - min + 1) + min
    // Between 1 and max:
    // randomness % max + 1
    // Where randomness is uint obtained from Chainlink VRF or from any other source
    function unsafeRandom(uint min, uint max) public view returns (uint rand) {
        rand = uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, block.number))) % (max-min);
        rand = rand + min;
        return rand;
    }

    // Returns the address of the token distributed by this round.
    function token(uint256 roundID) external view returns (address) {
        Project storage project = round[roundID];
        return project.token;
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