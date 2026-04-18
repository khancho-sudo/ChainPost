# ChainPost 🔗
> Blockchain-Based Data Governance for Social Media

A decentralised social media prototype where users retain full ownership
of their content through blockchain technology. Built with Solidity,
Hardhat, and React 18 + Vite.

**Live Application:** https://chainpost.vercel.app  
**GitHub:** https://github.com/khancho-sudo/ChainPost  
**Course:** Blockchain for Data Governance | Group 1

---

## 🚨 Problem

Current social media platforms suffer from three critical data governance failures:

| # | Problem | Impact |
|---|---------|--------|
| 1 | **Data Ownership** | Platforms monetise user content without consent |
| 2 | **Unilateral Deletion** | Posts removed without notice or appeal |
| 3 | **No Edit Transparency** | Content altered silently with no audit trail |

---

## 💡 Solution

ChainPost uses blockchain to give users direct control over their content:

- **Wallet Login** — Identity via MetaMask wallet, no username/password
- **On-chain Verification** — Every post registered with Transaction Hash & Block Number
- **Edit History** — All edits recorded as immutable version chain
- **Real-time Feedback** — Live transaction status during blockchain interaction

---

## 🏗️ System Architecture
User (MetaMask Wallet)
│
▼
React Frontend (Vite + ethers.js v6)
│
├── IPFS / Pinata  ←  post content stored here (off-chain)
│                      returns CID (Content Identifier)
│
└── Ethereum Sepolia Testnet
├── PostRegistry.sol   ← CID + author + timestamp on-chain
├── EditHistory.sol    ← version history per post
└── AccessControl.sol ← per-post visibility settings

**Why hybrid storage?** Full text on Ethereum = prohibitive gas fees.
Only the 46–59 byte IPFS CID is written on-chain. Any content change
produces a different CID — tampering is immediately detectable.

---

## 📁 Folder Structure
ChainPost/
├── contracts/              Solidity smart contracts (3 files)
│   ├── PostRegistry.sol    Post registration and soft-delete
│   ├── EditHistory.sol     Immutable version history per post
│   └── AccessControl.sol   Per-post visibility control
├── test/
│   └── ChainPost.test.js   7 unit tests (Hardhat + Chai)
├── scripts/
│   └── deploy.js           Deployment script for Sepolia
├── hardhat.config.js       Hardhat configuration
├── package.json            Backend dependencies
└── frontend/               React 18 + Vite frontend
├── src/
│   ├── abi/            Contract ABIs for ethers.js
│   ├── components/     UI components (Navbar, PostCard, etc.)
│   ├── hooks/          useWallet, useContracts
│   ├── services/       IPFS / Pinata integration
│   ├── App.jsx         Main app shell
│   └── config.js       Contract addresses (Sepolia)
├── .env.example        Environment variable template
└── README.md           Frontend setup instructions

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contract | Solidity ^0.8.20 |
| Development Framework | Hardhat |
| Frontend | React 18, Vite |
| Blockchain Client | ethers.js v6 |
| Storage | IPFS (Pinata API) |
| Network | Ethereum Sepolia Testnet |
| Hosting | Vercel |

---

## 📄 Smart Contracts

### PostRegistry.sol
Registers posts on-chain. Stores author wallet address, IPFS CID, and
timestamp. Supports soft-delete — records are never erased.

**Key Functions:**
- `createPost(ipfsCid)` — Register a new post
- `deletePost(postId)` — Soft-delete a post
- `getPost(postId)` — Retrieve post metadata
- `getPostsByAuthor(address)` — Get all posts by a wallet

### EditHistory.sol
Tracks every edit as an immutable version chain. Version 0 is always
the original.

**Key Functions:**
- `recordOriginal(postId, ipfsCid)` — Record original version
- `editPost(postId, newCid, editNote)` — Append new version
- `getHistory(postId)` — Get full version history
- `getVersion(postId, versionNumber)` — Get specific version

### AccessControl.sol
Manages per-post visibility. Only the original author can change settings.
All changes logged on-chain.

**Key Functions:**
- `setVisibility(postId, visibility)` — Set Public/FollowersOnly/Private
- `getVisibility(postId)` — Get current visibility

---

## 📦 Deployed Contracts (Sepolia Testnet)

| Contract | Address |
|----------|---------|
| PostRegistry | `0x864c74902D07d0Ae1b80E48038E65D39DC761434` |
| EditHistory | `0xDaBFB8116eaB9aec05CB0885e683911B7F22FFA1` |
| AccessControl | `0x0c69dcF42B358D4E7993e06A0AE9322Cbe5AeD45` |

🔍 Verify on [Sepolia Etherscan](https://sepolia.etherscan.io)

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MetaMask browser extension (set to **Sepolia** testnet)
- Pinata account (free): https://pinata.cloud
- Sepolia test ETH: https://sepolia-faucet.pk910.de

### Backend (Contracts)

```bash
git clone https://github.com/khancho-sudo/ChainPost.git
cd ChainPost
npm install
```

Create a `.env` file in the root directory:
SEPOLIA_RPC_URL=your_alchemy_rpc_url
PRIVATE_KEY=your_metamask_private_key

```bash
npx hardhat test                                          # Run tests
npx hardhat run scripts/deploy.js --network sepolia       # Deploy
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env    # Add your Pinata JWT
npm run dev             # Open http://localhost:5173
```

See `frontend/README.md` for full frontend setup instructions.

---

## ✅ Test Results

| Test Case | Result |
|-----------|--------|
| Should allow a user to create a post | ✅ Pass |
| Should prevent non-authors from deleting a post | ✅ Pass |
| Should allow the author to soft-delete a post | ✅ Pass |
| Should record the original version of a post | ✅ Pass |
| Should append a new version when a post is edited | ✅ Pass |
| Should allow the author to set post visibility | ✅ Pass |
| Should prevent non-authors from changing post visibility | ✅ Pass |

**7/7 tests passing**

---

## 👥 Team

| Role | Responsibility |
|------|---------------|
| Backend | Smart Contracts, Hardhat, Deployment |
| Frontend | React 18 + Vite, ethers.js, UI/UX |

---

## 📚 References
- [Hardhat Documentation](https://hardhat.org/docs)
- [ethers.js Documentation](https://docs.ethers.org)
- [IPFS Documentation](https://docs.ipfs.tech)
- [Sepolia Etherscan](https://sepolia.etherscan.io)
- [Pinata](https://pinata.cloud)