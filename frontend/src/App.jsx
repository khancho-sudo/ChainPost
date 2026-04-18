import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useWallet } from "./hooks/useWallet";
import { useContracts } from "./hooks/useContracts";
import { uploadToIPFS, fetchFromIPFS } from "./services/ipfs";
import { CONTRACTS } from "./config";
import Navbar from "./components/Navbar";
import CreatePost from "./components/CreatePost";
import PostCard from "./components/PostCard";
import HistoryPanel from "./components/HistoryPanel";
import TxFeedback from "./components/TxFeedback";
import PostRegistryABI from "./abi/PostRegistry.json";
import "./App.css";

// Read-only provider — Ankr public endpoint is more reliable than rpc.sepolia.org
const READ_PROVIDER = new ethers.JsonRpcProvider(
  "https://rpc.ankr.com/eth_sepolia",
);

export default function App() {
  const wallet = useWallet();

  // Use signer for writes, read-only provider as fallback for reads
  const contracts = useContracts(wallet.signer ?? READ_PROVIDER);
  const readContracts = useContracts(READ_PROVIDER);

  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [txStatus, setTxStatus] = useState(null); // { step, message }
  const [historyPostId, setHistoryPostId] = useState(null);
  const [expandedVerifier, setExpandedVerifier] = useState(null);

  // ── Load all posts from blockchain events ──────────────────────────────
  const loadPosts = useCallback(async () => {
    if (!readContracts.postRegistry) return;
    setLoadingPosts(true);
    try {
      const postFilter = readContracts.postRegistry.filters.PostCreated();
      const deleteFilter = readContracts.postRegistry.filters.PostDeleted();

      const [events, deleteEvents] = await Promise.all([
        readContracts.postRegistry.queryFilter(postFilter, -50000),
        readContracts.postRegistry.queryFilter(deleteFilter, -50000),
      ]);

      const deletedIds = new Set(deleteEvents.map((e) => e.args.postId));

      const rawPosts = events
        .map((e) => ({
          postId: e.args.postId,
          author: e.args.author,
          ipfsCid: e.args.ipfsCid,
          createdAt: Number(e.args.createdAt),
          txHash: e.transactionHash,
          blockNumber: e.blockNumber,
          deleted: deletedIds.has(e.args.postId),
          content: null,
          loading: true,
        }))
        .sort((a, b) => b.createdAt - a.createdAt); // newest first

      setPosts(rawPosts);

      // Fetch IPFS content for each post asynchronously
      rawPosts.forEach(async (post, i) => {
        const content = await fetchFromIPFS(post.ipfsCid);
        setPosts((prev) =>
          prev.map((p, j) => (j === i ? { ...p, content, loading: false } : p)),
        );
      });
    } catch (err) {
      // Surface error to user rather than silently failing
      setTxStatus({
        step: "error",
        message: `Failed to load posts: ${err.message}`,
      });
      setTimeout(() => setTxStatus(null), 5000);
    } finally {
      setLoadingPosts(false);
    }
  }, [readContracts.postRegistry]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // ── Create post ────────────────────────────────────────────────────────
  async function handleCreatePost(text) {
    if (!wallet.isConnected) return;
    try {
      setTxStatus({
        step: 1,
        message: "Uploading content to IPFS via Pinata…",
      });
      const cid = await uploadToIPFS(text);

      setTxStatus({
        step: 2,
        message: "Step 1: Requesting wallet signature… (MetaMask will open)",
      });
      const tx = await contracts.postRegistry.createPost(cid);

      setTxStatus({
        step: 3,
        message: "Step 2: Sending to blockchain network… (usually 15–30 s)",
      });
      const receipt = await tx.wait();

      // Also record v0 in EditHistory for full audit trail
      const iface = new ethers.Interface(PostRegistryABI.abi);
      const parsed = receipt.logs
        .map((l) => {
          try {
            return iface.parseLog(l);
          } catch {
            return null;
          }
        })
        .find((l) => l?.name === "PostCreated");
      if (parsed) {
        await contracts.editHistory.recordOriginal(parsed.args.postId, cid);
      }

      setTxStatus({
        step: "done",
        message:
          "Step 3: Block confirmed! Your post is permanently on the blockchain. ✓",
      });
      setTimeout(() => setTxStatus(null), 4000);
      loadPosts();
    } catch (err) {
      setTxStatus({
        step: "error",
        message:
          err.code === "ACTION_REJECTED"
            ? "Cancelled — you rejected the MetaMask transaction."
            : err.message,
      });
      setTimeout(() => setTxStatus(null), 5000);
    }
  }

  // ── Soft-delete post ───────────────────────────────────────────────────
  async function handleDeletePost(postId) {
    if (!wallet.isConnected) return;
    try {
      setTxStatus({ step: 2, message: "Step 1: Requesting wallet signature…" });
      const tx = await contracts.postRegistry.deletePost(postId);
      setTxStatus({
        step: 3,
        message:
          "Step 2: Recording soft-delete on blockchain… (CID stays on-chain forever)",
      });
      await tx.wait();
      setTxStatus({
        step: "done",
        message:
          "Step 3: Soft-deleted. The IPFS CID remains on-chain as permanent proof of prior existence. ✓",
      });
      setTimeout(() => setTxStatus(null), 5000);
      loadPosts();
    } catch (err) {
      setTxStatus({
        step: "error",
        message: err.code === "ACTION_REJECTED" ? "Cancelled." : err.message,
      });
      setTimeout(() => setTxStatus(null), 3000);
    }
  }

  // ── Edit post ──────────────────────────────────────────────────────────
  async function handleEditPost(postId, text, note) {
    if (!wallet.isConnected) return;
    try {
      setTxStatus({ step: 1, message: "Uploading updated content to IPFS…" });
      const newCid = await uploadToIPFS(text);

      setTxStatus({ step: 2, message: "Step 1: Requesting wallet signature…" });
      const tx = await contracts.editHistory.editPost(
        postId,
        newCid,
        note || "Edited",
      );

      setTxStatus({
        step: 3,
        message: "Step 2: Writing new version to blockchain…",
      });
      await tx.wait();

      setTxStatus({
        step: "done",
        message: "Step 3: Edit recorded. Version history updated on-chain. ✓",
      });
      setTimeout(() => setTxStatus(null), 4000);
      loadPosts();
    } catch (err) {
      setTxStatus({
        step: "error",
        message: err.code === "ACTION_REJECTED" ? "Cancelled." : err.message,
      });
      setTimeout(() => setTxStatus(null), 3000);
    }
  }

  // ── Set visibility ─────────────────────────────────────────────────────
  async function handleSetVisibility(postId, visibility) {
    if (!wallet.isConnected) return;
    try {
      setTxStatus({
        step: 2,
        message: "Step 1: Requesting signature to update visibility…",
      });
      const tx = await contracts.accessControl.setVisibility(
        postId,
        visibility,
      );
      setTxStatus({ step: 3, message: "Step 2: Confirming on blockchain…" });
      await tx.wait();
      setTxStatus({
        step: "done",
        message: "Step 3: Visibility updated on-chain. ✓",
      });
      setTimeout(() => setTxStatus(null), 3000);
    } catch (err) {
      setTxStatus({
        step: "error",
        message: err.code === "ACTION_REJECTED" ? "Cancelled." : err.message,
      });
      setTimeout(() => setTxStatus(null), 3000);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="app">
      <Navbar wallet={wallet} />

      <main className="main">
        <div className="container">
          {wallet.isConnected ? (
            <CreatePost onSubmit={handleCreatePost} disabled={!!txStatus} />
          ) : (
            <div className="connect-prompt">
              <p>
                Connect your MetaMask wallet to publish posts on the Ethereum
                blockchain.
              </p>
              <button className="btn-primary" onClick={wallet.connect}>
                Connect Wallet
              </button>
            </div>
          )}

          <section className="feed">
            <div className="feed-header">
              <h2>On-Chain Feed</h2>
              <span className="feed-meta">
                All posts registered on Ethereum Sepolia Testnet
              </span>
            </div>

            {loadingPosts && (
              <div className="loading-state">
                Fetching posts from blockchain…
              </div>
            )}

            {!loadingPosts && posts.length === 0 && (
              <div className="empty-state">
                No posts yet. Connect your wallet and be the first to publish
                on-chain.
              </div>
            )}

            {posts.map((post, i) => (
              <PostCard
                key={post.postId}
                post={post}
                walletAddress={wallet.address}
                showVerifier={expandedVerifier === post.postId}
                onToggleVerifier={() =>
                  setExpandedVerifier((v) =>
                    v === post.postId ? null : post.postId,
                  )
                }
                onShowHistory={() => setHistoryPostId(post.postId)}
                onDelete={() => handleDeletePost(post.postId)}
                onEdit={(text, note) => handleEditPost(post.postId, text, note)}
                onSetVisibility={(v) => handleSetVisibility(post.postId, v)}
                readContracts={readContracts}
                disabled={!!txStatus}
              />
            ))}
          </section>
        </div>
      </main>

      {historyPostId && (
        <HistoryPanel
          postId={historyPostId}
          contracts={readContracts}
          onClose={() => setHistoryPostId(null)}
        />
      )}

      {txStatus && <TxFeedback status={txStatus} />}
    </div>
  );
}
