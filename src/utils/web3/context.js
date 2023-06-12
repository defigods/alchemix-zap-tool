import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Web3Modal from "web3modal";
import * as UAuthWeb3Modal from "@uauth/web3modal";
import { JsonRpcProvider, Web3Provider } from "@ethersproject/providers";
import { ChainIds, availableChains } from "./chains";

const Web3Context = createContext(null);

const web3Modal = new Web3Modal({
  cacheProvider: true,
  providerOptions: { connector: UAuthWeb3Modal.connector },
});

export const useWeb3Context = () => {
  const web3Context = useContext(Web3Context);
  const { onChainProvider } = web3Context;
  return useMemo(() => {
    return { ...onChainProvider };
  }, [onChainProvider]);
};

export const Web3ContextProvider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [chainId, setChainId] = useState(ChainIds.Ethereum);
  const [address, setAddress] = useState("");
  const [provider, setProvider] = useState(null);

  const updateChainDetails = () => {
    const cid = parseInt(window.ethereum.chainId, 16);
    if (!Object.keys(availableChains).includes("" + cid)) return;
    setChainId(cid);
    setProvider(new JsonRpcProvider(availableChains[cid].rpcUrl));
  };

  useEffect(() => {
    window.ethereum.on("chainChanged", updateChainDetails);
    updateChainDetails();
  }, []);

  const hasCachedProvider = useCallback(() => {
    if (!web3Modal) return false;
    UAuthWeb3Modal.registerWeb3Modal(web3Modal);
    return !!web3Modal.cachedProvider;
  }, []);

  const disconnect = useCallback(async () => {
    web3Modal.clearCachedProvider();
    setConnected(false);

    setTimeout(() => window.location.reload(), 1);
  }, []);

  const _initListeners = useCallback(
    (rawProvider) => {
      if (!rawProvider.on) {
        return;
      }
      rawProvider.on("accountsChanged", async () => {
        setTimeout(() => window.location.reload(), 1);
      });

      rawProvider.on("chainChanged", async (chain) => {
        let newChainId;
        // On mobile chain comes in as a number but on web it comes in as a hex string
        if (typeof chain === "number") {
          newChainId = chain;
        } else {
          newChainId = parseInt(chain, 16);
        }
        setChainId(newChainId);
        if (!Object.keys(availableChains).includes(newChainId))
          await disconnect();
        setTimeout(() => window.location.reload(), 1);
      });

      rawProvider.on("network", (_newNetwork, oldNetwork) => {
        if (!oldNetwork) return;
        window.location.reload();
      });
    },
    [disconnect]
  );

  const switchToEthereum = async () => {
    const chainId = "0x" + ChainIds.Ethereum.toString(16);
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId }],
      });
      return true;
    } catch (e) {
      if (e.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId,
                chainName: "Ethereum",
                nativeCurrency: { symbol: "ETH", decimals: 18 },
                blockExplorerUrls: "https://.etherscan.io/",
                rpcUrls: availableChains[chainId].rpcUrl,
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error(addError);
          return false;
        }
      } else {
        console.error(e);
        return false;
      }
    }
  };

  const connect = useCallback(async () => {
    const rawProvider = await web3Modal.connect();

    _initListeners(rawProvider);
    const connectedProvider = new Web3Provider(rawProvider, "any");
    const chainId = await connectedProvider
      .getNetwork()
      .then((network) =>
        typeof network.chainId === "number"
          ? network.chainId
          : parseInt(network.chainId, 16)
      );
    const connectedAddress = await connectedProvider.getSigner().getAddress();

    if (!Object.keys(availableChains).includes("" + chainId)) {
      web3Modal.clearCachedProvider();
      const switched = await switchToEthereum();
      if (!switched) {
        console.error(
          "Unable to connect. Please change network using provider."
        );
        return;
      }
    }

    setChainId(chainId);
    setAddress(connectedAddress);
    setProvider(connectedProvider);
    setConnected(true);

    return connectedProvider;
  }, [_initListeners]);

  const onChainProvider = useMemo(
    () => ({
      connect,
      disconnect,
      provider,
      connected,
      address,
      chainId,
      web3Modal,
      hasCachedProvider,
    }),
    [
      connect,
      disconnect,
      provider,
      connected,
      address,
      chainId,
      hasCachedProvider,
    ]
  );

  return (
    <Web3Context.Provider value={{ onChainProvider }}>
      {children}
    </Web3Context.Provider>
  );
};
