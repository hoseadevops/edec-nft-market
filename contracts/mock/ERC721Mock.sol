// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract ERC721Mock is ERC721, AccessControl {

  string public baseUri;

  bytes32 public constant WITHDRAW_ROLE = keccak256("WITHDRAW_ROLE");

  constructor(string memory _name, string memory _symbol, string memory _baseUri, address _withdraw) ERC721(_name, _symbol) {
      _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
      _setupRole(WITHDRAW_ROLE, _withdraw);
      _setupRole(WITHDRAW_ROLE, _msgSender());
      baseUri = _baseUri;
  }

  function setBaseURI(string memory _baseURIString) external onlyRole(DEFAULT_ADMIN_ROLE) {
      baseUri = _baseURIString;
  }
  
  function _baseURI() internal override view  returns (string memory) {
    return baseUri;
  }

  function mint(address _to, uint256 _tokenId) external onlyRole(WITHDRAW_ROLE) {
    _mint(_to, _tokenId);
  }

  function batchMint(address _to, uint256[] calldata _tokenIds) external onlyRole(WITHDRAW_ROLE) {
    for (uint256 index = 0; index < _tokenIds.length; index++) {        
      _mint(_to, _tokenIds[index]);
    }
  }

  function burn(uint256 _tokenId) external onlyRole(WITHDRAW_ROLE) {
    _burn(_tokenId);
  }
  
  function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
    return super.supportsInterface(interfaceId);
  }
}