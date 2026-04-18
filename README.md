# ChainPost
Blockchain-based data governance for social media

# ChainPost 🔗
> Blockchain-based Social Media with User-Owned Content

A decentralised social media prototype where users retain full ownership 
of their content through blockchain technology. Built with Solidity, 
Hardhat, and ReactJS.

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
↓
Frontend (ReactJS + ethers.js)
↓
Smart Contracts (Solidity + Hardhat)
├── PostRegistry.sol
├── EditHistory.sol
└── AccessControl.sol
↓
IPFS (Pinata) — Content Storage
↓
Ethereum Sepolia Testnet

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contract | Solidity ^0.8.20 |
| Development Framework | Hardhat |
| Frontend | ReactJS + ethers.js |
| Storage | IPFS (Pinata API) |
| Network | Ethereum Sepolia Testnet |

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
| PostRegistry | `여기에_배포주소` |
| EditHistory | `여기에_배포주소` |
| AccessControl | `여기에_배포주소` |

🔍 Verify on [Sepolia Etherscan](https://sepolia.etherscan.io)

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MetaMask browser extension
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/khancho-sudo/ChainPost.git
cd ChainPost

# Install dependencies
npm install
```

### Environment Setup
Create a `.env` file in the root directory:
SEPOLIA_RPC_URL=your_alchemy_rpc_url
PRIVATE_KEY=your_metamask_private_key

### Run Tests
```bash
npx hardhat test
```

### Deploy to Sepolia
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

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
| Frontend | ReactJS, ethers.js, UI/UX |

---

## 📚 References
- [Hardhat Documentation](https://hardhat.org/docs)
- [ethers.js Documentation](https://docs.ethers.org)
- [IPFS Documentation](https://docs.ipfs.tech)
- [Sepolia Etherscan](https://sepolia.etherscan.io)