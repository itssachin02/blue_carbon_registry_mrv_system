import { ethers } from "ethers";

// Polygon Mumbai Configuration
const POLYGON_MUMBAI = {
  chainId: "0x13881", // 80001 in hex
  chainName: "Polygon Mumbai",
  nativeCurrency: {
    name: "MATIC",
    symbol: "MATIC",
    decimals: 18,
  },
  rpcUrls: ["https://rpc-mumbai.maticvigil.com"],
  blockExplorerUrls: ["https://mumbai.polygonscan.com"],
};

const getEthereumProvider = () => {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No Ethereum wallet extension is available. Install MetaMask or another supported wallet.");
  }
  return window.ethereum as any;
};

export const isMetaMaskInstalled = () => {
  return typeof window !== "undefined" && Boolean(window.ethereum);
};

// Add Polygon Mumbai to MetaMask
export const addPolygonMumbaiToMetaMask = async () => {
  const ethereum = getEthereumProvider();
  try {
    await ethereum.request({
      method: "wallet_addEthereumChain",
      params: [POLYGON_MUMBAI],
    });
    return true;
  } catch (error: any) {
    if (error.code === 4902) {
      // Network not found, try adding it
      try {
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [POLYGON_MUMBAI],
        });
        return true;
      } catch (addError) {
        console.error("Failed to add Polygon Mumbai:", addError);
        return false;
      }
    }
    console.error("Error adding network:", error);
    return false;
  }
};

// Switch to Polygon Mumbai
export const switchToPolygonMumbai = async () => {
  const ethereum = getEthereumProvider();
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: POLYGON_MUMBAI.chainId }],
    });
    return true;
  } catch (error: any) {
    if (error.code === 4902) {
      // Network not added, add it first
      return await addPolygonMumbaiToMetaMask();
    }
    console.error("Error switching network:", error);
    return false;
  }
};

// Get current network ID
export const getCurrentNetwork = async () => {
  const ethereum = getEthereumProvider();
  try {
    const chainId = await ethereum.request({ method: "eth_chainId" });
    return parseInt(chainId, 16);
  } catch (error) {
    console.error("Error getting network:", error);
    return null;
  }
};

const formatEthereumError = (error: any): string => {
  if (!error) {
    return "Failed to connect to MetaMask.";
  }

  if (typeof error === "string") {
    return error;
  }

  if (error.code === 4001) {
    return "Connection request rejected. Please approve the MetaMask prompt to connect.";
  }

  if (error.code === -32002) {
    return "A MetaMask connection request is already pending. Please check MetaMask and approve or reject the existing request.";
  }

  if (error.message) {
    return error.message;
  }

  return "Failed to connect to MetaMask.";
};

export const requestAccount = async (): Promise<string> => {
  const ethereum = getEthereumProvider();
  try {
    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    if (!Array.isArray(accounts) || accounts.length === 0) {
      throw new Error("No accounts were returned. Unlock MetaMask and try again.");
    }
    return accounts[0] as string;
  } catch (error) {
    throw new Error(formatEthereumError(error));
  }
};

export const getProvider = () => {
  const ethereum = getEthereumProvider();
  return new ethers.BrowserProvider(ethereum);
};

export const getSigner = async () => {
  const provider = getProvider();
  return provider.getSigner();
};

export const getCurrentAccount = async (): Promise<string | null> => {
  if (typeof window === "undefined" || !window.ethereum) return null;
  try {
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    return (Array.isArray(accounts) && accounts[0]) || null;
  } catch (error) {
    return null;
  }
};

// Initialize Polygon Mumbai network on first load
export const initializePolygonMumbai = async () => {
  try {
    const currentNetwork = await getCurrentNetwork();
    if (currentNetwork !== 80001) {
      // Not on Polygon Mumbai, try to switch
      const switched = await switchToPolygonMumbai();
      if (!switched) {
        console.warn("Failed to switch to Polygon Mumbai. Please switch manually in MetaMask.");
      }
    }
  } catch (error) {
    console.error("Error initializing Polygon Mumbai:", error);
  }
};