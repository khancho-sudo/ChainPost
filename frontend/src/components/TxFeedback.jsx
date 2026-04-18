/**
 * TxFeedback — real-time 3-step transaction status bar.
 * Shows the blockchain interaction process so users can see they're
 * directly interacting with the network (not a black box server).
 *
 * Steps:
 *   1 → IPFS Upload
 *   2 → Wallet Signature (MetaMask popup)
 *   3 → Block Confirmed
 */
const STEPS = [
  { n: 1, label: "IPFS Upload" },
  { n: 2, label: "Wallet Signature" },
  { n: 3, label: "Block Confirmed" },
];

export default function TxFeedback({ status }) {
  const isDone  = status.step === "done";
  const isError = status.step === "error";

  function stepClass(n) {
    if (isError)  return "tx-step--error";
    if (isDone || (typeof status.step === "number" && status.step > n)) return "tx-step--done";
    if (typeof status.step === "number" && status.step === n) return "tx-step--active";
    return "";
  }

  return (
    <div
      className={`tx-feedback${isError ? " tx-feedback--error" : isDone ? " tx-feedback--done" : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="tx-steps">
        {STEPS.map(({ n, label }) => (
          <div key={n} className={`tx-step ${stepClass(n)}`}>
            <div className="tx-step-dot">
              {(isDone || (typeof status.step === "number" && status.step > n)) ? "✓" : n}
            </div>
            <span className="tx-step-label">{label}</span>
          </div>
        ))}
      </div>
      <p className="tx-message">{status.message}</p>
    </div>
  );
}
