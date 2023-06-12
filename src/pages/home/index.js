/* eslint-disable import/no-anonymous-default-export */
import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Button,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import {
  currencies,
  getTokenSymbol,
  useUnderlyingTokens,
  useWeb3Context,
  useYieldTokens,
} from "../../utils";

const renderPlaceholder = (value, text) =>
  value.length === 0 ? () => <Typography>{text}</Typography> : undefined;

export default () => {
  const { chainId, connected, connect, provider } = useWeb3Context();
  const { tokens } = useUnderlyingTokens(chainId, provider);
  const { mapping } = useYieldTokens(chainId, provider);

  const [underlyingTokens, setUnderlyingTokens] = useState([]);
  const [depositAsset, setDepositAsset] = useState("");
  const [yieldTokens, setYieldTokens] = useState([]);
  const [yieldStrategy, setYieldStrategy] = useState("");
  const [loanAssets, setLoanAssets] = useState([]);
  const [loanAsset, setLoanAsset] = useState("");
  const [fromAmount, setFromAmount] = useState("0");
  const [toAmount, setToAmount] = useState("0");
  const [loanAmount, setLoanAmount] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        setUnderlyingTokens(
          await Promise.all(tokens.map((x) => getTokenSymbol(x, provider)))
        );
      } catch (e) {
        console.error(`Error fetching underlying token symbols, ${e}`);
      }
    };
    fetch();
  }, [provider, tokens]);

  useEffect(() => {
    const fetch = async () => {
      try {
        setYieldTokens(
          await Promise.all(
            (
              mapping[
                currencies[depositAsset].addresses[chainId].toLowerCase()
              ] || []
            ).map((x) => getTokenSymbol(x, provider))
          )
        );
      } catch (e) {
        console.error(`Error fetching yield token symbols, ${e}`);
      }
    };
    if (depositAsset.length > 0) {
      setLoanAssets([
        depositAsset,
        `AL${depositAsset.includes("ETH") ? "ETH" : "USD"}`,
      ]);
      setYieldStrategy("");
      fetch();
    }
  }, [provider, mapping, depositAsset, chainId]);

  const handleAmountChange = (e) => {
    const re = /^[0-9\b]+{.}[0-9\b]+$/;
    if (e.target.value === "" || re.test(e.target.value))
      setLoanAmount(e.target.value);
  };

  const handleDeposit = async () => {
    if (!connected) {
      connect();
      return;
    }

    if (!provider) return;
  };

  return (
    <Box sx={{ p: "1rem", pt: { md: "5rem", xs: "3rem" } }}>
      <Grid item container columnSpacing={2} rowSpacing={2}>
        <Grid item md={4} sx={{ display: { xs: "none", md: "block" } }} />
        <Grid item md={4} xs={12} sx={{ pr: "1rem" }}>
          <Box
            sx={{
              p: "0.5rem",
              background: "#131516",
              borderRadius: "1rem",
            }}
          >
            <Box
              sx={{
                p: "0.5rem 1rem",
                my: "0.5rem",
                borderRadius: "1rem",
                border: "1px solid gray",
              }}
            >
              <Box className="flex fr ai-c fj-sb">
                <TextField
                  disabled
                  value={fromAmount}
                  variant="standard"
                  placeholder="0"
                  InputProps={{
                    disableUnderline: true,
                    sx: { fontSize: "2rem" },
                  }}
                />
                <Select
                  value={depositAsset}
                  displayEmpty
                  renderValue={renderPlaceholder(
                    depositAsset,
                    "Select deposit asset"
                  )}
                  onChange={(e) => setDepositAsset(e.target.value)}
                  variant="standard"
                  sx={{ background: "transparent" }}
                >
                  {Object.entries(currencies)
                    .filter(([x]) => underlyingTokens.includes(x))
                    .map(([symbol, { icon }]) => (
                      <MenuItem value={symbol} key={`underlying-${symbol}`}>
                        <Box className="flex fr ai-c">
                          <img
                            style={{
                              height: "28px",
                              width: "28px",
                              marginRight: "5px",
                            }}
                            src={icon}
                            alt={`${symbol}-icon`}
                          />
                          <Typography>{symbol}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                </Select>
              </Box>
              <Typography color="gray">${fromAmount}</Typography>
            </Box>
            <Box
              sx={{
                p: "0.5rem 1rem",
                my: "0.5rem",
                borderRadius: "1rem",
                border: "1px solid gray",
              }}
            >
              <Box className="flex fr ai-c fj-sb">
                <TextField
                  disabled
                  value={toAmount}
                  variant="standard"
                  placeholder="0"
                  InputProps={{
                    disableUnderline: true,
                    sx: { fontSize: "2rem" },
                  }}
                />
                <Select
                  value={yieldStrategy}
                  displayEmpty
                  renderValue={renderPlaceholder(
                    yieldStrategy,
                    "Select yield strategy option"
                  )}
                  onChange={(e) => setYieldStrategy(e.target.value)}
                  variant="standard"
                  sx={{ background: "transparent" }}
                >
                  {yieldTokens.map((symbol, index) => (
                    <MenuItem value={symbol} key={`yield-${index}`}>
                      <Box className="flex fr ai-c">
                        <Typography>{symbol}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </Box>
              <Typography color="gray">${toAmount}</Typography>
            </Box>
            <Box
              sx={{
                p: "0.5rem 1rem",
                my: "0.5rem",
                borderRadius: "1rem",
                border: "1px solid gray",
              }}
            >
              <Box className="flex fr ai-c fj-sb">
                <TextField
                  value={loanAmount}
                  onChange={handleAmountChange}
                  variant="standard"
                  placeholder="0"
                  InputProps={{
                    disableUnderline: true,
                    sx: { fontSize: "2rem" },
                  }}
                />
                <Select
                  value={loanAsset}
                  displayEmpty
                  renderValue={renderPlaceholder(
                    loanAsset,
                    "Select loan asset"
                  )}
                  onChange={(e) => setLoanAsset(e.target.value)}
                  variant="standard"
                  sx={{ background: "transparent" }}
                >
                  {Object.entries(currencies)
                    .filter(([x]) => loanAssets.includes(x))
                    .map(([symbol, { icon }]) => (
                      <MenuItem value={symbol} key={`loan-${symbol}`}>
                        <Box className="flex fr ai-c">
                          <img
                            style={{
                              height: "28px",
                              width: "28px",
                              marginRight: "5px",
                            }}
                            src={icon}
                            alt={`${symbol}-icon`}
                          />
                          <Typography>{symbol}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                </Select>
              </Box>
              <Typography>${loanAmount}</Typography>
            </Box>
            <Button
              className="w100"
              sx={{
                background: "white",
                borderRadius: "1rem",
                color: "black",
                fontSize: "20px",
                ":hover": { background: "lightgray" },
              }}
              variant="contained"
              disabled={
                connected &&
                (depositAsset.length === 0 ||
                  Number(fromAmount) === 0 ||
                  yieldStrategy.length === 0 ||
                  Number(toAmount) === 0)
              }
              onClick={handleDeposit}
            >
              {connected ? "Deposit" : "Connect Wallet"}
            </Button>
          </Box>
        </Grid>
        <Grid item md={4} sx={{ display: { xs: "none", md: "block" } }} />
      </Grid>
    </Box>
  );
};
