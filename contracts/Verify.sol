// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";

contract Verify {

    using SignatureChecker for address;

    string public constant name = "Core Sky Exchange Contract";
    string public constant version = "1.0";

    // NOTE: these hashes are derived and verified in the constructor.
    bytes32 private constant _EIP_712_DOMAIN_TYPEHASH = 0x8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f;
    bytes32 private constant _NAME_HASH = 0x240721be4dc054d34213adcc557aff0c01d2ce39ebc5b40065e0890de2509142;
    bytes32 private constant _VERSION_HASH = 0xe6bbd6277e1bf288eed5e8d1780f9a50b239e86b153736bceebccf4ea79d90b3;
    bytes32 private constant _ORDER_TYPEHASH = 0xdba08a88a748f356e8faf8578488343eab21b1741728779c9dcfdc782bc800f8;

    bytes4 private constant _EIP_1271_MAGIC_VALUE = 0x1626ba7e;

    // NOTE: chainId opcode is not supported in solidiy 0.4.x; here we hardcode as 1.
    // In order to protect against orders that are replayable across forked chains,
    // either the solidity version needs to be bumped up or it needs to be retrieved
    // from another contract.
    uint256 private constant _CHAIN_ID = 1;

    // Note: the domain separator is derived and verified in the constructor. */
    bytes32 public constant DOMAIN_SEPARATOR = 0x72982d92449bfb3d338412ce4738761aff47fb975ceb17a1bc3712ec716a5a68;

    bytes internal constant EMPTY_BYTES = bytes("");

    address internal constant NULL_ADDRESS = 0x0000000000000000000000000000000000000000;

    constructor () {
        require(keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)") == _EIP_712_DOMAIN_TYPEHASH);
        require(keccak256(bytes(name)) == _NAME_HASH);
        require(keccak256(bytes(version)) == _VERSION_HASH);
        require(keccak256("Order(address exchange,address maker,address taker,uint256 makerRelayerFee,uint256 takerRelayerFee,uint256 makerProtocolFee,uint256 takerProtocolFee,address feeRecipient,uint8 feeMethod,uint8 side,uint8 saleKind,address target,uint8 howToCall,bytes calldata,bytes replacementPattern,address staticTarget,bytes staticExtradata,address paymentToken,uint256 basePrice,uint256 extra,uint256 listingTime,uint256 expirationTime,uint256 salt,uint256 nonce)") == _ORDER_TYPEHASH);
    }

    function deriveDomainSeparator(address market) public pure returns (bytes32) {
        return keccak256(
            abi.encode(
                _EIP_712_DOMAIN_TYPEHASH, // keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")
                _NAME_HASH, // keccak256("Wyvern Exchange Contract")
                _VERSION_HASH, // keccak256(bytes("2.3"))
                _CHAIN_ID, // NOTE: this is fixed, need to use solidity 0.5+ or make external call to support!
                market
            )
        );
    }
    
    // eip-191
    function verifyMessage191(bytes32 message, uint8 _v, bytes32 _r, bytes32 _s) public pure returns (address) {
        message = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", message));
        address signer = ecrecover(message, _v, _r, _s);
        return signer;
    }

    // eip-712 && eip-1271
    function verifyMessage712_1271(address signer, bytes32 hash, bytes memory signature) public view returns (bool) {
        return signer.isValidSignatureNow(hash, signature);
    }

    // abi
    function encodeERC721TransferFrom(address maker, address taker, uint256 identifier) public pure returns (bytes memory) {
        return
            abi.encodeWithSelector(
                IERC721.transferFrom.selector,
                maker,
                taker,
                identifier
            );
    }

    function encodeERC721ReplacementPatternSell() public pure returns (bytes memory) {
        return
            abi.encodeWithSelector(
                bytes4(0x00000000),
                0x0000000000000000000000000000000000000000000000000000000000000000,
                0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff,
                0x0000000000000000000000000000000000000000000000000000000000000000
            );
    }

    function encodeERC721ReplacementPatternBuy() public pure returns (bytes memory) {
        return
            abi.encodeWithSelector(
                bytes4(0x00000000),
                0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff,
                0x0000000000000000000000000000000000000000000000000000000000000000,
                0x0000000000000000000000000000000000000000000000000000000000000000
            );
    }
    // function safeTransferFrom(address _from, address _to, uint256 _id, uint256 _value, bytes calldata _data)
    function encodeERC1155SafeTransferFrom( address maker, address taker, uint256 identifier, uint256 amount) public pure returns (bytes memory) {
        return
            abi.encodeWithSelector(
                IERC1155.safeTransferFrom.selector,
                maker,
                taker,
                identifier,
                amount,
                EMPTY_BYTES
            );
    }

    function encodeERC1155ReplacementPatternSell() public pure returns (bytes memory) {
        bytes memory rawBytes = abi.encodeWithSelector(
            IERC1155.safeTransferFrom.selector,
            NULL_ADDRESS,
            0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff,
            0,
            0,
            EMPTY_BYTES
        );
        rawBytes[0] = 0;
        rawBytes[1] = 0;
        rawBytes[2] = 0;
        rawBytes[3] = 0;
        rawBytes[163] = 0;

        return rawBytes;
    }

    function encodeERC1155ReplacementPatternBuy() public pure returns (bytes memory) {
        bytes memory rawBytes = abi.encodeWithSelector(
            IERC1155.safeTransferFrom.selector,
            0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff,
            NULL_ADDRESS,
            0,
            0,
            EMPTY_BYTES
        );
        rawBytes[0] = 0;
        rawBytes[1] = 0;
        rawBytes[2] = 0;
        rawBytes[3] = 0;
        rawBytes[163] = 0;

        return rawBytes;
    }

}