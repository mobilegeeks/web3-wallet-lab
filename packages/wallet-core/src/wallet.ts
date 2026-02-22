import { Mnemonic, Wallet } from "ethers";

export type WalletSnapshot = {
  address: string;
  privateKey: string;
  mnemonic: string | null;
};

type WalletLike = {
  address: string;
  privateKey: string;
  mnemonic?: {
    phrase?: string;
  } | null;
};

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

export function maskAddress(address: string, prefixLength = 6, suffixLength = 4): string {
  const normalized = address.trim();
  if (normalized.length <= prefixLength + suffixLength) {
    return normalized;
  }
  return `${normalized.slice(0, prefixLength)}...${normalized.slice(-suffixLength)}`;
}
