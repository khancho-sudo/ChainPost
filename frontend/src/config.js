// ChainPost — Contract configuration
// Deployed on Ethereum Sepolia Testnet

export const CONTRACTS = {
  PostRegistry:  "0x864c74902D07d0Ae1b80E48038E65D39DC761434",
  EditHistory:   "0xDaBFB8116eaB9aec05CB0885e683911B7F22FFA1",
  AccessControl: "0x0c69dcF42B358D4E7993e06A0AE9322Cbe5AeD45",
};

export const SEPOLIA_CHAIN_ID = "0xaa36a7"; // 11155111

export const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

// Visibility enum matches AccessControl.sol
export const VISIBILITY = { Public: 0, FollowersOnly: 1, Private: 2 };
export const VISIBILITY_LABELS = ["Public", "Followers Only", "Private"];
