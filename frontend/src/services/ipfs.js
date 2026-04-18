import { IPFS_GATEWAY } from "../config";

const JWT = import.meta.env.VITE_PINATA_JWT;

/**
 * Uploads post content as JSON to IPFS via Pinata.
 * Returns the Content Identifier (CID) — this CID is what gets written on-chain.
 * Any change to the content produces a different CID, making tampering immediately detectable.
 */
export async function uploadToIPFS(text) {
  const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT}`,
    },
    body: JSON.stringify({
      pinataContent:  { text },
      pinataMetadata: { name: `chainpost-${Date.now()}` },
    }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`IPFS upload failed: ${err}`);
  }
  const data = await response.json();
  return data.IpfsHash; // e.g. "QmXyz..."
}

/**
 * Fetches and parses content stored at an IPFS CID.
 * Falls back to a placeholder if the gateway is unreachable.
 */
export async function fetchFromIPFS(cid) {
  if (!cid) return { text: "" };
  try {
    const response = await fetch(`${IPFS_GATEWAY}${cid}`, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return { text: `[Content unavailable — CID: ${cid.slice(0, 12)}…]` };
    const data = await response.json();
    // Support both {text:...} and {pinataContent:{text:...}} shapes
    return data.pinataContent ?? data;
  } catch {
    return { text: `[Gateway timeout — CID: ${cid.slice(0, 12)}…]` };
  }
}
