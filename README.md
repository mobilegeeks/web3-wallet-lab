# web3-wallet-lab

`web3-wallet-lab` is a hands-on lab for building core Web3 wallet flows from scratch.

## Current Focus
- [x] Define project baseline docs
- [x] Create initial repository scaffold
- [x] Validate local setup script
- [x] Scaffold web app and wallet-core package
- [x] Implement wallet creation/recovery basics
- [x] Add network selection and native balance lookup
- [x] Implement transaction form and sign/send flow

## MVP Scope
- Wallet creation and recovery (mnemonic/private key)
- Address display and native balance lookup
- Network switching (testnet first)
- Transaction signing and sending
- Basic security controls (secrets handling, env hygiene)

## Environment
- Node.js: 20.x LTS (see `.nvmrc`)
- pnpm: 9+
- Git

## Quick Start
```bash
bash scripts/check-env.sh
pnpm install
pnpm dev
```

## Workspace Layout
```text
.
├── apps/
│   └── web/
├── docs/
│   └── roadmap.md
├── packages/
│   └── wallet-core/
├── scripts/
│   └── check-env.sh
├── .editorconfig
├── .gitignore
├── .nvmrc
├── package.json
├── tsconfig.base.json
└── pnpm-workspace.yaml
```

## Commands
- `bash scripts/check-env.sh`: validate required tools and versions
- `pnpm run check:env`: run the same check script through `pnpm`
- `pnpm run setup`: install dependencies and run environment checks
- `pnpm dev`: run web app dev server (`@web3-wallet-lab/web`)
- `pnpm run dev:local`: run web app at `127.0.0.1:4173`
- `pnpm build`: build all workspace packages
- `pnpm typecheck`: type-check all workspace packages
- `pnpm run plan`: print roadmap location

## Roadmap
Detailed implementation checklist: `docs/roadmap.md`

## Delivery Principles
- Ship in small increments and validate every step.
- Treat wallet/security concerns as first-class requirements.
- Keep docs (`README` / roadmap) synchronized with code state.
