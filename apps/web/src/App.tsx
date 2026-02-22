import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, Copy, Eye, EyeOff, RefreshCcw, Sparkles, Wallet2 } from "lucide-react";
import {
  createWallet,
  fetchNativeBalance,
  getSupportedNetworks,
  maskAddress,
  recoverWalletFromMnemonic,
  recoverWalletFromPrivateKey,
  sendNativeTransaction,
  type BalanceSnapshot,
  type NativeTransferResult,
  type SupportedNetwork,
  type TransferProgressStage,
  type WalletSnapshot
} from "@web3-wallet-lab/wallet-core";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const APP_TITLE = "Web3 Wallet Lab";
const SEPOLIA_FAUCET_URL = "https://www.alchemy.com/faucets/ethereum-sepolia";

type ActionMode = "create" | "private-key" | "mnemonic";

const ACTION_MODES: ReadonlyArray<{ key: ActionMode; label: string; description: string }> = [
  {
    key: "create",
    label: "New Wallet",
    description: "Create a fresh test wallet for quick exploration."
  },
  {
    key: "private-key",
    label: "Private Key",
    description: "Recover using an existing private key."
  },
  {
    key: "mnemonic",
    label: "Mnemonic",
    description: "Recover using a 12/24-word seed phrase."
  }
];

function concealSecret(value: string, visible: boolean): string {
  if (visible) {
    return value;
  }
  if (value.length <= 14) {
    return "•".repeat(value.length);
  }
  return `${value.slice(0, 8)}${"•".repeat(12)}${value.slice(-6)}`;
}

