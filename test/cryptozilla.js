const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const ethers = require("ethers");
const fs = require("fs");
// const { default: Web3 } = require("web3");

const { expect } = require("chai");

// const MerkleProofWrapper = artifacts.require('MerkleProofWrapper');
const CryptoZilla = artifacts.require("CryptoZilla");
// const FeeSplitter = artifacts.require("FeeSplitter");

function getMapping() {
  const mapping = JSON.parse(fs.readFileSync("zilla-mapping.json"));
  // console.log(mapping);
  // console.log(mapping.length);
  return mapping;
}

function getKeccak(mapping) {
  return mapping.map((obj) => {
    return ethers.utils.solidityKeccak256(["uint256", "uint256"], [obj.old_token_id, obj.new_id]);
    // return ethers.utils.solidityKeccak256(["uint256", "uint256"], [obj.openseaTokenId, obj.tokenId]);
  });
}

const openseaAddress = "0x495f947276749Ce646f68AC8c248420045cb7b5e";
const openseaAbi = JSON.parse(fs.readFileSync("./opensea_abi.json"));
const opensea = new web3.eth.Contract(openseaAbi, openseaAddress);

const OSWallet = "0x5b3256965e7C3cF26E11FCAf296DfC8807C01073";
const zillaOwnerOG = "0x64cc91db1d20f333d74fd636a9ff35e660f74e79";
const zillaOwner0 = "0x6a1b6E54AB2A64C2d45C175a965d988c55D1969B";
const zillaOwner1 = "0x7E77e3d8Ab38356cAdF2f341c08c2A32d04278E7";
const zillaOwnerUnlocked = "0x0f706d69703c016dca25a81f204e64cedc5a5557";
const zillaOwnerUnlocked2 = "0xaaec50053dd89fd272b63c701199c5ffacb5c335";
// const boredPunkOwner0 = "0xf8e08FA48cAe4C0187d84D5F5Cb061045dd6af82";
// const boredPunkOwner1 = "0xFbC61be3798AC4043eAA31F6224B9A46E8C93E20";

