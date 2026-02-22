import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { createWallet, maskAddress, recoverWalletFromMnemonic, recoverWalletFromPrivateKey } from "@web3-wallet-lab/wallet-core";
const APP_TITLE = "Web3 Wallet Lab";
function App() {
    const [wallet, setWallet] = useState(null);
    const [privateKeyInput, setPrivateKeyInput] = useState("");
    const [mnemonicInput, setMnemonicInput] = useState("");
    const [errorMessage, setErrorMessage] = useState(null);
    const safeAddress = useMemo(() => {
        if (!wallet) {
            return "";
        }
        return maskAddress(wallet.address);
    }, [wallet]);
    const clearError = () => setErrorMessage(null);
    const onCreateWallet = () => {
        try {
            clearError();
            setWallet(createWallet());
        }
        catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to create wallet.");
        }
    };
    const onRecoverFromPrivateKey = () => {
        try {
            clearError();
            setWallet(recoverWalletFromPrivateKey(privateKeyInput));
        }
        catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Invalid private key.");
        }
    };
    const onRecoverFromMnemonic = () => {
        try {
            clearError();
            setWallet(recoverWalletFromMnemonic(mnemonicInput));
        }
        catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Invalid mnemonic phrase.");
        }
    };
    return (_jsxs("main", { className: "page", children: [_jsxs("header", { className: "hero", children: [_jsx("p", { className: "eyebrow", children: "Phase 1 - Wallet Basics" }), _jsx("h1", { children: APP_TITLE }), _jsx("p", { className: "lead", children: "Create a test wallet, recover from a private key or mnemonic, and verify address output." })] }), _jsxs("section", { className: "panel actions", children: [_jsx("button", { type: "button", className: "button primary", onClick: onCreateWallet, children: "Create New Wallet" }), _jsxs("div", { className: "form-block", children: [_jsx("label", { htmlFor: "privateKey", children: "Recover from Private Key" }), _jsx("input", { id: "privateKey", name: "privateKey", type: "text", placeholder: "0x...", value: privateKeyInput, onChange: (event) => setPrivateKeyInput(event.target.value) }), _jsx("button", { type: "button", className: "button", onClick: onRecoverFromPrivateKey, children: "Recover Private Key" })] }), _jsxs("div", { className: "form-block", children: [_jsx("label", { htmlFor: "mnemonic", children: "Recover from Mnemonic" }), _jsx("textarea", { id: "mnemonic", name: "mnemonic", placeholder: "word1 word2 ... word12", value: mnemonicInput, onChange: (event) => setMnemonicInput(event.target.value) }), _jsx("button", { type: "button", className: "button", onClick: onRecoverFromMnemonic, children: "Recover Mnemonic" })] })] }), _jsxs("section", { className: "panel output", children: [_jsx("h2", { children: "Wallet Snapshot" }), !wallet && _jsx("p", { children: "No wallet loaded yet." }), wallet && (_jsxs("dl", { children: [_jsxs("div", { children: [_jsx("dt", { children: "Address" }), _jsx("dd", { children: wallet.address })] }), _jsxs("div", { children: [_jsx("dt", { children: "Masked" }), _jsx("dd", { children: safeAddress })] }), _jsxs("div", { children: [_jsx("dt", { children: "Private Key" }), _jsx("dd", { children: wallet.privateKey })] }), _jsxs("div", { children: [_jsx("dt", { children: "Mnemonic" }), _jsx("dd", { children: wallet.mnemonic ?? "N/A (private key recovery)" })] })] })), errorMessage && _jsx("p", { className: "error", children: errorMessage })] })] }));
}
export default App;