function formatEthValue(balance: BalanceSnapshot | null): string {
  if (!balance) {
    return "-";
  }
  const value = Number(balance.formatted);
  if (Number.isNaN(value)) {
    return `${balance.formatted} ${balance.symbol}`;
  }
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${balance.symbol}`;
}

function formatHash(hash: string): string {
  if (hash.length <= 14) {
    return hash;
  }
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
}

function txStageText(stage: TransferProgressStage | null): string | null {
  if (stage === "signing") {
    return "Signing transaction locally...";
  }
  if (stage === "broadcasted") {
    return "Broadcasted. Waiting for network confirmation...";
  }
  if (stage === "confirming") {
    return "Confirming on-chain...";
  }
  return null;
}

function App() {
  const [mode, setMode] = useState<ActionMode>("create");
  const [wallet, setWallet] = useState<WalletSnapshot | null>(null);
  const [privateKeyInput, setPrivateKeyInput] = useState("");
  const [mnemonicInput, setMnemonicInput] = useState("");
  const [network, setNetwork] = useState<SupportedNetwork>("sepolia");
  const [balance, setBalance] = useState<BalanceSnapshot | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [addressCopied, setAddressCopied] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [txTo, setTxTo] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [isTxSubmitting, setIsTxSubmitting] = useState(false);
  const [txStage, setTxStage] = useState<TransferProgressStage | null>(null);
  const [txPendingHash, setTxPendingHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [txResult, setTxResult] = useState<NativeTransferResult | null>(null);
  const [txHashCopied, setTxHashCopied] = useState(false);

  const networks = useMemo(() => getSupportedNetworks(), []);
  const currentNetwork = useMemo(() => networks.find((item) => item.key === network) ?? networks[0], [network, networks]);
  const currentMode = useMemo(() => ACTION_MODES.find((item) => item.key === mode) ?? ACTION_MODES[0], [mode]);
  const txStageMessage = useMemo(() => txStageText(txStage), [txStage]);

  const refreshBalance = useCallback(async () => {
    if (!wallet) {
      setBalance(null);
      setBalanceError(null);
      return;
    }

    try {
      setIsBalanceLoading(true);
      setBalanceError(null);
      const latest = await fetchNativeBalance(wallet.address, network);
      setBalance(latest);
    } catch (error) {
      setBalanceError(error instanceof Error ? error.message : "Failed to load balance.");
    } finally {
      setIsBalanceLoading(false);
    }
  }, [network, wallet]);

  useEffect(() => {
    void refreshBalance();
  }, [refreshBalance]);

  useEffect(() => {
    setShowPrivateKey(false);
    setShowMnemonic(false);
  }, [wallet]);

  const loadWallet = (nextWallet: WalletSnapshot) => {
    setActionError(null);
    setWallet(nextWallet);
  };

  const onCreateWallet = () => {
    try {
      loadWallet(createWallet());
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to create wallet.");
    }
  };

  const onRecoverPrivateKey = () => {
    try {
      loadWallet(recoverWalletFromPrivateKey(privateKeyInput));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Invalid private key.");
    }
  };

  const onRecoverMnemonic = () => {
    try {
      loadWallet(recoverWalletFromMnemonic(mnemonicInput));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Invalid mnemonic phrase.");
    }
  };

  const onCopyAddress = async () => {
    if (!wallet) {
      return;
    }
    try {
      await navigator.clipboard.writeText(wallet.address);
      setAddressCopied(true);
      window.setTimeout(() => setAddressCopied(false), 1500);
    } catch {
      setActionError("Clipboard permission was denied.");
    }
  };

  const onCopyTxHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setTxHashCopied(true);
      window.setTimeout(() => setTxHashCopied(false), 1500);
    } catch {
      setTxError("Clipboard permission was denied.");
    }
  };

  const onSendTransaction = async () => {
    if (!wallet) {
      setTxError("Create or recover a wallet first.");
      return;
    }

    try {
      setIsTxSubmitting(true);
      setTxError(null);
      setTxResult(null);
      setTxStage(null);
      setTxPendingHash(null);

      const result = await sendNativeTransaction(
        {
          privateKey: wallet.privateKey,
          to: txTo,
          amountEth: txAmount,
          network
        },
        (progress) => {
          setTxStage(progress.stage);
          if (progress.hash) {
            setTxPendingHash(progress.hash);
          }
        }
      );

      setTxResult(result);
      setTxPendingHash(result.hash);
      setTxStage(null);
      setTxAmount("");
      await refreshBalance();
    } catch (error) {
      setTxStage(null);
      setTxError(error instanceof Error ? error.message : "Failed to send transaction.");
    } finally {
      setIsTxSubmitting(false);
    }
  };

  return (
    <main className="app-shell">
      <header className="glass-panel mb-5 overflow-hidden p-6 md:p-8">
        <div className="absolute" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Shadcn-style UI</Badge>
              <Badge variant="muted">Sepolia-first flow</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{APP_TITLE}</h1>
            <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
              Built for first-time testing: generate or recover a wallet, switch network, and verify balance in one guided view.
            </p>
          </div>
          <div className="rounded-lg border border-border/80 bg-background/80 px-4 py-3 text-sm">
            <p className="font-semibold text-foreground">Current Network</p>
            <p className="text-muted-foreground">{currentNetwork.label}</p>
          </div>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>1. Wallet Setup</CardTitle>
            <CardDescription>{currentMode.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2 sm:grid-cols-3">
              {ACTION_MODES.map((item) => (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => setMode(item.key)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-left text-sm transition",
                    mode === item.key
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                  )}
                >
                  <span className="block font-semibold text-foreground">{item.label}</span>
                  <span className="mt-1 block text-xs">{item.description}</span>
                </button>
              ))}
            </div>

            {mode === "create" && (
              <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
                <p className="text-sm text-muted-foreground">Generate a new wallet for testing immediately.</p>
                <Button onClick={onCreateWallet} className="gap-2">
                  <Sparkles size={16} />
                  Create New Wallet
                </Button>
              </div>
            )}

            {mode === "private-key" && (
              <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
                <Label htmlFor="privateKey">Private Key</Label>
                <Input
                  id="privateKey"
                  name="privateKey"
                  value={privateKeyInput}
                  onChange={(event) => setPrivateKeyInput(event.target.value)}
                  placeholder="0x..."
                />
                <Button onClick={onRecoverPrivateKey}>Recover from Private Key</Button>
              </div>
            )}

            {mode === "mnemonic" && (
              <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
                <Label htmlFor="mnemonic">Mnemonic Phrase</Label>
                <Textarea
                  id="mnemonic"
                  name="mnemonic"
                  value={mnemonicInput}
                  onChange={(event) => setMnemonicInput(event.target.value)}
                  placeholder="word1 word2 ... word12"
                />
                <Button onClick={onRecoverMnemonic}>Recover from Mnemonic</Button>
              </div>
            )}

            <div className="space-y-3 rounded-lg border border-border p-4">
              <Label htmlFor="network">2. Network & Balance</Label>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <select
                  id="network"
                  name="network"
                  value={network}
                  onChange={(event) => setNetwork(event.target.value as SupportedNetwork)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {networks.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <Button variant="outline" onClick={() => void refreshBalance()} disabled={!wallet || isBalanceLoading} className="gap-2">
                  <RefreshCcw size={16} className={cn(isBalanceLoading && "animate-spin")} />
                  {isBalanceLoading ? "Loading..." : "Refresh"}
                </Button>
              </div>
              {network === "sepolia" && (
                <p className="text-xs text-muted-foreground">
                  Need test ETH? Open the faucet guide from the right panel and fund your address.
                </p>
              )}
            </div>

            {actionError && <Alert>{actionError}</Alert>}
            {balanceError && <Alert>{balanceError}</Alert>}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>2. Transaction Flow</CardTitle>
              <CardDescription>Enter transaction params, sign, send, and track result.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tx-to">Recipient Address</Label>
                <Input
                  id="tx-to"
                  name="tx-to"
                  value={txTo}
                  onChange={(event) => setTxTo(event.target.value)}
                  placeholder="0x..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tx-amount">Amount (ETH)</Label>
                <Input
                  id="tx-amount"
                  name="tx-amount"
                  value={txAmount}
                  onChange={(event) => setTxAmount(event.target.value)}
                  placeholder="0.001"
                />
              </div>

              <Button onClick={() => void onSendTransaction()} disabled={!wallet || isTxSubmitting} className="gap-2">
                <ArrowRightLeft size={16} />
                {isTxSubmitting ? "Sending..." : "Sign & Send Transaction"}
              </Button>

              {!wallet && <p className="text-xs text-muted-foreground">Load a wallet first before sending.</p>}

              {txStageMessage && (
                <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  {txStageMessage}
                </div>
              )}

              {txPendingHash && (
                <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                  <p className="font-mono">{formatHash(txPendingHash)}</p>
                  <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => void onCopyTxHash(txPendingHash)}>
                    <Copy size={14} />
                    {txHashCopied ? "Copied" : "Copy Hash"}
                  </Button>
                </div>
              )}

              {txResult && (
                <div className="space-y-2 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
                  <p className="font-semibold">Transaction confirmed</p>
                  <p>
                    Sent <strong>{txResult.amountEth} ETH</strong> to <span className="font-mono">{formatHash(txResult.to)}</span>
                  </p>
                  <p>
                    Hash: <span className="font-mono">{formatHash(txResult.hash)}</span>
                  </p>
                  {txResult.explorerUrl && (
                    <a className="inline-flex text-emerald-800 underline" href={txResult.explorerUrl} target="_blank" rel="noreferrer">
                      Open in explorer
                    </a>
                  )}
                </div>
              )}

              {txError && <Alert>{txError}</Alert>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle>3. Wallet Snapshot</CardTitle>
              <CardDescription>Private key and mnemonic are hidden by default.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!wallet && (
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                  <Wallet2 className="mx-auto mb-2" size={18} />
                  Create or recover a wallet first to inspect address and balance.
                </div>
              )}

              {wallet && (
                <>
                  <div className="rounded-lg border border-border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Address</p>
                      <Button variant="ghost" size="sm" className="h-8 gap-1 px-2" onClick={() => void onCopyAddress()}>
                        <Copy size={14} />
                        {addressCopied ? "Copied" : "Copy"}
                      </Button>
                    </div>
                    <p className="font-mono text-sm">{wallet.address}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Masked: {maskAddress(wallet.address)}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Balance</p>
                      <p className="mt-1 text-lg font-semibold">{formatEthValue(balance)}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Updated</p>
                      <p className="mt-1 text-sm">{balance ? new Date(balance.updatedAt).toLocaleString() : "-"}</p>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Private Key</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => setShowPrivateKey((prev) => !prev)}
                      >
                        {showPrivateKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </Button>
                    </div>
                    <p className="font-mono text-xs break-all">{concealSecret(wallet.privateKey, showPrivateKey)}</p>
                  </div>

                  <div className="space-y-2 rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Mnemonic</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => setShowMnemonic((prev) => !prev)}
                        disabled={!wallet.mnemonic}
                      >
                        {showMnemonic ? <EyeOff size={14} /> : <Eye size={14} />}
                      </Button>
                    </div>
                    <p className="text-sm break-words">
                      {wallet.mnemonic ? concealSecret(wallet.mnemonic, showMnemonic) : "Not available for private-key recovery."}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. First-Time Test Flow</CardTitle>
              <CardDescription>Start with zero crypto and still verify everything quickly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                <li>Create a new wallet in the setup panel.</li>
                <li>Copy the generated address.</li>
                <li>Open a Sepolia faucet and request test ETH.</li>
                <li>Return here and press Refresh to verify balance.</li>
              </ol>
              <a href={SEPOLIA_FAUCET_URL} target="_blank" rel="noreferrer" className="inline-flex">
                <Button variant="secondary">Open Sepolia Faucet</Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

export default App;
