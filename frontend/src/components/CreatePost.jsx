import { useState } from "react";

const MAX_CHARS = 500;

/**
 * CreatePost — compose and publish a new post.
 * On submit: content is uploaded to IPFS, then the CID is written to
 * the PostRegistry smart contract on Ethereum.
 */
export default function CreatePost({ onSubmit, disabled }) {
  const [text, setText] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled || trimmed.length > MAX_CHARS) return;
    await onSubmit(trimmed);
    setText("");
  }

  const remaining = MAX_CHARS - text.length;

  return (
    <form className="create-post" onSubmit={handleSubmit} noValidate>
      <div className="create-post-header">
        <span className="create-post-label">New Post</span>
        <span className={`char-count${remaining < 50 ? " char-count--warn" : ""}`}>
          {text.length} / {MAX_CHARS}
        </span>
      </div>

      <textarea
        className="create-post-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What's on your mind? Your content will be stored on IPFS and its hash registered immutably on Ethereum."
        maxLength={MAX_CHARS}
        rows={4}
        disabled={disabled}
        aria-label="Post content"
      />

      <div className="create-post-footer">
        <span className="create-post-hint">
          Publishing creates a permanent, immutable blockchain record.
        </span>
        <button
          className="btn-primary"
          type="submit"
          disabled={!text.trim() || disabled || text.length > MAX_CHARS}
        >
          Publish On-Chain
        </button>
      </div>
    </form>
  );
}
