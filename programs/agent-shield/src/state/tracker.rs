use anchor_lang::prelude::*;
use super::{ActionType, MAX_SPEND_ENTRIES, MAX_RECENT_TRANSACTIONS, ROLLING_WINDOW_SECONDS};
use crate::errors::AgentShieldError;

#[account]
pub struct SpendTracker {
    /// Associated vault pubkey
    pub vault: Pubkey,

    /// Rolling spend entries: (token_mint, amount, timestamp)
    /// Entries older than ROLLING_WINDOW_SECONDS are pruned on each access
    pub rolling_spends: Vec<SpendEntry>,

    /// Recent transaction log for on-chain audit trail
    /// Bounded to MAX_RECENT_TRANSACTIONS, oldest entries evicted (ring buffer)
    pub recent_transactions: Vec<TransactionRecord>,

    /// Bump seed for PDA
    pub bump: u8,
}

impl SpendTracker {
    /// Conservative size estimate:
    /// discriminator (8) + vault (32) + 
    /// rolling_spends vec (4 + SpendEntry::SIZE * MAX_SPEND_ENTRIES) +
    /// recent_transactions vec (4 + TransactionRecord::SIZE * MAX_RECENT_TRANSACTIONS) +
    /// bump (1)
    pub const SIZE: usize = 8 + 32 
        + (4 + SpendEntry::SIZE * MAX_SPEND_ENTRIES) 
        + (4 + TransactionRecord::SIZE * MAX_RECENT_TRANSACTIONS)
        + 1;

    /// Prune expired entries and return the total spend for a given token
    /// within the rolling window.
    pub fn get_rolling_spend(
        &mut self, 
        token_mint: &Pubkey, 
        current_timestamp: i64,
    ) -> Result<u64> {
        let window_start = current_timestamp
            .checked_sub(ROLLING_WINDOW_SECONDS)
            .ok_or(AgentShieldError::Overflow)?;

        // Remove expired entries
        self.rolling_spends.retain(|entry| entry.timestamp >= window_start);

        // Sum remaining entries for this token
        let total = self.rolling_spends
            .iter()
            .filter(|entry| entry.token_mint == *token_mint)
            .try_fold(0u64, |acc, entry| {
                acc.checked_add(entry.amount_spent)
                    .ok_or(error!(AgentShieldError::Overflow))
            })?;

        Ok(total)
    }

    /// Record a new spend entry. Prune expired entries first to make room.
    /// If the vector is full after pruning (all entries are still within
    /// the rolling window), reject the transaction to prevent spend cap bypass.
    pub fn record_spend(
        &mut self,
        token_mint: Pubkey,
        amount: u64,
        timestamp: i64,
    ) -> Result<()> {
        // Prune expired entries before checking capacity
        let window_start = timestamp
            .checked_sub(ROLLING_WINDOW_SECONDS)
            .ok_or(AgentShieldError::Overflow)?;
        self.rolling_spends.retain(|entry| entry.timestamp >= window_start);

        // Reject if still at capacity (all entries are active)
        require!(
            self.rolling_spends.len() < MAX_SPEND_ENTRIES,
            AgentShieldError::TooManySpendEntries
        );

        self.rolling_spends.push(SpendEntry {
            token_mint,
            amount_spent: amount,
            timestamp,
        });

        Ok(())
    }

    /// Record a transaction in the audit log (ring buffer)
    pub fn record_transaction(&mut self, record: TransactionRecord) {
        if self.recent_transactions.len() >= MAX_RECENT_TRANSACTIONS {
            self.recent_transactions.remove(0);
        }
        self.recent_transactions.push(record);
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct SpendEntry {
    pub token_mint: Pubkey,
    pub amount_spent: u64,
    pub timestamp: i64,
}

impl SpendEntry {
    /// 32 + 8 + 8 = 48 bytes
    pub const SIZE: usize = 32 + 8 + 8;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct TransactionRecord {
    pub timestamp: i64,
    pub action_type: ActionType,
    pub token_mint: Pubkey,
    pub amount: u64,
    pub protocol: Pubkey,
    pub success: bool,
    pub slot: u64,
}

impl TransactionRecord {
    /// 8 + 1 + 32 + 8 + 32 + 1 + 8 = 90 bytes
    pub const SIZE: usize = 8 + 1 + 32 + 8 + 32 + 1 + 8;
}
