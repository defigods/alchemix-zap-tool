import { useEffect, useState } from "react";
import { BigNumber, Contract, constants, utils } from "ethers";
import { addresses, getAlchemistAddress } from "./addresses";
import { currencies } from "./currencies";
import { availableChains } from "./chains";
import alchemistAbi from "../abis/alchemist.json";
import gatewayAbi from "../abis/gateway.json";
import erc20Abi from "../abis/erc20.json";

export const useUnderlyingTokens = (chainId, provider) => {
  const [tokens, setTokens] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      const alchemist = new Contract(
        addresses[chainId].addresses["ALCHEMIST"],
        alchemistAbi,
        provider
      );
      let data = await alchemist["getSupportedUnderlyingTokens"]();
      try {
        const alchemistETH = new Contract(
          addresses[chainId].addresses["ALCHEMIST_ETH"],
          alchemistAbi,
          provider
        );
        const dataETH = await alchemistETH["getSupportedUnderlyingTokens"]();
        data = [...dataETH, ...data];
      } catch (e) {
        console.warn(
          `Not supporting alchemist eth in ${availableChains[chainId].chainName}`
        );
      }
      setTokens(data);
    };

    if (provider) fetch();
  }, [chainId, provider]);

  return { tokens };
};

export const useYieldTokens = (chainId, provider) => {
  const [mapping, setMapping] = useState({});

  useEffect(() => {
    const fetch = async () => {
      const finalData = {};
      const alchemist = new Contract(
        addresses[chainId].addresses["ALCHEMIST"],
        alchemistAbi,
        provider
      );
      const data = await alchemist["getSupportedYieldTokens"]();
      const params = await Promise.all(
        data.map((x) => alchemist["getYieldTokenParameters"](x))
      );
      for (let i = 0; i < params.length; i++) {
        if (Object.keys(finalData).includes(params[i][1].toLowerCase()))
          finalData[params[i][1].toLowerCase()].push(data[i].toLowerCase());
        else finalData[params[i][1].toLowerCase()] = [data[i].toLowerCase()];
      }
      try {
        const alchemistETH = new Contract(
          addresses[chainId].addresses["ALCHEMIST_ETH"],
          alchemistAbi,
          provider
        );
        const dataETH = await alchemistETH["getSupportedYieldTokens"]();
        const paramsETH = await Promise.all(
          dataETH.map((x) => alchemistETH["getYieldTokenParameters"](x))
        );
        for (let i = 0; i < paramsETH.length; i++) {
          if (Object.keys(finalData).includes(paramsETH[i][1].toLowerCase()))
            finalData[paramsETH[i][1].toLowerCase()].push(
              dataETH[i].toLowerCase()
            );
          else
            finalData[paramsETH[i][1].toLowerCase()] = [
              dataETH[i].toLowerCase(),
            ];
        }
      } catch (e) {
        console.warn(
          `Not supporting alchemist eth in ${availableChains[chainId].chainName}`
        );
      }
      setMapping(finalData);
    };

    if (provider) fetch();
  }, [chainId, provider]);

  return { mapping };
};

export const useAlchemixPosition = (
  depositAsset,
  mapping,
  yieldTokenIndex,
  address,
  chainId,
  provider,
  isPending
) => {
  const [position, setPosition] = useState({ balance: 0, weight: 0 });

  useEffect(() => {
    const fetch = async () => {
      try {
        const yieldToken =
          mapping[
            currencies[
              depositAsset === "ETH" ? "WETH" : depositAsset
            ].addresses[chainId].toLowerCase()
          ][yieldTokenIndex];
        const alchemist = new Contract(
          getAlchemistAddress(chainId, depositAsset),
          alchemistAbi,
          provider
        );
        const data = await alchemist["positions"](address, yieldToken);
        setPosition({
          balance: +utils.formatEther(data.shares),
          weight: +utils.formatEther(data.lastAccruedWeight),
        });
      } catch (e) {
        console.warn(`Error fetching yield tokens, ${e}`);
      }
    };

    if (
      chainId > 0 &&
      address.length > 0 &&
      depositAsset.length > 0 &&
      !!provider &&
      yieldTokenIndex > -1
    )
      fetch();
  }, [
    address,
    chainId,
    depositAsset,
    mapping,
    provider,
    yieldTokenIndex,
    isPending,
  ]);

  return { ...position };
};

