import { constants } from "ethers";
import { addresses } from "./addresses";
import { ChainIds } from "./chains";
import * as assets from "../../assets";

export const currencies = {
  ETH: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
    icon: assets.ALUSD,
    addresses: {
      [ChainIds.Ethereum]: constants.AddressZero,
      [ChainIds.Optimism]: constants.AddressZero,
      [ChainIds.Fantom]: constants.AddressZero,
    },
  },
  FTM: {
    name: "Fantom",
    symbol: "FTM",
    decimals: 18,
    icon: assets.FTM,
    addresses: {
      [ChainIds.Ethereum]: constants.AddressZero,
      [ChainIds.Optimism]: constants.AddressZero,
      [ChainIds.Fantom]: constants.AddressZero,
    },
  },
  WETH: {
    name: "Wrapped Ether",
    symbol: "WETH",
    decimals: 18,
    icon: assets.WETH,
    addresses: {
      [ChainIds.Ethereum]: addresses[ChainIds.Ethereum].addresses["WETH"],
      [ChainIds.Optimism]: addresses[ChainIds.Optimism].addresses["WETH"],
      [ChainIds.Fantom]: constants.AddressZero,
    },
  },
  DAI: {
    name: "Dai Stablecoin",
    symbol: "DAI",
    decimals: 18,
    icon: assets.DAI,
    addresses: {
      [ChainIds.Ethereum]: addresses[ChainIds.Ethereum].addresses["DAI"],
      [ChainIds.Optimism]: addresses[ChainIds.Optimism].addresses["DAI"],
      [ChainIds.Fantom]: addresses[ChainIds.Fantom].addresses["DAI"],
    },
  },
  USDC: {
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    icon: assets.USDC,
    addresses: {
      [ChainIds.Ethereum]: addresses[ChainIds.Ethereum].addresses["USDC"],
      [ChainIds.Optimism]: addresses[ChainIds.Optimism].addresses["USDC"],
      [ChainIds.Fantom]: addresses[ChainIds.Fantom].addresses["USDC"],
    },
  },
  USDT: {
    name: "Tether USD",
    symbol: "USDT",
    decimals: 6,
    icon: assets.USDT,
    addresses: {
      [ChainIds.Ethereum]: addresses[ChainIds.Ethereum].addresses["USDT"],
      [ChainIds.Optimism]: addresses[ChainIds.Optimism].addresses["USDT"],
      [ChainIds.Fantom]: addresses[ChainIds.Fantom].addresses["USDT"],
    },
  },
  FRAX: {
    name: "FRAX Finance",
    symbol: "FRAX",
    decimals: 18,
    icon: assets.FRAX,
    addresses: {
      [ChainIds.Ethereum]: addresses[ChainIds.Ethereum].addresses["FRAX"],
      [ChainIds.Optimism]: constants.AddressZero,
      [ChainIds.Fantom]: constants.AddressZero,
    },
  },
  ALUSD: {
    name: "Alchemix USD",
    symbol: "alUSD",
    decimals: 18,
    icon: assets.ALUSD,
    addresses: {
      [ChainIds.Ethereum]: addresses[ChainIds.Ethereum].addresses["ALUSD"],
      [ChainIds.Optimism]: addresses[ChainIds.Optimism].addresses["ALUSD"],
      [ChainIds.Fantom]: addresses[ChainIds.Fantom].addresses["ALUSD"],
    },
  },
  ALETH: {
    name: "Alchemix ETH",
    symbol: "alETH",
    decimals: 18,
    icon: assets.ALETH,
    addresses: {
      [ChainIds.Ethereum]: addresses[ChainIds.Ethereum].addresses["ALETH"],
      [ChainIds.Optimism]: addresses[ChainIds.Optimism].addresses["ALETH"],
      [ChainIds.Fantom]: constants.AddressZero,
    },
  },
};
