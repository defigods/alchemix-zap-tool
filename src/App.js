/* eslint-disable import/no-anonymous-default-export */
import React from "react";
import { Box, Typography, Button } from "@mui/material";
import HomePage from "./pages/home";
import { addressEllipsis, useWeb3Context, Web3ContextProvider } from "./utils";

const Header = () => {
  const { address, connected, connect, disconnect } = useWeb3Context();

  const handleConnect = () => (connected ? disconnect() : connect());

  return (
    <Box className="flex fr ai-c fj-sb" sx={{ py: "0.5rem", px: "1rem" }}>
      <Typography
        sx={{ cursor: "pointer" }}
        onClick={() => (window.location.href = "/")}
      >
        Alchemix Tool
      </Typography>
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