contract("CryptoZilla", function (accounts) {
  // console.log(opensea)
  beforeEach(async function () {
    // this.zilla = await MerkleProofWrapper.new();
    this.zilla = await CryptoZilla.deployed();
    // this.feeSplitter = await FeeSplitter.deployed();
  });

  describe("verify", function () {
    it("returns true for a valid Merkle proof", async function () {
      const mapping = getMapping();
      const elements = getKeccak(mapping);
      const merkleTree = new MerkleTree(elements, keccak256, { hashLeaves: false, sortPairs: true });
      const root = merkleTree.getHexRoot();

      const leaf = elements[0];
      const proof = merkleTree.getHexProof(leaf);
      expect(await this.zilla.verify(root, leaf, proof)).to.equal(true);
    });

    it("returns false for an invalid Merkle proof", async function () {
      const correctElements = ["a", "b", "c"];
      const correctMerkleTree = new MerkleTree(correctElements, keccak256, { hashLeaves: true, sortPairs: true });

      const correctRoot = correctMerkleTree.getHexRoot();

      const correctLeaf = keccak256(correctElements[0]);

      const badElements = ["d", "e", "f"];
      const badMerkleTree = new MerkleTree(badElements);

      const badProof = badMerkleTree.getHexProof(badElements[0], keccak256, { hashLeaves: true, sortPairs: true });

      expect(await this.zilla.verify(correctRoot, correctLeaf, badProof)).to.equal(false);
    });

    it("enables minting a cryptozilla and claiming royalties with a single user", async function () {
      const mapping = getMapping();
      const elements = getKeccak(mapping);
      const merkleTree = new MerkleTree(elements, keccak256, { hashLeaves: false, sortPairs: true });
      const root = merkleTree.getHexRoot();

      // Set Merkle root
      console.log("setting merkle root");
      let tx = await this.zilla.contract.methods.setMerkleRoot(root).send({
        from: accounts[0],
      });
      // console.log(tx);

      console.log("APPROVING");
      const o = await opensea.methods.owner().call({
        from: accounts[0],
      });
      console.log("OWNER", o);
      // const creator = await opensea.methods.ownerOf("45592728320057645284509804786890123593787647745357137913094727932311502848001").send({
      //     "from": accounts[0]
      // })
      // console.log('CREATOR', creator)

      // let item = mapping[0];
      // let leaf = elements[0];
    //   let proof = merkleTree.getHexProof(leaf);
    //   console.log(item);
      // expect(await this.zilla.verify(root, leaf, proof)).to.equal(true);

    //   console.log("OS", OSWallet);
      let txApprove = await opensea.methods.setApprovalForAll(this.zilla.contract._address, true).send({
        from: zillaOwnerUnlocked, //OSWallet//accounts[0]
      });
    //   // console.log('OSagain', OSWallet)
      console.log('APPROVE: ', txApprove);

      txApprove = await opensea.methods.setApprovalForAll(this.zilla.contract._address, true).send({
        from: zillaOwnerUnlocked2, //OSWallet//accounts[0]
      });
      console.log(txApprove)
      console.log("minting");

    
      let fundaccount = await web3.eth.sendTransaction({
        from: zillaOwner0,
        to: zillaOwnerUnlocked, //this.zilla.contract._address,
        value: ethers.utils.parseEther("2"),
      });


      console.log(fundaccount);
      let index = mapping.findIndex((t) => t.new_id == "108");
      console.log("INDX", index);
      let map = mapping[index];

      let osZillaBalance = await opensea.methods.balanceOf(zillaOwnerUnlocked, map.old_token_id).call();
      // console.log('BALANCE OF')
      console.log(`balanceOf: ${osZillaBalance}`);

      let realZillaBalance = await this.zilla.contract.methods.balanceOf(zillaOwnerUnlocked).call()
      console.log('REAL ZILLA BALANCE: ', realZillaBalance)

      let tx2 = await this.zilla.contract.methods
        .mintAndBurn(
          map.old_token_id, //item.old_token_id,
          map.new_id, //item.new_id,
          elements[index], //leaf,
          merkleTree.getHexProof(elements[index]) //proof
        )
        .send({
          from: zillaOwnerUnlocked, //accounts[0],//OSWallet,//zillaOwnerOG,//zillaOwner0,
          gasLimit: 6721975,
        });
      console.log(tx2);

      let osZillaBalanceAfter = await opensea.methods.balanceOf(zillaOwnerUnlocked, map.old_token_id).call();
      // console.log('BALANCE OF')
      console.log(`balanceOf AFTER MINTBURN: ${osZillaBalanceAfter}`);

      let realZillaBalanceAfter = await this.zilla.contract.methods.balanceOf(zillaOwnerUnlocked).call()
      console.log('REAL ZILLA BALANCE AFTER: ', realZillaBalanceAfter)
    

      fundaccount = await web3.eth.sendTransaction({
        from: zillaOwner0,
        to: zillaOwnerUnlocked2, //this.zilla.contract._address,
        value: ethers.utils.parseEther("2"),
      });


      console.log(fundaccount);
      const index2 = mapping.findIndex((t) => t.new_id == "771");
      console.log("INDX", index2);
      const map2 = mapping[index2];

      osZillaBalance = await opensea.methods.balanceOf(zillaOwnerUnlocked2, map2.old_token_id).call();
      // console.log('BALANCE OF')
      console.log(`balanceOf2: ${osZillaBalance}`);

      realZillaBalance = await this.zilla.contract.methods.balanceOf(zillaOwnerUnlocked2).call()
      console.log('REAL ZILLA BALANCE2: ', realZillaBalance)

      tx2 = await this.zilla.contract.methods
        .mintAndBurn(
          map2.old_token_id, //item.old_token_id,
          map2.new_id, //item.new_id,
          elements[index2], //leaf,
          merkleTree.getHexProof(elements[index2]) //proof
        )
        .send({
          from: zillaOwnerUnlocked2, //accounts[0],//OSWallet,//zillaOwnerOG,//zillaOwner0,
          gasLimit: 6721975,
        });
      console.log(tx2);

      osZillaBalanceAfter = await opensea.methods.balanceOf(zillaOwnerUnlocked2, map2.old_token_id).call();
      // console.log('BALANCE OF')
      console.log(`balanceOf AFTER MINTBURN2: ${osZillaBalanceAfter}`);

      realZillaBalanceAfter = await this.zilla.contract.methods.balanceOf(zillaOwnerUnlocked2).call()
      console.log('REAL ZILLA BALANCE AFTER2: ', realZillaBalanceAfter)

      // let tx3 = await web3.eth.sendTransaction({
      //     "from": accounts[1],
      //     "to": this.zilla.contract._address,
      //     "value": ethers.utils.parseEther("1")
      // });

      // let weiBalance = await web3.eth.getBalance(zillaOwner0);

      // let tx4 = await this.zilla.contract.methods.claimRewards(0).send({
      //     "from": accounts[1],
      // });

      // let weiBalance2 = await web3.eth.getBalance(zillaOwner0);
      // // let ethDiff = ethers.utils.formatUnits(ethers.BigNumber.from(weiBalance2 - weiBalance));
      // let ethDiff = weiBalance2 - weiBalance;
      // console.log(weiBalance, weiBalance2);
      // console.log(`ethDiff: ${ethDiff}`);

      // Now we mint a second to a diff address

      // txApprove = await opensea.methods.setApprovalForAll(
      //     this.zilla.contract._address,
      //     true
      // ).send({
      //     "from": zillaOwner1
      // });

      // item = mapping[1];
      // leaf = elements[1];
      // proof = merkleTree.getHexProof(leaf);
      // let tx5 = await this.zilla.contract.methods.mintAndBurn(
      //     item.openseaTokenId,
      //     item.tokenId,
      //     leaf,
      //     proof
      // ).send({
      //     "from": zillaOwner1,
      //     "gasLimit": 1000000
      // });
      // // console.log(tx5);

      // let tx6 = await web3.eth.sendTransaction({
      //     "from": accounts[1],
      //     "to": this.zilla.contract._address,
      //     "value": ethers.utils.parseEther("1")
      // });

      // weiBalance = await web3.eth.getBalance(zillaOwner0);

      // let tx7 = await this.zilla.contract.methods.claimRewards(0).send({
      //     "from": accounts[1],
      // });

      // weiBalance2 = await web3.eth.getBalance(zillaOwner0);
      // // let ethDiff = ethers.utils.formatUnits(ethers.BigNumber.from(weiBalance2 - weiBalance));
      // ethDiff = weiBalance2 - weiBalance;
      // console.log(weiBalance, weiBalance2);
      // console.log(`ethDiff: ${ethDiff}`);
    });

    // it('lets you split funds', async function () {
    //     let dev1Address = await this.feeSplitter.contract.methods.dev1().call();
    //     let weiBalance = await web3.eth.getBalance(dev1Address);

    //     let tx = await web3.eth.sendTransaction({
    //         "from": accounts[1],
    //         "to": this.feeSplitter.address,
    //         "value": ethers.utils.parseEther("10"),
    //         "gasLimit": 500000
    //     });
    //     console.log(`Send eth gas used: ${tx.gasUsed}`);

    //     let weiBalanceAfter = await web3.eth.getBalance(dev1Address);
    //     let weiDiff = weiBalanceAfter - weiBalance;
    //     console.log(`weiDiff: ${weiDiff}`);
    // });
  });
});
