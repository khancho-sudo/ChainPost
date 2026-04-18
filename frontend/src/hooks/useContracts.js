import { useMemo } from "react";
import { ethers } from "ethers";
import { CONTRACTS } from "../config";
import PostRegistryABI  from "../abi/PostRegistry.json";
import EditHistoryABI   from "../abi/EditHistory.json";
import AccessControlABI from "../abi/AccessControl.json";

/**
 * Returns typed ethers.Contract instances connected to the provided signer or provider.
 * Read-only operations (getPost, getHistory) work with a provider;
 * write operations (createPost, editPost) require a signer.
 */
export function useContracts(signerOrProvider) {
  return useMemo(() => {
    if (!signerOrProvider) {
      return { postRegistry: null, editHistory: null, accessControl: null };
    }
    return {
      postRegistry:  new ethers.Contract(CONTRACTS.PostRegistry,  PostRegistryABI.abi,  signerOrProvider),
      editHistory:   new ethers.Contract(CONTRACTS.EditHistory,   EditHistoryABI.abi,   signerOrProvider),
      accessControl: new ethers.Contract(CONTRACTS.AccessControl, AccessControlABI.abi, signerOrProvider),
    };
  }, [signerOrProvider]);
}
