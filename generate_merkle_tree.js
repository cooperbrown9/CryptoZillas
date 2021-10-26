const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const ethers = require('ethers');
const fs = require('fs');

function getMapping() {
    const mapping = JSON.parse(fs.readFileSync("mapping.json"));
    console.log(mapping);
    console.log(mapping.length);
    return mapping;
}

function getKeccak(mapping) {
    // return ethers.utils.keccak256([ 0x12, 0x34 ]);
    return mapping.map(obj => {
        // let oldHex = "0x" + parseInt(obj.openseaTokenId).toString(16);
        // let newHex = "0x" + parseInt(obj.tokenId).toString(16);
        // let oldHex = parseInt(obj.openseaTokenId);
        // let newHex = parseInt(obj.tokenId);
        // let pack = ethers.utils.solidityPack(["uint256", "uint256"], [obj.openseaTokenId, obj.tokenId])
        // let arr = [oldHex, newHex];
        // console.log(obj);
        return ethers.utils.solidityKeccak256(["uint256", "uint256"], [obj.openseaTokenId, obj.tokenId]);
    });
}



function hashToken(tokenId, account) {
    return Buffer.from(ethers.utils.solidityKeccak256(
        ['uint256', 'address'],
        [tokenId, account],
    ).slice(2), 'hex');
}

// const tokens = {
//     '056665177': '0x1234'
// };
// const leaf = Object.entries(tokens).map(token => hashToken(...token));
// const merkleTree = new MerkleTree(leaf, keccak256, { sortPairs: true });
// const proof = merkleTree.getHexProof(hashToken(...Object.entries(tokens)[0]));

// console.log(leaf);
// console.log(merkleTree);
// console.log(proof);

let mapping = getMapping();
let leaves = getKeccak(mapping);

const merkleTree = new MerkleTree(leaves, keccak256, { hashLeaves: false, sortPairs: true });
// const root = merkleTree
console.log(keccak);