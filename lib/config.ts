export const MARKETPLACE_CONFIG = {
  // Your Wallet Address
  recipientAddress: "0xa6dee9fde9e1203ad02228f00bf10235d9ca3752",

  // Token Identifiers (CAIP-19)
  tokens: {
    baseUsdc: "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },

  // Prices (in atomic units, 6 decimals for USDC)
  prices: {
    listingUsdc: "5000000",   // $5.00
    featuredUsdc: "50000000", // $50.00
  },

  // Display Text
  labels: {
    listingPrice: "$5.00 USDC",
    featuredPrice: "$50.00 USDC",
  }
};