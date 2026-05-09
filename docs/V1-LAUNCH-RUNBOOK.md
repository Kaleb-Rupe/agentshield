# V1 Launch Runbook — AgentShield

## CRITICAL: Program upgrade authority

The Sigil program at `4ZeVCqnjUgUtFrHHPG7jELUxvJeoVGHhGNgPrhBPwrHL` has a single
on-chain field that bypasses every constraint, every CPI guard, every
discriminator check, every blocklist: the **upgrade authority**.

Anyone who controls the upgrade authority can:
- Deploy a new program binary with all guards removed
- Drain every vault on the next agent action
- Replace error variants to silently bypass dashboard error parsing

**Drift Protocol April 2026 lost $285M to exactly this attack class** —
durable-nonce pre-signed admin-transfer transactions executed at slots the
attacker chose. The on-chain code held; the upgrade-authority key holder
was social-engineered.

### Pre-mainnet (BEFORE deploying):

- [ ] Squads V4 multisig configured: 3-of-5 signers, hardware wallets, geographic
      distribution (NYC + SF + EU minimum, no two signers in same building)
- [ ] Devnet rehearsal: transfer upgrade authority to Squads vault PDA via SAT
      (Safe Authority Transfer), verify via `solana program show <PROGRAM_ID>`
- [ ] Recovery procedure documented: signer death/loss/compromise paths, with
      specific contact list and 72-hour rotation SLA
- [ ] Test: signers practice rejecting a "routine update" that's actually
      malicious — durable-nonce pre-signed apply_pending_policy from a
      fresh-looking address with a fresh-looking diff

### V1.0 mainnet deploy day:

- [ ] Deploy with hot key (faster iteration)
- [ ] Smoke-test 1 read-only ix on mainnet
- [ ] Upload IDL via PMP under hot key
- [ ] Run 1 real ix (vault create) end-to-end
- [ ] **Then** transfer upgrade authority to Squads via SAT
- [ ] Verify `Authority` field on `solana program show` equals Squads vault PDA
- [ ] Within 24h: smoke-test a Squad-routed upgrade with no-op IDL bump

### V1.1 (within 30 days post-mainnet):

- [ ] Add slot-bounded freshness check on `apply_*` instructions (F-10 fix
      lands separately at `fix/sigil-apply-instructions-slot-freshness`)
- [ ] Multi-signer ceremony for Squads transactions: every apply_* requires
      a structured-data review (full diff displayed) before signing
- [ ] Consider a "freeze upgrade authority" fork: V2 considers null upgrade
      authority once protocol stabilizes

### V2 (eventual):

- [ ] Set upgrade authority to None — protocol becomes immutable
