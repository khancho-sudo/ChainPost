import { useState } from "react";
import { VISIBILITY_LABELS } from "../config";

/** Truncate an Ethereum address for display */
function fmtAddr(addr) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/** Format a Unix timestamp as a readable date */
function fmtDate(ts) {
  return new Date(ts * 1000).toLocaleString("en-AU", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/**
 * PostCard — displays a single blockchain-registered post with:
 *   - On-chain verifier (tx hash, block #, contract address, IPFS CID)
 *   - Edit history trigger
 *   - Edit / Delete controls (owner only)
 *   - Visibility selector (owner only)
 */
export default function PostCard({
  post,
  walletAddress,
  showVerifier,
  onToggleVerifier,
  onShowHistory,
  onDelete,
  onEdit,
  onSetVisibility,
  readContracts,
  disabled,
}) {
  const [editing, setEditing]       = useState(false);
  const [editText, setEditText]     = useState("");
  const [editNote, setEditNote]     = useState("");
  const [visibility, setVisibility] = useState(null);
  const [loadingVis, setLoadingVis] = useState(false);

  const isOwner =
    walletAddress &&
    post.author.toLowerCase() === walletAddress.toLowerCase();

  // Lazy-load visibility from AccessControl contract
  async function loadVisibility() {
    if (visibility !== null || !readContracts.accessControl) return;
    setLoadingVis(true);
    try {
      const v = await readContracts.accessControl.getVisibility(post.postId);
      setVisibility(Number(v));
    } catch {
      setVisibility(0);
    } finally {
      setLoadingVis(false);
    }
  }

  function startEdit() {
    setEditText(post.content?.text ?? "");
    setEditNote("");
    setEditing(true);
  }

  async function submitEdit() {
    if (!editText.trim()) return;
    await onEdit(editText.trim(), editNote.trim() || "Edited");
    setEditing(false);
  }

  async function changeVisibility(v) {
    const n = Number(v);
    setVisibility(n);
    await onSetVisibility(n);
  }

  return (
    <article className={`post-card${post.deleted ? " post-card--deleted" : ""}`}>
      {/* ── Meta ── */}
      <div className="post-meta">
        <a
          className="post-author"
          href={`https://sepolia.etherscan.io/address/${post.author}`}
          target="_blank"
          rel="noreferrer"
          title={post.author}
        >
          {fmtAddr(post.author)}
        </a>
        {post.deleted && (
          <span className="post-badge post-badge--deleted">Soft-Deleted</span>
        )}
        <span className="post-time">{fmtDate(post.createdAt)}</span>
      </div>

      {/* ── Content ── */}
      {post.loading ? (
        <div className="post-loading">Fetching content from IPFS…</div>
      ) : (
        <div className="post-content">
          {post.deleted && (
            <p className="post-deleted-notice">
              This post has been soft-deleted. Its CID remains on-chain as permanent proof
              of prior existence — the record can never be erased.
            </p>
          )}
          <p className={post.deleted ? "post-text--faded" : "post-text"}>
            {post.content?.text}
          </p>
        </div>
      )}

      {/* ── Edit form ── */}
      {editing && (
        <div className="edit-form">
          <textarea
            className="edit-input"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={4}
            aria-label="Edit post content"
          />
          <input
            className="edit-note-input"
            value={editNote}
            onChange={(e) => setEditNote(e.target.value)}
            placeholder="Edit note (optional, e.g. 'Fixed typo')"
            aria-label="Edit note"
          />
          <div className="edit-actions">
            <button className="btn-secondary" onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={submitEdit}
              disabled={disabled || !editText.trim()}
            >
              Save Edit On-Chain
            </button>
          </div>
        </div>
      )}

      {/* ── Action bar ── */}
      <div className="post-actions">
        <button
          className={`post-action${showVerifier ? " post-action--active" : ""}`}
          onClick={onToggleVerifier}
        >
          {showVerifier ? "Hide Details" : "On-Chain Details"}
        </button>

        <button className="post-action" onClick={onShowHistory}>
          History
        </button>

        {isOwner && !post.deleted && !editing && (
          <>
            <button
              className="post-action"
              onClick={startEdit}
              disabled={disabled}
            >
              Edit
            </button>
            <button
              className="post-action post-action--danger"
              onClick={() => {
                if (window.confirm("Soft-delete this post? The CID stays on-chain forever.")) {
                  onDelete();
                }
              }}
              disabled={disabled}
            >
              Delete
            </button>
          </>
        )}

        {isOwner && !post.deleted && (
          <select
            className="visibility-select"
            value={visibility ?? ""}
            onChange={(e) => changeVisibility(e.target.value)}
            onFocus={loadVisibility}
            disabled={loadingVis || disabled}
            aria-label="Post visibility"
          >
            {visibility === null && <option value="">Visibility…</option>}
            {VISIBILITY_LABELS.map((label, i) => (
              <option key={i} value={i}>{label}</option>
            ))}
          </select>
        )}
      </div>

      {/* ── Blockchain verifier panel ── */}
      {showVerifier && (
        <div className="verifier-panel" aria-label="Blockchain proof">
          <div className="verifier-header">
            <span className="verifier-stamp">Verified On-Chain</span>
          </div>

          <div className="verifier-row">
            <span className="verifier-label">Tx Hash</span>
            <a
              className="verifier-value"
              href={`https://sepolia.etherscan.io/tx/${post.txHash}`}
              target="_blank"
              rel="noreferrer"
            >
              {post.txHash}
            </a>
          </div>

          <div className="verifier-row">
            <span className="verifier-label">Block Number</span>
            <span className="verifier-value">{post.blockNumber?.toLocaleString()}</span>
          </div>

          <div className="verifier-row">
            <span className="verifier-label">Contract</span>
            <a
              className="verifier-value"
              href={`https://sepolia.etherscan.io/address/${post.author}`}
              target="_blank"
              rel="noreferrer"
            >
              {post.author}
            </a>
          </div>

          <div className="verifier-row">
            <span className="verifier-label">IPFS CID</span>
            <a
              className="verifier-value"
              href={`https://gateway.pinata.cloud/ipfs/${post.ipfsCid}`}
              target="_blank"
              rel="noreferrer"
            >
              {post.ipfsCid}
            </a>
          </div>
        </div>
      )}
    </article>
  );
}
