import { useEffect, useState } from "react";
import { fetchFromIPFS } from "../services/ipfs";

function fmtDate(ts) {
  return new Date(Number(ts) * 1000).toLocaleString("en-AU", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/**
 * HistoryPanel — slide-in panel showing all on-chain versions of a post.
 * Version history is stored cumulatively on EditHistory.sol and cannot be
 * altered — this demonstrates full transparency and audit trail, a core
 * data governance principle.
 */
export default function HistoryPanel({ postId, contracts, onClose }) {
  const [versions, setVersions]   = useState([]);
  const [contents, setContents]   = useState({});
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    if (!postId || !contracts.editHistory) return;
    setLoading(true);
    setError(null);

    contracts.editHistory
      .getHistory(postId)
      .then(async (raw) => {
        const parsed = raw.map((v) => ({
          versionNumber: Number(v.versionNumber),
          ipfsCid:       v.ipfsCid,
          editNote:      v.editNote,
          timestamp:     Number(v.timestamp),
        }));
        setVersions(parsed);

        // Fetch IPFS content for every version in parallel
        const results = await Promise.all(parsed.map((v) => fetchFromIPFS(v.ipfsCid)));
        const map = {};
        parsed.forEach((v, i) => { map[v.versionNumber] = results[i]; });
        setContents(map);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [postId, contracts.editHistory]);

  return (
    <>
      <div className="panel-overlay" onClick={onClose} />
      <aside className="history-panel" aria-label="Edit History">
        <div className="history-panel-header">
          <div>
            <h3>Edit History</h3>
            <span className="history-subtitle">
              All versions immutably recorded on-chain · cannot be altered or deleted
            </span>
          </div>
          <button className="panel-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {loading && (
          <div className="history-loading">Loading version history from blockchain…</div>
        )}

        {error && (
          <div className="history-loading" style={{ color: "var(--danger)" }}>
            Error: {error}
          </div>
        )}

        {!loading && !error && versions.length === 0 && (
          <div className="history-empty">
            No edit history found. This post has not been edited.
          </div>
        )}

        <div className="history-list">
          {versions.map((v) => (
            <div key={v.versionNumber} className="history-version">
              <div className="version-header">
                <span className="version-badge">v{v.versionNumber}</span>
                <span className="version-label">
                  {v.versionNumber === 0 ? "Original" : v.editNote || "Edited"}
                </span>
                <span className="version-time">{fmtDate(v.timestamp)}</span>
              </div>

              <p className="version-content">
                {contents[v.versionNumber]?.text ?? "Loading content…"}
              </p>

              <div className="version-cid">
                IPFS CID:{" "}
                <a
                  href={`https://gateway.pinata.cloud/ipfs/${v.ipfsCid}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {v.ipfsCid.slice(0, 24)}…
                </a>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
