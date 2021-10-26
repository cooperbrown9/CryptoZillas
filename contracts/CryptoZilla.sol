// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

interface IERC20 {
  function currentSupply() external view returns (uint);
  function balanceOf(address tokenOwner) external view returns (uint balance);
  function allowance(address tokenOwner, address spender) external view returns (uint remaining);
  function transfer(address to, uint tokens) external returns (bool success);
  function approve(address spender, uint tokens) external returns (bool success);
  function transferFrom(address from, address to, uint tokens) external returns (bool success);

  event Transfer(address indexed from, address indexed to, uint tokens);
  event Approval(address indexed tokenOwner, address indexed spender, uint tokens);
}

interface Opensea {
    function balanceOf(address tokenOwner, uint tokenId) external view returns (bool);

    function safeTransferFrom(address _from, address _to, uint _id, uint _value, bytes memory _data) external;
}

contract CryptoZilla is ERC721, Ownable {

    event Mint(address indexed _to, uint indexed _tokenId);

    bytes32 public merkleRoot = ""; // Construct this from (oldId, newId) tuple elements
    address public openseaSharedAddress = 0x495f947276749Ce646f68AC8c248420045cb7b5e;
    address public burnAddress = 0x000000000000000000000000000000000000dEaD;
    uint public maxSupply = 1000; // Maximum tokens that can be minted
    uint public totalSupply = 0; // This is our mint counter as well
    string public _baseTokenURI;

    // Royalty variables below
    uint public spoofInitBalance = 1 ether;
    uint constant public PRECISION = 1000000; // million
    uint public curMul = 1 * PRECISION;
    mapping(uint => uint) public tokenMultipliers; // Maps token id to last withdrawal multiplier


    constructor() payable ERC721("CryptoZilla", "ZILLA") {}

    receive() external payable {
        curMul += (msg.value * PRECISION) / (spoofInitBalance * totalSupply); // This could round down to 0 if not careful; only greater if msg.value > 0.001 eth
    }

    function claimMultipleRewards(uint[] memory tokenIds) public {
        for (uint i = 0; i < tokenIds.length; i++) {
            claimRewards(tokenIds[i]);
        }
    }

    function claimRewards(uint tokenId) public {
        address tokenOwner = ownerOf(tokenId);
        // require(tokenOwner == msg.sender, "Only tokenholder can claim rewards");

        uint weiReward = (curMul - tokenMultipliers[tokenId]) * spoofInitBalance / PRECISION;
        tokenMultipliers[tokenId] = curMul;

        (bool success,) = tokenOwner.call{value: weiReward}("");
        require(success, "Failed to send ether");
    }


    function mintAndBurn(uint256 oldId, uint256 newId, bytes32 leaf, bytes32[] memory proof) external {
        // Don't allow reminting
        require(!_exists(newId), "Token already minted");

        // Verify that (oldId, newId) correspond to the Merkle leaf
        require(keccak256(abi.encodePacked(oldId, newId)) == leaf, "Ids don't match Merkle leaf");

        // Verify that (oldId, newId) is a valid pair in the Merkle tree
        require(verify(merkleRoot, leaf, proof), "Not a valid element in the Merkle tree");

        // Verify that msg.sender is the owner of the old token
        require(Opensea(openseaSharedAddress).balanceOf(msg.sender, oldId), "Only token owner can mintAndBurn"); // Error coming here

        // Transfer the old OpenSea Shared Storefront token to this contract (with ability for owner to retrieve in case of error)
        Opensea(openseaSharedAddress).safeTransferFrom(msg.sender, burnAddress, oldId, 1, "");

        // Mint new token
        _mint(msg.sender, newId);
        emit Mint(msg.sender, newId);
        totalSupply += 1;

        // Initialize the rewards multiplier
        tokenMultipliers[newId] = curMul;
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) public returns (bytes4) {
        return 0xf0b9e5ba;
    }

    function verify(bytes32 root, bytes32 leaf, bytes32[] memory proof) public pure returns (bool) {
        return MerkleProof.verify(proof, root, leaf);
    }

    /**
     * @dev Returns a URI for a given token ID's metadata
     */
    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        return string(abi.encodePacked(_baseTokenURI, Strings.toString(_tokenId)));
    }

    /**
     * @dev Updates the base token URI for the metadata
     */
    function setBaseTokenURI(string memory __baseTokenURI) public onlyOwner {
        _baseTokenURI = __baseTokenURI;
    }

    function setMerkleRoot(bytes32 _merkleRoot) public onlyOwner {
        merkleRoot = _merkleRoot;
    }
}