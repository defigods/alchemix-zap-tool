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
import { clearLocalItems, getLocalItem, setLocalItem } from "../helper";

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

  const hasCachedProvider = useCallback(() => {
    if (!web3Modal) return false;
    UAuthWeb3Modal.registerWeb3Modal(web3Modal);
    return !!web3Modal.cachedProvider;
  }, []);

  const disconnect = useCallback(async () => {
    web3Modal.clearCachedProvider();
    clearLocalItems();

    connected && setTimeout(() => window.location.reload(), 1);
  }, [connected]);

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
        if (!Object.keys(availableChains).includes("" + newChainId)) {
          setProvider(null);
          disconnect();
        } else {
          setChainId(newChainId);
          setProvider(
            new JsonRpcProvider(availableChains[newChainId].rpcUrls[0])
          );
          setLocalItem("connected_chain", newChainId);
        }
        // setTimeout(() => window.location.reload(), 1);
      });

      rawProvider.on("network", (_newNetwork, oldNetwork) => {
        if (!oldNetwork) return;
        window.location.reload();
      });
    },
    [disconnect]
  );

  const switchChain = useCallback(async (targetChain) => {
    const chainId = "0x" + targetChain.toString(16);
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
                chainName: availableChains[targetChain].chainName,
                nativeCurrency: {
                  symbol: availableChains[targetChain].symbol,
                  decimals: availableChains[targetChain].decimals,
                },
                blockExplorerUrls:
                  availableChains[targetChain].blockExplorerUrls,
                rpcUrls: availableChains[targetChain].rpcUrls,
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
  }, []);

  const connect = useCallback(
    async (targetChain = ChainIds.Ethereum) => {
      if (!Object.keys(availableChains).includes("" + targetChain)) {
        web3Modal.clearCachedProvider();
        const switched = await switchChain(ChainIds.Ethereum);
        if (!switched) {
          console.error(
            "Unable to connect. Please change network using provider."
          );
          return;
        }
      }

      let rawProvider = await web3Modal.connect();

      _initListeners(rawProvider);
      let connectedProvider = new Web3Provider(rawProvider, "any");
      let connectedChainId = await connectedProvider
        .getNetwork()
        .then((network) =>
          typeof network.chainId === "number"
            ? network.chainId
            : parseInt(network.chainId, 16)
        );

      if (connectedChainId !== targetChain) {
        web3Modal.clearCachedProvider();
        const switched = await switchChain(targetChain);
        if (!switched) {
          console.error(
            "Unable to connect. Please change network using provider."
          );
          return;
        }
      }

      rawProvider = await web3Modal.connect();

      _initListeners(rawProvider);
      connectedProvider = new Web3Provider(rawProvider, "any");
      connectedChainId = await connectedProvider
        .getNetwork()
        .then((network) =>
          typeof network.chainId === "number"
            ? network.chainId
            : parseInt(network.chainId, 16)
        );

      const connectedAddress = await connectedProvider.getSigner().getAddress();

      setChainId(connectedChainId);
      setAddress(connectedAddress);
      setProvider(connectedProvider);
      setConnected(true);
      setLocalItem("connected_chain", connectedChainId);
      setLocalItem("connected_address", connectedAddress);
      setLocalItem("connected_state", true);

      return connectedProvider;
    },
    [_initListeners, switchChain]
  );

  useEffect(() => {
    if (getLocalItem("connected_state"))
      connect(+getLocalItem("connected_chain", ChainIds.Ethereum));
  }, [connect]);

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
      switchChain,
    }),
    [
      connect,
      disconnect,
      provider,
      connected,
      address,
      chainId,
      hasCachedProvider,
      switchChain,
    ]
  );

  return (
    <Web3Context.Provider value={{ onChainProvider }}>
      {children}
    </Web3Context.Provider>
  );
};
