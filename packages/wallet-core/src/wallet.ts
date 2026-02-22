import { JsonRpcProvider, Mnemonic, Wallet, formatEther, isAddress } from "ethers";

export type WalletSnapshot = {
  address: string;
  privateKey: string;
  mnemonic: string | null;
};

export type SupportedNetwork = "mainnet" | "sepolia";

export type NetworkInfo = {
  key: SupportedNetwork;
  label: string;
  chainId: number;
  symbol: "ETH";
  rpcUrl: string;
};

export type BalanceSnapshot = {
  network: SupportedNetwork;
  address: string;
  wei: string;
  formatted: string;
  symbol: "ETH";
  updatedAt: string;
};

type WalletLike = {
  address: string;
  privateKey: string;
  mnemonic?: {
    phrase?: string;
  } | null;
};

const NETWORKS: ReadonlyArray<NetworkInfo> = [
  {
    key: "sepolia",
    label: "Sepolia",
    chainId: 11155111,
    symbol: "ETH",
    rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com"
  },
  {
    key: "mainnet",
    label: "Ethereum Mainnet",
    chainId: 1,
    symbol: "ETH",
    rpcUrl: "https://cloudflare-eth.com"
  }
] as const;

const PROVIDERS: Partial<Record<SupportedNetwork, JsonRpcProvider>> = {};

function normalizePrivateKey(input: string): string {
  const raw = input.trim();
  if (!raw) {
    throw new Error("Private key is required.");
  }
  return raw.startsWith("0x") ? raw : `0x${raw}`;
}

function toSnapshot(wallet: WalletLike): WalletSnapshot {
  const mnemonic = wallet.mnemonic?.phrase ?? null;
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic
  };
}

function getNetwork(network: SupportedNetwork): NetworkInfo {
  const target = NETWORKS.find((item) => item.key === network);
  if (!target) {
    throw new Error(`Unsupported network: ${network}`);
  }
  return target;
}

function getProvider(network: SupportedNetwork): JsonRpcProvider {
  const found = PROVIDERS[network];
  if (found) {
    return found;
  }
  const target = getNetwork(network);
  const created = new JsonRpcProvider(target.rpcUrl, target.chainId);
  PROVIDERS[network] = created;
  return created;
}

export function createWallet(): WalletSnapshot {
  return toSnapshot(Wallet.createRandom());
}

export function recoverWalletFromPrivateKey(privateKey: string): WalletSnapshot {
  return toSnapshot(new Wallet(normalizePrivateKey(privateKey)));
}

export function recoverWalletFromMnemonic(mnemonic: string): WalletSnapshot {
  const phrase = mnemonic.trim().replace(/\s+/g, " ");
  if (!phrase) {
    throw new Error("Mnemonic phrase is required.");
  }
  return toSnapshot(Wallet.fromPhrase(phrase));
}

export function isValidPrivateKey(privateKey: string): boolean {
  try {
    recoverWalletFromPrivateKey(privateKey);
    return true;
  } catch {
    return false;
  }
}

export function isValidMnemonic(mnemonic: string): boolean {
  return Mnemonic.isValidMnemonic(mnemonic.trim().replace(/\s+/g, " "));
}

export function getSupportedNetworks(): ReadonlyArray<NetworkInfo> {
  return NETWORKS;
}

export async function fetchNativeBalance(
  address: string,
  network: SupportedNetwork
): Promise<BalanceSnapshot> {
  const normalizedAddress = address.trim();
  if (!isAddress(normalizedAddress)) {
    throw new Error("Invalid wallet address.");
  }

  const target = getNetwork(network);
  const provider = getProvider(network);
  const wei = await provider.getBalance(normalizedAddress);
  const formatted = formatEther(wei);

  return {
    network,
    address: normalizedAddress,
    wei: wei.toString(),
    formatted,
    symbol: target.symbol,
    updatedAt: new Date().toISOString()
  };
}

export function maskAddress(address: string, prefixLength = 6, suffixLength = 4): string {
  const normalized = address.trim();
  if (normalized.length <= prefixLength + suffixLength) {
    return normalized;
  }
  return `${normalized.slice(0, prefixLength)}...${normalized.slice(-suffixLength)}`;
}
