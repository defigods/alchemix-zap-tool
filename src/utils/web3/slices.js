import { Contract } from "ethers";
import { useEffect, useState } from "react";
import { addresses } from "./addresses";
import { availableChains } from "./chains";
import alchemistAbi from "../abis/alchemist.json";
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
          `not supporting alchemist eth in ${availableChains[chainId].networkName}`
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
          `not supporting alchemist eth in ${availableChains[chainId].networkName}`
        );
      }
      setMapping(finalData);
    };

    if (provider) fetch();
  }, [chainId, provider]);

  return { mapping };
};

export const getTokenSymbol = async (address, provider) => {
  const token = new Contract(address, erc20Abi, provider);
  return await token["symbol"]();
};
