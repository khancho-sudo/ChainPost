/**
 * Navbar — sticky top bar with brand identity and wallet connection.
 * The wallet address IS the user's identity; no username/password needed.
 */
export default function Navbar({ wallet }) {
  return (
    <header className="navbar">
      <div className="navbar-stripe" />
      <div className="navbar-inner container">
        <div className="navbar-brand">
          <span className="brand-chain" aria-hidden="true">⬡</span>
          <span className="brand-name">ChainPost</span>
          <span className="brand-tagline">User-Owned Content · Ethereum Sepolia</span>
        </div>

        <div className="navbar-wallet">
          {wallet.isConnected ? (
            <div className="wallet-info" title={wallet.address}>
              <div className="wallet-details">
                <span className="wallet-address">
                  {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}
                </span>
                <span className="wallet-balance">
                  {parseFloat(wallet.balance ?? 0).toFixed(4)} ETH
                </span>
              </div>
              <div className="wallet-dot" title="Connected to Sepolia" />
            </div>
          ) : (
            <button
              className="btn-connect"
              onClick={wallet.connect}
              disabled={wallet.loading}
            >
              {wallet.loading ? "Connecting…" : "Connect Wallet"}
            </button>
          )}
        </div>
      </div>

      {wallet.error && (
        <div className="navbar-error" role="alert">
          {wallet.error}
        </div>
      )}
    </header>
  );
}
