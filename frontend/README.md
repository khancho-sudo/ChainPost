# ChainPost — Blockchain-Based Social Media Frontend

A decentralised social media prototype where users own their content.  
Built with **React 18 + Vite + ethers.js v6**, connected to three Solidity smart contracts on **Ethereum Sepolia Testnet**.

---

## Live Demo

Deployed on Vercel: https://chainpost.vercel.app  
GitHub: https://github.com/khancho-sudo/ChainPost

---

## Architecture

```
User (MetaMask wallet)
        │
        ▼
  React Frontend (Vite)
        │
        ├── IPFS / Pinata  ←  post content stored here (off-chain)
        │                      returns CID (Content Identifier)
        │
        └── Ethereum Sepolia Testnet
                ├── PostRegistry.sol   ← CID + author + timestamp on-chain
                ├── EditHistory.sol    ← version history per post
                └── AccessControl.sol ← per-post visibility settings
```

**Why hybrid storage?** Full text on Ethereum = prohibitive gas fees.  
Only the 46–59 byte IPFS CID is written on-chain. Any content change produces a different CID — tampering is immediately detectable.

---

## Deployed Contracts (Sepolia Testnet)

| Contract | Address |
|----------|---------|
| PostRegistry | `0x864c74902D07d0Ae1b80E48038E65D39DC761434` |
| EditHistory | `0xDaBFB8116eaB9aec05CB0885e683911B7F22FFA1` |
| AccessControl | `0x0c69dcF42B358D4E7993e06A0AE9322Cbe5AeD45` |

View on Etherscan: https://sepolia.etherscan.io

---

## Four Core Features

| # | Feature | What It Demonstrates |
|---|---------|---------------------|
| 1 | **Wallet Login** | MetaMask address = identity; no username/password stored |
| 2 | **On-Chain Verifier** | TX hash, block number, contract address, IPFS CID per post |
| 3 | **Edit History** | Immutable version chain on EditHistory.sol — full audit trail |
| 4 | **Real-time TX Feedback** | 3-step status: IPFS upload → wallet signature → block confirmed |

---

## Setup & Run

### Prerequisites
- Node.js v18+
- MetaMask browser extension (set to **Sepolia** testnet)
- Pinata account (free): https://pinata.cloud
- Sepolia test ETH (free faucet): https://sepoliafaucet.com

### Install

```bash
git clone https://github.com/khancho-sudo/ChainPost.git
cd ChainPost/frontend
npm install
```

### Environment Variables

```bash
cp .env.example .env
```

Open `.env` and set your Pinata JWT token:

```
VITE_PINATA_JWT=your_pinata_jwt_here
```

Get your JWT: https://app.pinata.cloud/keys → **Create New Key** → copy JWT.

### Run Locally

```bash
npm run dev
# Open http://localhost:5173
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel
# Set VITE_PINATA_JWT in Vercel dashboard → Settings → Environment Variables
```

---

## Project Structure

```
src/
├── abi/                    # Smart contract ABIs
│   ├── PostRegistry.json
│   ├── EditHistory.json
│   └── AccessControl.json
├── components/
│   ├── Navbar.jsx          # Sticky header with wallet connection status
│   ├── CreatePost.jsx      # Compose → IPFS upload → contract write
│   ├── PostCard.jsx        # Post display, on-chain verifier, edit/delete
│   ├── HistoryPanel.jsx    # Slide-in version history panel
│   └── TxFeedback.jsx      # Fixed bottom 3-step transaction status bar
├── hooks/
│   ├── useWallet.js        # MetaMask connection + account/chain listeners
│   └── useContracts.js     # ethers.Contract factory (read-only & signer)
├── services/
│   └── ipfs.js             # Pinata upload + IPFS gateway fetch
├── config.js               # Contract addresses, chain ID, visibility enum
└── App.jsx                 # State management, event fetching, action handlers
```

---

## Data Governance Alignment

| SNS Failure | ChainPost Solution |
|-------------|-------------------|
| **Data Ownership** — platforms monetise content without consent | Author address + CID registered on-chain; only the private key holder can manage the post |
| **Unilateral Deletion** — no transparency or appeal | Soft-delete records that the post existed; CID stays on-chain forever as proof of prior existence |
| **Opaque Edit History** — silent content modification | Every edit appended to EditHistory.sol; all past versions are publicly verifiable by anyone |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite |
| Blockchain client | ethers.js v6 |
| Smart contracts | Solidity, Hardhat (see `/contracts`) |
| Content storage | IPFS via Pinata |
| Network | Ethereum Sepolia Testnet |
| Hosting | Vercel |
