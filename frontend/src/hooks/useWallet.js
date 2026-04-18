import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { SEPOLIA_CHAIN_ID } from "../config";

/**
 * Manages MetaMask wallet connection and account state.
 * The wallet address serves as the user's identity — no username/password.
 */
export function useWallet() {
  const [address, setAddress]   = useState(null);
  const [balance, setBalance]   = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner]     = useState(null);
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask is not installed. Please install it to use ChainPost.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Ensure the user is on Sepolia testnet
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });

      const _provider = new ethers.BrowserProvider(window.ethereum);
      await _provider.send("eth_requestAccounts", []);
      const _signer  = await _provider.getSigner();
      const _address = await _signer.getAddress();
      const _bal     = await _provider.getBalance(_address);

      setProvider(_provider);
      setSigner(_signer);
      setAddress(_address);
      setBalance(ethers.formatEther(_bal));
    } catch (err) {
      setError(err.message ?? "Connection failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setSigner(null);
    setBalance(null);
    setProvider(null);
  }, []);

  // React to account / network switches in MetaMask
  useEffect(() => {
    if (!window.ethereum) return;
    const onAccountsChanged = (accounts) => {
      if (accounts.length === 0) disconnect();
      else connect();
    };
    const onChainChanged = () => window.location.reload();
    window.ethereum.on("accountsChanged", onAccountsChanged);
    window.ethereum.on("chainChanged", onChainChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", onAccountsChanged);
      window.ethereum.removeListener("chainChanged", onChainChanged);
    };
  }, [connect, disconnect]);

  return {
    address,
    balance,
    provider,
    signer,
    connect,
    disconnect,
    error,
    loading,
    isConnected: !!address,
  };
}
