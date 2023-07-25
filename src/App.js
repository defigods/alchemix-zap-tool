/* eslint-disable import/no-anonymous-default-export */
import React, { useEffect, useState } from "react";
import { Box, Button, MenuItem, Select, Typography } from "@mui/material";
import HomePage from "./pages/home";
import {
  addressEllipsis,
  availableChains,
  useWeb3Context,
  Web3ContextProvider,
} from "./utils";
import { logo } from "./assets";

const Header = () => {
  const { address, chainId, connected, connect, disconnect } = useWeb3Context();

  const [selectedChain, setSelectedChain] = useState(chainId);

  useEffect(() => setSelectedChain(chainId), [chainId, connected]);

  const handleConnect = () =>
    connected ? disconnect() : connect(+selectedChain);

  const handleSelect = async (e) => {
    if (!connected) {
      setSelectedChain(e.target.value);
      return;
    }

    connect(+e.target.value);
    setSelectedChain(+e.target.value);
  };

  return (
    <Box
      className="flex ai-c fj-sb"
      sx={{
        py: "1rem",
        px: "2rem",
        background: "rgb(14 17 22)",
        borderBottom: "1px solid lightgray",
      }}
    >
      <Box className="flex ai-c">
        <img
          src={logo}
          alt="logo"
          style={{ width: "44px", height: "44px", marginRight: "0.5rem" }}
        />
        <Typography
          sx={{
            cursor: "pointer",
            color: "rgb(245 197 159)",
            textTransform: "uppercase",
            fontWeight: "bold",
            fontSize: "24px",
          }}
          onClick={() => (window.location.href = "/")}
        >
          Alchemix Zap Tool
        </Typography>
      </Box>
      <Box className="flex ai-c">
        <Select
          value={selectedChain}
          onChange={handleSelect}
          variant="standard"
          sx={{ mr: "0.5rem", py: 0, background: "transparent" }}
        >
          {Object.entries(availableChains).map(
            ([chain, { icon, chainName }]) => (
              <MenuItem value={chain} key={`chain-${chainName.toLowerCase()}`}>
                <Box className="flex ai-c">
                  <img
                    style={{
                      height: "28px",
                      width: "28px",
                      marginRight: "5px",
                    }}
                    src={icon}
                    alt={`${chainName.toLowerCase()}-icon`}
                  />
                  <Typography>{chainName}</Typography>
                </Box>
              </MenuItem>
            )
          )}
        </Select>
        <Button
          sx={{
            width: "120px",
            background: "white",
            borderRadius: "10px",
            color: "black",
            ":hover": { background: "lightgray" },
          }}
          variant="contained"
          onClick={handleConnect}
        >
          {connected ? addressEllipsis(address) : "Connect"}
        </Button>
      </Box>
    </Box>
  );
};

export default () => (
  <Web3ContextProvider>
    <Box className="w100">
      <Header />
      <HomePage />
    </Box>
  </Web3ContextProvider>
);
