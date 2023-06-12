export const addressEllipsis = (address, length = 4) => {
  if (!address) return "";
  if (!address.startsWith("0x")) address = "0x" + address;

  if (address.length <= length * 2 + 2) return address;
  return `${address.slice(0, length + 2)}...${address.slice(
    address.length - length
  )}`;
};
