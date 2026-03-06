# Plan: Restore Simulation + Intent Integration (My Previous Work)

## Context

A destructive agent deleted files across the codebase. Another agent recovered most of their own work (escrow plugins, turnkey, scaffolder, dry-run test), which is visible as tracked diffs and untracked files. **My work** — the Transaction Simulation + Intent Flow feature — was lost entirely. The source files (`simulation.ts`, `intents.ts`) and their tests are deleted. The integration points in `client.ts`, `errors.ts`, `wrapper/index.ts`, and `index.ts` are missing.

Additionally, `wrapper/dry-run.ts` (another agent's file) is missing but referenced by their existing diffs in `wrapper/index.ts` and `index.ts`. I'll recreate it to keep their work functional.

## Current State

### Another agent's work (PRESERVE — do not touch):
- `wrapper/index.ts` diff: dry-run exports (references missing `./dry-run`)
- `index.ts` diff: dry-run barrel exports (`dryRunPolicy`, type exports)
- `apps/actions-server/src/app.ts`, `plugins/elizaos/`, `plugins/solana-agent-kit/` — escrow integration
- `programs/phalnx/src/state/mod.rs`, `vault.rs` — Rust changes
- `pnpm-lock.yaml` — dependency updates
- Untracked: `packages/phalnx/`, `sdk/custody/turnkey/`, `tests/dry-run.test.ts`

### My work (ALL MISSING):
- `sdk/typescript/src/simulation.ts` — DELETED
- `sdk/typescript/src/intents.ts` — DELETED
- `sdk/typescript/src/wrapper/errors.ts` — NO `TransactionSimulationError`
- `sdk/typescript/src/wrapper/index.ts` — NO `TransactionSimulationError` export
- `sdk/typescript/src/client.ts` — UNMODIFIED (7 raw `sendRawTransaction`, no simulation/intent methods)
- `sdk/typescript/src/index.ts` — NO simulation/intent exports
- `sdk/typescript/tests/simulation.test.ts` — DELETED
- `sdk/typescript/tests/intents.test.ts` — DELETED

### Also missing (another agent's file, needed by their diffs):
- `sdk/typescript/src/wrapper/dry-run.ts` — DELETED

---

## Implementation Steps

### Step 1: Create `sdk/typescript/src/simulation.ts` (new file, ~209 lines)

Solana `simulateTransaction` wrapper with Anchor error parsing.

**Exports:**
- `simulateTransaction(connection, tx, options?)` → `SimulationResult`
- `isHeliusConnection(connection)` → boolean
- `ANCHOR_ERROR_MAP` — Record<number, {name, suggestion}> for all 63 Phalnx error codes (6000-6062)
- Types: `SimulationResult`, `SimulationError`, `SimulateOptions`

**Key details:**
- `SimulateOptions`: `{ replaceRecentBlockhash?: boolean, accountAddresses?: string[] }`
- Default `replaceRecentBlockhash: true` (caller overrides to `false` for already-signed txs)
- Helius auto-detect via `(connection as any)._rpcEndpoint` regex `/helius/i`
- Anchor error parsing: regex `Error Code: (\w+). Error Number: (\d+)` and hex `custom program error: 0x([0-9a-fA-F]+)`
- `SimulationResult.error?.suggestion` from ANCHOR_ERROR_MAP lookup
- All 63 error codes (6000-6062) from `programs/phalnx/src/errors.rs`

### Step 2: Create `sdk/typescript/src/intents.ts` (new file, ~159 lines)

Intent/proposal abstraction for human-in-the-loop DeFi actions.

**Exports:**
- `createIntent(action, vault, agent, options?)` → `TransactionIntent`
- `summarizeAction(action)` → string
- `MemoryIntentStorage` class (implements `IntentStorage`)
- `DEFAULT_INTENT_TTL_MS` = 3,600,000 (1 hour)
- Types: `IntentAction`, `IntentStatus`, `TransactionIntent`, `IntentStorage`

**Key details:**
- `IntentAction` = `{ type: "swap", params } | { type: "openPosition", params } | { type: "closePosition", params } | { type: "transfer", params } | { type: "deposit", params } | { type: "withdraw", params }`
- `IntentStatus` = `"pending" | "approved" | "rejected" | "executed" | "expired" | "failed"`
- `MemoryIntentStorage`: in-memory Map with defensive copies on save/get
- `createIntent()` generates `crypto.randomUUID()` id, sets status "pending", calculates expiresAt

### Step 3: Create `sdk/typescript/src/wrapper/dry-run.ts` (new file, ~176 lines)

**This is another agent's file** that's referenced by their existing diffs but was deleted. Recreating it to keep their work functional.

**Exports:**
- `dryRunPolicy(input)` → `DryRunResult`
- Types: `DryRunInput`, `DryRunIntent`, `DryRunResult`, `DryRunSpendingSummary`, `FeeEstimate`

**Key details:**
- Pre-flight policy evaluation without executing transactions
- Takes intent description + current spending state → returns pass/fail with reasons
- Fee estimation based on protocol/developer fee rates
- Cap utilization calculation

### Step 4: Edit `sdk/typescript/src/wrapper/errors.ts`

Add `TransactionSimulationError` class after the existing exports (line 2):

```typescript
import type { SimulationResult } from "../simulation";

export class TransactionSimulationError extends Error {
  readonly result: SimulationResult;
  readonly anchorCode?: number;
  readonly anchorName?: string;

  constructor(result: SimulationResult) {
    const msg = result.error?.suggestion ?? result.error?.anchorName ?? "Transaction simulation failed";
    super(msg);
    this.name = "TransactionSimulationError";
    this.result = result;
    this.anchorCode = result.error?.anchorCode;
    this.anchorName = result.error?.anchorName;
  }
}
```

### Step 5: Edit `sdk/typescript/src/wrapper/index.ts`

Add `TransactionSimulationError` to the errors export block (after `AttestationPcrMismatchError`, before `} from "./errors"`). The dry-run exports are already present from the other agent's diff — preserve them.

### Step 6: Edit `sdk/typescript/src/client.ts`

**6a. Add imports** (after existing imports, ~line 12):
```typescript
import { simulateTransaction, type SimulationResult, type SimulateOptions } from "./simulation";
import { TransactionSimulationError } from "./wrapper/errors";
import { createIntent, MemoryIntentStorage, type IntentStorage, type TransactionIntent, type IntentAction } from "./intents";
```

**6b. Add options** to `PhalnxClientOptions` interface:
```typescript
simulateBeforeSend?: boolean;
intentStorage?: IntentStorage;
```

**6c. Add private fields** to `PhalnxClient` class:
```typescript
private readonly _simulateBeforeSend: boolean;
private _intentStorage: IntentStorage | undefined;
```

**6d. Wire constructor** — read options, set `_simulateBeforeSend` default `false`.

**6e. Add `sendWithOptionalSimulation` private method:**
```typescript
private async sendWithOptionalSimulation(signed: VersionedTransaction, blockhash: string, lastValidBlockHeight: number): Promise<string> {
  if (this._simulateBeforeSend) {
    const simResult = await simulateTransaction(this.provider.connection, signed, { replaceRecentBlockhash: false });
    if (!simResult.success) throw new TransactionSimulationError(simResult);
  }
  const sig = await this.provider.connection.sendRawTransaction(signed.serialize());
  await this.provider.connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
  return sig;
}
```

**6f. Replace all 7 `sendRawTransaction` call sites** with `sendWithOptionalSimulation()`. Each site follows this pattern:
```typescript
// BEFORE:
const sig = await this.provider.connection.sendRawTransaction(signed.serialize());
await this.provider.connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
return sig;

// AFTER:
return this.sendWithOptionalSimulation(signed, blockhash, lastValidBlockHeight);
```

The 7 sites are at lines: 593, 629, 696, 763, 794, 1131, 1169.

**6g. Add `simulate()` public method:**
```typescript
async simulate(tx: VersionedTransaction, options?: SimulateOptions): Promise<SimulationResult> {
  return simulateTransaction(this.provider.connection, tx, options);
}
```

**6h. Add intent methods:**
- `getIntentStorage()` — lazy-initializes `_intentStorage` with `MemoryIntentStorage`
- `proposeSwap(params)` → creates intent with action type "swap"
- `proposeOpenPosition(params)` → creates intent with action type "openPosition"
- `proposeTransfer(params)` → creates intent with action type "transfer"
- `proposeDeposit(params)` → creates intent with action type "deposit"
- `approveIntent(intentId)` → sets status to "approved"
- `rejectIntent(intentId)` → sets status to "rejected"
- `executeIntent(intentId)` → validates "approved", executes underlying action, sets "executed" or "failed"
- `listIntents(filter?)` → lists intents with optional status filter
- `getIntent(id)` → gets single intent

**Key gotcha for `executeIntent`:**
- `JupiterSwapParams` requires `owner: PublicKey` and `vaultId: BN`, not a vault address
- Must call `this.fetchVaultByAddress(intent.vault)` to resolve these
- `PolicyViolation.rule` is a strict union — use `"unknown_program" as const` for simulation failures

### Step 7: Edit `sdk/typescript/src/index.ts`

Add simulation + intent barrel exports (preserving existing dry-run exports from other agent). Add after `export { IDL }` line:

```typescript
// Simulation
export {
  simulateTransaction, isHeliusConnection, ANCHOR_ERROR_MAP,
  type SimulationResult, type SimulationError, type SimulateOptions,
} from "./simulation";

// Intents
export {
  createIntent, summarizeAction, MemoryIntentStorage, DEFAULT_INTENT_TTL_MS,
  type IntentAction, type IntentStatus, type TransactionIntent, type IntentStorage,
} from "./intents";
```

Also add `TransactionSimulationError` to the wrapper value exports block.

### Step 8: Create `sdk/typescript/tests/simulation.test.ts` (~254 lines)

Tests:
- Successful simulation returns `{ success: true }`
- Anchor error log parsing (name + code + suggestion from ANCHOR_ERROR_MAP)
- Hex error parsing (`custom program error: 0x1770`)
- Raw error fallback (non-Anchor errors)
- `isHeliusConnection` detection (helius URL → true, other → false)
- `replaceRecentBlockhash` defaults to `true`
- `accountAddresses` passthrough
- `ANCHOR_ERROR_MAP` has all 63 codes (6000-6062)
- `TransactionSimulationError` construction and properties

### Step 9: Create `sdk/typescript/tests/intents.test.ts` (~328 lines)

Tests (use `Keypair.generate().publicKey` for test keys):
- `createIntent()` generates UUID, sets pending status, calculates expiry
- `summarizeAction()` for all 6 action types
- `MemoryIntentStorage` CRUD operations
- Filtering by status and vault
- Defensive copies (mutations don't affect stored data)
- Lifecycle transitions (pending → approved → executed, pending → rejected)
- Expired intent detection

---

## Files Summary

| File | Action | Owner |
|------|--------|-------|
| `sdk/typescript/src/simulation.ts` | CREATE | My work |
| `sdk/typescript/src/intents.ts` | CREATE | My work |
| `sdk/typescript/src/wrapper/dry-run.ts` | CREATE | Other agent's work (restoring) |
| `sdk/typescript/src/wrapper/errors.ts` | EDIT | My work |
| `sdk/typescript/src/wrapper/index.ts` | EDIT (additive) | My work (preserve other agent's dry-run exports) |
| `sdk/typescript/src/client.ts` | EDIT | My work |
| `sdk/typescript/src/index.ts` | EDIT (additive) | My work (preserve other agent's dry-run exports) |
| `sdk/typescript/tests/simulation.test.ts` | CREATE | My work |
| `sdk/typescript/tests/intents.test.ts` | CREATE | My work |

---

## Verification

```bash
# Build the SDK to verify TypeScript compilation
cd sdk/typescript && pnpm build

# Run all SDK tests (expect ~230+ passing including new simulation/intent tests)
pnpm test

# Verify no other agent's work was broken
cd ../../ && pnpm --filter @phalnx/sdk test
```

Expected: All existing 192 SDK tests pass + new simulation tests + new intent tests.
