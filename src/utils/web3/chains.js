export const ChainIds = {
  Ethereum: 1,
  Optimism: 10,
  Fantom: 250,
};

export const availableChains = {
  [ChainIds.Ethereum]: {
    networkName: "Ethereum",
    rpcUrl: "https://mainnet.infura.io/v3/84842078b09946638c03157f83405213",
    decimals: 18,
    symbol: "ETH",
    blockExplorerUrls: "https://etherscan.io/",
  },
  [ChainIds.Optimism]: {
    networkName: "Optimism",
    rpcUrl:
      "https://opt-mainnet.g.alchemy.com/v2/G1ZLf13J0Pwr-OgfeTFEoFaPHW8LOrrn",
    decimals: 18,
    symbol: "ETH",
    blockExplorerUrls: "https://optimistic.etherscan.io/",
  },
  [ChainIds.Fantom]: {
    networkName: "Fantom Opera",
    rpcUrl: "https://rpc.ftm.tools",
    /*
    "https://rpc.ankr.com/fantom",
    "https://rpc3.fantom.network",
    "https://rpc.fantom.network",
    "https://rpcapi.fantom.network",
    "https://rpc2.fantom.network",
    */
    decimals: 18,
    symbol: "FTM",
    blockExplorerUrls: "https://ftmscan.com/",
  },
};

export const defaultChain = ChainIds.Ethereum;
