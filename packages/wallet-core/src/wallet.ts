import { JsonRpcProvider, Mnemonic, Wallet, formatEther, getAddress, isAddress, parseEther } from "ethers";

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
  explorerTxBaseUrl: string | null;
};

export type BalanceSnapshot = {
  network: SupportedNetwork;
  address: string;
  wei: string;
  formatted: string;
  symbol: "ETH";
  updatedAt: string;
};

export type NativeTransferRequest = {
  privateKey: string;
  to: string;
  amountEth: string;
  network: SupportedNetwork;
};

export type TransferProgressStage = "signing" | "broadcasted" | "confirming";

export type TransferProgress = {
  stage: TransferProgressStage;
  hash?: string;
};

export type NativeTransferResult = {
  network: SupportedNetwork;
  chainId: number;
  hash: string;
  from: string;
  to: string;
  amountEth: string;
  valueWei: string;
  blockNumber: number;
  explorerUrl: string | null;
  confirmedAt: string;
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
    rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
    explorerTxBaseUrl: "https://sepolia.etherscan.io/tx"
  },
  {
    key: "mainnet",
    label: "Ethereum Mainnet",
    chainId: 1,
    symbol: "ETH",
    rpcUrl: "https://cloudflare-eth.com",
    explorerTxBaseUrl: "https://etherscan.io/tx"
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

function normalizeRecipientAddress(input: string): string {
  const raw = input.trim();
  if (!raw) {
    throw new Error("Recipient address is required.");
  }
  if (!isAddress(raw)) {
    throw new Error("Invalid recipient address.");
  }
  return getAddress(raw);
}

function normalizeTransferAmount(amountEth: string): bigint {
  const raw = amountEth.trim();
  if (!raw) {
    throw new Error("Amount is required.");
  }

  let value: bigint;
  try {
    value = parseEther(raw);
  } catch {
    throw new Error("Invalid amount format.");
  }

  if (value <= 0n) {
    throw new Error("Amount must be greater than zero.");
  }

  return value;
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

export async function sendNativeTransaction(
  request: NativeTransferRequest,
  onProgress?: (progress: TransferProgress) => void
): Promise<NativeTransferResult> {
  const to = normalizeRecipientAddress(request.to);
  const value = normalizeTransferAmount(request.amountEth);
  const networkInfo = getNetwork(request.network);
  const provider = getProvider(request.network);
  const signer = new Wallet(normalizePrivateKey(request.privateKey), provider);

  onProgress?.({ stage: "signing" });
  const response = await signer.sendTransaction({ to, value });
  onProgress?.({ stage: "broadcasted", hash: response.hash });
  onProgress?.({ stage: "confirming", hash: response.hash });

  const receipt = await response.wait();
  if (!receipt || receipt.status !== 1) {
    throw new Error("Transaction failed on-chain.");
  }

  const normalizedFrom = getAddress(response.from);
  const chainId = Number(response.chainId);

  return {
    network: request.network,
    chainId,
    hash: response.hash,
    from: normalizedFrom,
    to,
    amountEth: formatEther(value),
    valueWei: value.toString(),
    blockNumber: receipt.blockNumber,
    explorerUrl: networkInfo.explorerTxBaseUrl ? `${networkInfo.explorerTxBaseUrl}/${response.hash}` : null,
    confirmedAt: new Date().toISOString()
  };
}

export function maskAddress(address: string, prefixLength = 6, suffixLength = 4): string {
  const normalized = address.trim();
  if (normalized.length <= prefixLength + suffixLength) {
    return normalized;
  }
  return `${normalized.slice(0, prefixLength)}...${normalized.slice(-suffixLength)}`;
}
