import { createTheme } from "@mui/material/styles";
import styled from "styled-components";

export const TokenIcon = styled.img`
  width: 20px;
  height: 20px;
`;

export const theme = createTheme({
  typography: {
    button: { textTransform: "none" },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "10px",
          fontWeight: "bold",
          ":hover": {
            backgroundColor: "inherit",
          },
        },
      },
    },
    MuiGrid: {
      styleOverrides: {
        root: {
          margin: "0 !important",
          width: "100%",
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        input: {
          color: "white",
          background: "transparent",
          ":disabled": {
            "-webkit-text-fill-color": "gray",
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          "::after": { border: "none !important" },
          "::before": { border: "none !important" },
          padding: "0.25rem 0.5rem",
          border: "1px solid white",
          borderRadius: "1rem",
        },
        icon: { fill: "white" },
      },
    },
  },
});
