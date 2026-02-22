# Roadmap

## Phase 0: Foundation (Current)
- [x] Define project scope and goals
- [x] Create workspace baseline structure
- [x] Add environment check script
- [x] Scaffold web app and wallet-core package
- [x] Install dependencies

Exit criteria:
- `bash scripts/check-env.sh` passes.
- `apps/web` and `packages/wallet-core` are ready for implementation.

## Phase 1: Wallet Basics
- [x] Implement wallet creation/recovery utilities
- [x] Display address and network info
- [x] Add native balance lookup

Exit criteria:
- Address and balance are visible in the web UI for a test wallet.

## Phase 2: Transaction Flow
- [x] Transaction parameter form
- [x] Sign and send transaction
- [x] Success/failure state handling

Exit criteria:
- At least one successful transfer on testnet.

## Phase 3: Security + DX
- [ ] Sensitive data logging/storage audit
- [ ] Error boundaries and retry UX hardening
- [ ] Tests (unit + key user flow checks)

Exit criteria:
- Failure states in critical flows are clear and recoverable.

## This Week Priorities
1. Harden wallet recovery validation UX
2. Add transaction form and preflight checks
3. Implement first testnet send flow
