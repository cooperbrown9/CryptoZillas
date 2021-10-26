module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  compilers: {
    solc: {
      version: "0.8.4",
    },
  },
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
      // networkCheckTimeout: 15
    },
    test: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
      // networkCheckTimeout: 15
    },
    mainnet_fork: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
      // networkCheckTimeout: 15
    },
  },
};

/**
 * ganache-cli --fork https://mainnet.infura.io/v3/6efdf9100b704f7dba9795a93066ecbc --unlock 0x0f706d69703c016dca25a81f204e64cedc5a5557
 */