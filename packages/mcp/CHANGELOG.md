# @agent-shield/mcp

## 0.4.4

### Patch Changes

- [#42](https://github.com/Kaleb-Rupe/agentshield/pull/42) [`d455d9f`](https://github.com/Kaleb-Rupe/agentshield/commit/d455d9f176aa05eece2a615abb0865800129014f) Thanks [@Kaleb-Rupe](https://github.com/Kaleb-Rupe)! - fix(security): audit findings batch 1
  - **core**: Add `checkpoint()` and `rollback()` to `ShieldState` to prevent phantom spend recording when `signAllTransactions` fails
  - **sdk**: Enforce `maxPayment` ceiling in `shieldedFetch()` (rejects if server asks more than specified cap); wrap `signAllTransactions` evaluate-record-sign loop in checkpoint/rollback to prevent phantom spend on signing failure
  - **mcp**: Lazy-cache `ShieldedWallet` across x402 tool calls so spending caps persist; pass `maxPayment` through to `shieldedFetch()`; tighten `maxPayment` schema with regex validation

- Updated dependencies [[`d455d9f`](https://github.com/Kaleb-Rupe/agentshield/commit/d455d9f176aa05eece2a615abb0865800129014f)]:
  - @agent-shield/sdk@0.5.2
  - @agent-shield/custody-crossmint@0.1.4