export const useTokenInfo = (symbol, address, chainId, provider, isPending) => {
  const [balance, setBalance] = useState(BigNumber.from(0));
  const [allowance, setAllowance] = useState(BigNumber.from(0));

  useEffect(() => {
    const fetch = async () => {
      try {
        if (symbol === "ETH") {
          setBalance(await provider.getBalance(address));
          setAllowance(constants.MaxUint256);
          return;
        }
        const token = new Contract(
          currencies[symbol].addresses[chainId],
          erc20Abi,
          provider
        );
        setBalance(await token["balanceOf"](address));
        setAllowance(
          await token["allowance"](
            address,
            getAlchemistAddress(chainId, symbol)
          )
        );
      } catch (e) {
        console.warn(`Error fetching token info, ${e}`);
      }
    };

    if (symbol.length > 0 && address.length > 0 && !!provider) fetch();
  }, [address, chainId, provider, symbol, isPending]);

  return { balance, allowance };
};

export const useMaximumMintableAmount = (
  depositAsset,
  depositAmount,
  address,
  chainId,
  provider
) => {
  const [maximumAmount, setMaximumAmount] = useState(BigNumber.from(0));

  useEffect(() => {
    const fetch = async () => {
      try {
        const alchemist = new Contract(
          getAlchemistAddress(chainId, depositAsset),
          alchemistAbi,
          provider
        );
        const minimumCollateralization = await alchemist[
          "minimumCollateralization"
        ]();
        const account = await alchemist["accounts"](address);
        const yieldTokenParameters = await Promise.all(
          account.depositedTokens.map((x) =>
            alchemist["getYieldTokenParameters"](x)
          )
        );
        const positions = await Promise.all(
          account.depositedTokens.map((x) => alchemist["positions"](address, x))
        );
        let userTotalDeposit = utils.parseUnits(
          Number(depositAmount).toString(),
          currencies[depositAsset]?.decimals || 18
        );
        yieldTokenParameters.forEach((param, index) => {
          userTotalDeposit = userTotalDeposit.add(
            param.activeBalance
              .sub(param.harvestableBalance)
              .mul(positions[index].shares)
              .div(param.totalShares)
          );
        });
        setMaximumAmount(
          userTotalDeposit
            .mul(utils.parseEther("1"))
            .div(minimumCollateralization)
            .sub(account.debt)
        );
      } catch (e) {
        console.warn(`Error fetching maximum mintable amount, ${e}`);
      }
    };

    if (address.length > 0 && depositAsset.length > 0 && !!provider) fetch();
  }, [address, chainId, depositAmount, depositAsset, provider]);

  return { maximumAmount };
};

export const getTokenSymbol = async (address, provider) => {
  const token = new Contract(address, erc20Abi, provider);
  return await token["symbol"]();
};

export const getTokenNameAndSymbol = async (address, provider) => {
  const token = new Contract(address, erc20Abi, provider);
  return `${await token["name"]()} (${await token["symbol"]()})`;
};

export const approveToken = async (symbol, amount, address, provider) => {
  const alchemist = getAlchemistAddress(provider.network.chainId, symbol);
  const signer = provider.getSigner();
  const token = new Contract(
    currencies[symbol].addresses[provider.network.chainId],
    erc20Abi,
    signer
  );
  if (symbol === "USDT") {
    const allowance = await token["allowance"](address, alchemist);
    if (!allowance.isZero()) {
      const tx = await token["approve"](alchemist, BigNumber.from(0));
      await tx.wait();
    }
  }
  return token["approve"](alchemist, amount);
};

export const depositUnderlying = (
  depositAsset,
  yieldToken,
  amount,
  address,
  provider
) => {
  if (depositAsset === "ETH") {
    const wethGateway = new Contract(
      addresses[provider.network.chainId].addresses["GATEWAY"],
      gatewayAbi,
      provider.getSigner()
    );
    return wethGateway["depositUnderlying"](
      getAlchemistAddress(provider.network.chainId, depositAsset),
      yieldToken,
      amount,
      address,
      0,
      { value: amount }
    );
  }
  const alchemist = new Contract(
    getAlchemistAddress(provider.network.chainId, depositAsset),
    alchemistAbi,
    provider.getSigner()
  );
  return alchemist["depositUnderlying"](yieldToken, amount, address, 0);
};

export const depositAndBorrow = (
  depositAsset,
  yieldToken,
  depositAmount,
  borrowAmount,
  address,
  provider
) => {
  const alchemist = new Contract(
    getAlchemistAddress(provider.network.chainId, depositAsset),
    alchemistAbi,
    provider.getSigner()
  );
  const iface = new utils.Interface(alchemistAbi);
  const calls = [];
  calls.push(
    iface.encodeFunctionData("depositUnderlying", [
      yieldToken,
      depositAmount,
      address,
      0,
    ])
  );
  calls.push(iface.encodeFunctionData("mint", [borrowAmount, address]));
  return alchemist["multicall"](calls);
};
