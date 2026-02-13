use anchor_lang::prelude::*;
use super::{MAX_ALLOWED_TOKENS, MAX_ALLOWED_PROTOCOLS};

#[account]
pub struct PolicyConfig {
    /// Associated vault pubkey
    pub vault: Pubkey,

    /// Maximum spend per rolling 24h period (in token base units)
    pub daily_spending_cap: u64,

    /// Maximum single transaction size (in token base units)
    pub max_transaction_size: u64,

    /// Allowed token mints the agent can interact with
    /// Bounded to MAX_ALLOWED_TOKENS entries
    pub allowed_tokens: Vec<Pubkey>,

    /// Allowed program IDs the agent can call (Jupiter, Flash Trade, etc.)
    /// Bounded to MAX_ALLOWED_PROTOCOLS entries
    pub allowed_protocols: Vec<Pubkey>,

    /// Maximum leverage multiplier in basis points (e.g., 10000 = 100x, 1000 = 10x)
    /// Set to 0 to disallow leveraged positions entirely
    pub max_leverage_bps: u16,

    /// Whether the agent can open new positions (vs only close existing)
    pub can_open_positions: bool,

    /// Maximum number of concurrent open positions
    pub max_concurrent_positions: u8,

    /// Developer fee rate (rate / 1,000,000). Applied to every finalized
    /// transaction. Fee deducted from vault, transferred to vault's
    /// fee_destination. Max MAX_DEVELOPER_FEE_RATE (50 = 0.5 BPS).
    /// Set to 0 for no developer fee. Protocol fee is always applied
    /// separately at PROTOCOL_FEE_RATE.
    pub developer_fee_rate: u16,

    /// Bump seed for PDA
    pub bump: u8,
}

impl PolicyConfig {
    /// Account discriminator (8) + vault (32) + daily_cap (8) + max_tx (8) +
    /// allowed_tokens vec (4 + 32 * MAX) + allowed_protocols vec (4 + 32 * MAX) +
    /// max_leverage (2) + can_open (1) + max_positions (1) +
    /// developer_fee_rate (2) + bump (1)
    pub const SIZE: usize = 8 + 32 + 8 + 8 
        + (4 + 32 * MAX_ALLOWED_TOKENS) 
        + (4 + 32 * MAX_ALLOWED_PROTOCOLS) 
        + 2 + 1 + 1 + 2 + 1;

    pub fn is_token_allowed(&self, mint: &Pubkey) -> bool {
        self.allowed_tokens.contains(mint)
    }

    pub fn is_protocol_allowed(&self, program_id: &Pubkey) -> bool {
        self.allowed_protocols.contains(program_id)
    }

    pub fn is_leverage_within_limit(&self, leverage_bps: u16) -> bool {
        leverage_bps <= self.max_leverage_bps
    }
}
