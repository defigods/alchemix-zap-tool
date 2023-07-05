/* eslint-disable import/no-anonymous-default-export */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Grid,
  Button,
  MenuItem,
  Select,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import { utils } from "ethers";
import {
  currencies,
  useAlchemixPosition,
  getTokenSymbol,
  getTokenNameAndSymbol,
  useUnderlyingTokens,
  useWeb3Context,
  useYieldTokens,
  depositUnderlying,
  useTokenInfo,
  approveToken,
  useMaximumMintableAmount,
  ChainIds,
  depositAndBorrow,
} from "../../utils";
import { ExpandLessOutlined, ExpandMoreOutlined } from "@mui/icons-material";

const renderPlaceholder = (isEmpty, text) =>
  isEmpty ? () => <Typography>{text}</Typography> : undefined;

export default () => {
  const { address, chainId, connected, connect, provider } = useWeb3Context();
  const { tokens } = useUnderlyingTokens(chainId, provider);
  const { mapping } = useYieldTokens(chainId, provider);

  const [isPending, setPending] = useState(false);
  const [underlyingTokens, setUnderlyingTokens] = useState([]);
  const [depositAsset, setDepositAsset] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [yieldTokens, setYieldTokens] = useState([]);
  const [yieldToken, setYieldToken] = useState(-1);
  const [showLoans, setShowLoans] = useState(true);
  const [loanAssets, setLoanAssets] = useState([]);
  const [loanAsset, setLoanAsset] = useState("");
  const [loanAmount, setLoanAmount] = useState("");

  const { balance: positionBalance } = useAlchemixPosition(
    depositAsset,
    mapping,
    yieldToken,
    address,
    chainId,
    provider,
    isPending
  );
  const { balance: depositBalance, allowance: depositAllowance } = useTokenInfo(
    depositAsset,
    address,
    chainId,
    provider,
    isPending
  );
  const { maximumAmount } = useMaximumMintableAmount(
    depositAsset,
    depositAmount,
    address,
    chainId,
    provider
  );

  const depositDecimals = useMemo(() => {
    return (
      currencies[depositAsset === "ETH" ? "WETH" : depositAsset]?.decimals || 18
    );
  }, [depositAsset]);

  const depositBalanceInsufficient = useMemo(
    () => +depositAmount > +utils.formatUnits(depositBalance, depositDecimals),
    [depositAmount, depositBalance, depositDecimals]
  );

  const depositAllowanceInsufficient = useMemo(
    () =>
      +depositAmount > +utils.formatUnits(depositAllowance, depositDecimals),
    [depositAllowance, depositAmount, depositDecimals]
  );

  const loanDecimals = useMemo(() => {
    return currencies[loanAsset]?.decimals || 18;
  }, [loanAsset]);

  const loanAmountExceedsLimit = useMemo(
    () => +loanAmount > +utils.formatUnits(maximumAmount, depositDecimals),
    [depositDecimals, loanAmount, maximumAmount]
  );

  useEffect(() => {
    setUnderlyingTokens([]);
    setDepositAsset("");
    setYieldTokens([]);
    setYieldToken(-1);
    setLoanAssets([]);
    setLoanAsset("");
  }, [chainId, provider]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const symbols = await Promise.all(
          tokens.map((x) => getTokenSymbol(x, provider))
        );
        if (chainId !== ChainIds.Fantom) symbols.splice(0, 0, "ETH");
        setUnderlyingTokens(symbols);
      } catch (e) {
        console.error(`Error fetching underlying token symbols, ${e}`);
      }
    };

    if (tokens.length > 0) fetch();
    else setDepositAsset("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens]);

  useEffect(() => setShowLoans(depositAsset !== "ETH"), [depositAsset]);

  const fetchYieldTokens = useCallback(async () => {
    try {
      const tokens = await Promise.all(
        (
          mapping[
            currencies[
              depositAsset === "ETH" ? "WETH" : depositAsset
            ].addresses[chainId].toLowerCase()
          ] || []
        ).map((x) => getTokenNameAndSymbol(x, provider))
      );
      setYieldTokens(tokens);
      if (tokens.length > 0) setYieldToken(0);
    } catch (e) {
      console.error(`Error fetching yield token symbols, ${e}`);
    }
  }, [chainId, depositAsset, mapping, provider]);

  useEffect(() => {
    fetchYieldTokens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapping]);

  useEffect(() => {
    setYieldTokens([]);
    setYieldToken(-1);
    setLoanAssets([]);
    setLoanAsset("");
    fetchYieldTokens();
    if (depositAsset.length > 0) {
      const assets = [];
      // TODO: allow for next version
      if (process.env.SUPPORT_ALSWAP) assets.push(depositAsset);
      if (chainId !== ChainIds.Fantom || !depositAsset.includes("ETH"))
        assets.push(`AL${depositAsset.includes("ETH") ? "ETH" : "USD"}`);
      setLoanAssets(assets);
      if (assets.length > 0) setLoanAsset(assets[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depositAsset]);

  useEffect(() => {
    setDepositAmount(getAmountForDecimals(depositAmount, depositAsset));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depositAsset]);

  useEffect(() => {
    if (depositAsset.length > 0)
      setLoanAmount(utils.formatUnits(maximumAmount, depositDecimals));
  }, [depositAmount, depositAsset, maximumAmount]);

  const shouldDisable = useMemo(
    () =>
      isPending ||
      (connected &&
        (depositAsset.length === 0 ||
          Number(depositAmount) === 0 ||
          depositBalanceInsufficient ||
          (!depositAllowanceInsufficient &&
            (yieldToken === -1 ||
              (showLoans &&
                (Number(loanAmount) === 0 ||
                  loanAmountExceedsLimit ||
                  loanAsset.length === 0)))))),
    [
      connected,
      depositAllowanceInsufficient,
      depositAmount,
      depositAsset,
      depositBalanceInsufficient,
      isPending,
      loanAmount,
      loanAmountExceedsLimit,
      loanAsset,
      showLoans,
      yieldToken,
    ]
  );

  const getAmountForDecimals = (amount, asset) => {
    if (+amount >= 1000000000) return;

    let decimals = 18;
    try {
      decimals = currencies[asset].decimals;
    } catch (_) {
      console.warn("Deposit asset not selected yet");
    }

    const [integerPart, decimalPart] = amount.split(".");
    return decimals && decimalPart?.length && decimalPart?.length > decimals
      ? integerPart.trim() + "." + decimalPart.trim().substring(0, decimals)
      : amount.trim();
  };

  const handleAmountChange = (amount, index) => {
    const amountStr = getAmountForDecimals(
      amount,
      [depositAsset, loanAsset][index]
    );
    if (!isNaN(Number(amountStr)) && !amountStr.includes("e"))
      [setDepositAmount, setLoanAmount][index](amountStr);
  };

  const setMaxDeposit = () =>
    setDepositAmount(utils.formatUnits(depositBalance, depositDecimals));

  const setMaxBorrow = () =>
    setLoanAmount(utils.formatUnits(maximumAmount, depositDecimals));

  const handleDeposit = async () => {
    if (!connected) {
      connect(chainId);
      return;
    }

    const amount = utils.parseUnits(depositAmount, depositDecimals);
    if (depositAllowanceInsufficient) {
      try {
        setPending(true);
        const tx = await approveToken(depositAsset, amount, address, provider);
        await tx.wait();
      } catch (e) {
        console.error(`Approve failure, ${e}`);
      } finally {
        setPending(false);
        return;
      }
    }

    try {
      setPending(true);

      let tx;

      const depositAssetKey = depositAsset === "ETH" ? "WETH" : depositAsset;
      if (!showLoans)
        tx = await depositUnderlying(
          depositAsset,
          mapping[currencies[depositAssetKey].addresses[chainId].toLowerCase()][
            yieldToken
          ],
          amount,
          address,
          provider
        );
      else
        tx = await depositAndBorrow(
          depositAsset,
          mapping[currencies[depositAssetKey].addresses[chainId].toLowerCase()][
            yieldToken
          ],
          amount,
          utils.parseUnits(loanAmount, loanDecimals),
          address,
          provider
        );
      await tx.wait();
    } catch (e) {
      console.error(`Deposit failure, ${e}`);
    } finally {
      setPending(false);
    }
  };

  return (
    <Box sx={{ p: "1rem", pt: { md: "5rem", xs: "3rem" } }}>
      <Grid item container columnSpacing={2} rowSpacing={2}>
        <Grid item md={4} sx={{ display: { xs: "none", md: "block" } }} />
        <Grid item md={4} xs={12}>
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
              <Box className="flex ai-c fj-sb">
                <TextField
                  value={depositAmount}
                  onChange={(e) => handleAmountChange(e.target.value, 0)}
                  variant="standard"
                  placeholder="0"
                  sx={{ mr: "0.5rem" }}
                  InputProps={{
                    disableUnderline: true,
                    sx: { fontSize: "2rem" },
                  }}
                />
                <Select
                  value={depositAsset}
                  displayEmpty
                  renderValue={renderPlaceholder(
                    underlyingTokens.length === 0 || depositAsset.length === 0,
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
                        <Box className="flex ai-c">
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
              <Box className="flex ai-c fj-sb">
                <Typography color="gray">${Number(depositAmount)}</Typography>
                <Typography className="flex ai-c" color="gray">
                  Balance:{" "}
                  {(+utils.formatUnits(
                    depositBalance,
                    depositDecimals
                  )).toFixed(4)}
                  &nbsp;
                  <Typography
                    onClick={setMaxDeposit}
                    color="white"
                    sx={{ cursor: "pointer" }}
                  >
                    MAX
                  </Typography>
                </Typography>
              </Box>
            </Box>
            <Box
              sx={{
                p: "0.5rem 1rem",
                my: "0.5rem",
                borderRadius: "1rem",
                border: "1px solid gray",
              }}
            >
              <Box className="flex ai-c fj-sb">
                <Box className="flex ai-c">
                  <Typography
                    color="gray"
                    sx={{ minWidth: "5rem", maxWidth: "5rem", mr: "0.5rem" }}
                  >
                    Current Balance{" "}
                  </Typography>
                  <TextField
                    disabled
                    value={positionBalance.toFixed(6)}
                    variant="standard"
                    placeholder="0"
                    InputProps={{
                      disableUnderline: true,
                      sx: { fontSize: "2rem" },
                    }}
                  />
                </Box>
                <Select
                  value={yieldToken}
                  displayEmpty
                  renderValue={renderPlaceholder(
                    yieldTokens.length === 0 || yieldToken < 0,
                    "Select yield strategy"
                  )}
                  onChange={(e) => setYieldToken(e.target.value)}
                  variant="standard"
                  sx={{ background: "transparent" }}
                >
                  {yieldTokens.map((symbol, index) => (
                    <MenuItem value={index} key={`yield-${index}`}>
                      <Box className="flex ai-c">
                        <Typography>{symbol}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            </Box>
            <Box className="flex ai-c fj-c">
              <Button
                variant="standard"
                sx={{ color: "white", alignSelf: "center" }}
                disabled={!showLoans && depositAsset === "ETH"}
                onClick={() => setShowLoans(!showLoans)}
              >
                {showLoans ? <ExpandLessOutlined /> : <ExpandMoreOutlined />}
              </Button>
            </Box>
            {showLoans && (
              <Box
                sx={{
                  p: "0.5rem 1rem",
                  my: "0.5rem",
                  borderRadius: "1rem",
                  border: "1px solid gray",
                }}
              >
                <Box className="flex ai-c fj-sb">
                  <TextField
                    value={loanAmount}
                    onChange={(e) => handleAmountChange(e.target.value, 1)}
                    variant="standard"
                    placeholder="0"
                    sx={{ mr: "0.5rem" }}
                    InputProps={{
                      disableUnderline: true,
                      sx: { fontSize: "2rem" },
                    }}
                  />
                  <Select
                    value={loanAsset}
                    displayEmpty
                    renderValue={renderPlaceholder(
                      loanAssets.length === 0 || loanAsset.length === 0,
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
                          <Box className="flex ai-c">
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
                <Box className="flex ai-c fj-sb">
                  <Typography color="gray">${Number(loanAmount)}</Typography>
                  <Typography className="flex ai-c" color="gray">
                    Borrowable Limit:{" "}
                    {(+utils.formatUnits(
                      maximumAmount,
                      depositDecimals
                    )).toFixed(4)}
                    &nbsp;
                    <Typography
                      onClick={setMaxBorrow}
                      color="white"
                      sx={{ cursor: "pointer" }}
                    >
                      MAX
                    </Typography>
                  </Typography>
                </Box>
              </Box>
            )}
            <Button
              className="w100"
              sx={{
                background: "white",
                borderRadius: "1rem",
                color: "black",
                fontSize: "20px",
                mt: "0.5rem",
                ":hover": { background: "lightgray" },
              }}
              variant="contained"
              disabled={shouldDisable}
              onClick={handleDeposit}
            >
              {isPending ? (
                <CircularProgress size="1.75rem" />
              ) : connected ? (
                depositBalanceInsufficient ? (
                  "Insufficient Balance"
                ) : depositAllowanceInsufficient ? (
                  `Approve ${depositAsset}`
                ) : !showLoans ? (
                  "Deposit"
                ) : loanAmountExceedsLimit ? (
                  "Exceed Maximum Mintable Amount"
                ) : (
                  "Deposit & Borrow"
                )
              ) : (
                "Connect Wallet"
              )}
            </Button>
          </Box>
        </Grid>
        <Grid item md={4} sx={{ display: { xs: "none", md: "block" } }} />
      </Grid>
    </Box>
  );
};
