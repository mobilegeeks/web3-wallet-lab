import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchNativeBalance,
  getSupportedNetworks,
  createWallet,
  maskAddress,
  recoverWalletFromMnemonic,
  recoverWalletFromPrivateKey,
  type BalanceSnapshot,
  type SupportedNetwork,
  type WalletSnapshot
} from "@web3-wallet-lab/wallet-core";

const APP_TITLE = "Web3 Wallet Lab";

function App() {
  const [wallet, setWallet] = useState<WalletSnapshot | null>(null);
  const [privateKeyInput, setPrivateKeyInput] = useState("");
  const [mnemonicInput, setMnemonicInput] = useState("");
  const [network, setNetwork] = useState<SupportedNetwork>("sepolia");
  const [balance, setBalance] = useState<BalanceSnapshot | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const networks = useMemo(() => getSupportedNetworks(), []);

  const safeAddress = useMemo(() => {
    if (!wallet) {
      return "";
    }
    return maskAddress(wallet.address);
  }, [wallet]);

  const clearError = () => setErrorMessage(null);

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

  const onCreateWallet = () => {
    try {
      clearError();
      setWallet(createWallet());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create wallet.");
    }
  };

  const onRecoverFromPrivateKey = () => {
    try {
      clearError();
      setWallet(recoverWalletFromPrivateKey(privateKeyInput));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Invalid private key.");
    }
  };

  const onRecoverFromMnemonic = () => {
    try {
      clearError();
      setWallet(recoverWalletFromMnemonic(mnemonicInput));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Invalid mnemonic phrase.");
    }
  };

  return (
    <main className="page">
      <header className="hero">
        <p className="eyebrow">Phase 1 - Wallet Basics</p>
        <h1>{APP_TITLE}</h1>
        <p className="lead">
          Create a test wallet, recover from a private key or mnemonic, and fetch on-chain balance.
        </p>
      </header>

      <section className="panel actions">
        <button type="button" className="button primary" onClick={onCreateWallet}>
          Create New Wallet
        </button>

        <div className="form-block">
          <label htmlFor="privateKey">Recover from Private Key</label>
          <input
            id="privateKey"
            name="privateKey"
            type="text"
            placeholder="0x..."
            value={privateKeyInput}
            onChange={(event) => setPrivateKeyInput(event.target.value)}
          />
          <button type="button" className="button" onClick={onRecoverFromPrivateKey}>
            Recover Private Key
          </button>
        </div>

        <div className="form-block">
          <label htmlFor="mnemonic">Recover from Mnemonic</label>
          <textarea
            id="mnemonic"
            name="mnemonic"
            placeholder="word1 word2 ... word12"
            value={mnemonicInput}
            onChange={(event) => setMnemonicInput(event.target.value)}
          />
          <button type="button" className="button" onClick={onRecoverFromMnemonic}>
            Recover Mnemonic
          </button>
        </div>

        <div className="form-block">
          <label htmlFor="network">Network</label>
          <select
            id="network"
            name="network"
            value={network}
            onChange={(event) => setNetwork(event.target.value as SupportedNetwork)}
          >
            {networks.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
          <button type="button" className="button" onClick={() => void refreshBalance()} disabled={!wallet}>
            Refresh Balance
          </button>
        </div>
      </section>

      <section className="panel output">
        <h2>Wallet Snapshot</h2>
        {!wallet && <p>No wallet loaded yet.</p>}
        {wallet && (
          <dl>
            <div>
              <dt>Network</dt>
              <dd>{network}</dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd>{wallet.address}</dd>
            </div>
            <div>
              <dt>Masked</dt>
              <dd>{safeAddress}</dd>
            </div>
            <div>
              <dt>Private Key</dt>
              <dd>{wallet.privateKey}</dd>
            </div>
            <div>
              <dt>Mnemonic</dt>
              <dd>{wallet.mnemonic ?? "N/A (private key recovery)"}</dd>
            </div>
            <div>
              <dt>Balance</dt>
              <dd>
                {isBalanceLoading && "Loading..."}
                {!isBalanceLoading && balance && `${balance.formatted} ${balance.symbol}`}
                {!isBalanceLoading && !balance && "-"}
              </dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{balance ? new Date(balance.updatedAt).toLocaleString() : "-"}</dd>
            </div>
          </dl>
        )}

        {errorMessage && <p className="error">{errorMessage}</p>}
        {balanceError && <p className="error">{balanceError}</p>}
      </section>
    </main>
  );
}

export default App;
