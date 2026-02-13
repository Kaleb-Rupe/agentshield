use anchor_lang::prelude::*;
use crate::state::ActionType;

#[event]
pub struct VaultCreated {
    pub vault: Pubkey,
    pub owner: Pubkey,
    pub vault_id: u64,
    pub timestamp: i64,
}

#[event]
pub struct FundsDeposited {
    pub vault: Pubkey,
    pub token_mint: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct AgentRegistered {
    pub vault: Pubkey,
    pub agent: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct PolicyUpdated {
    pub vault: Pubkey,
    pub daily_cap: u64,
    pub max_transaction_size: u64,
    pub allowed_tokens_count: u8,
    pub allowed_protocols_count: u8,
    pub max_leverage_bps: u16,
    pub developer_fee_rate: u16,
    pub timestamp: i64,
}

#[event]
pub struct ActionAuthorized {
    pub vault: Pubkey,
    pub agent: Pubkey,
    pub action_type: ActionType,
    pub token_mint: Pubkey,
    pub amount: u64,
    pub protocol: Pubkey,
    pub rolling_spend_after: u64,
    pub daily_cap: u64,
    pub timestamp: i64,
}

#[event]
pub struct ActionDenied {
    pub vault: Pubkey,
    pub agent: Pubkey,
    pub reason: String,
    pub timestamp: i64,
}

#[event]
pub struct SessionFinalized {
    pub vault: Pubkey,
    pub agent: Pubkey,
    pub success: bool,
    pub timestamp: i64,
}

#[event]
pub struct AgentRevoked {
    pub vault: Pubkey,
    pub agent: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct VaultReactivated {
    pub vault: Pubkey,
    pub new_agent: Option<Pubkey>,
    pub timestamp: i64,
}

#[event]
pub struct FundsWithdrawn {
    pub vault: Pubkey,
    pub token_mint: Pubkey,
    pub amount: u64,
    pub destination: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct FeesCollected {
    pub vault: Pubkey,
    pub token_mint: Pubkey,
    pub protocol_fee_amount: u64,
    pub developer_fee_amount: u64,
    pub protocol_fee_rate: u16,
    pub developer_fee_rate: u16,
    pub transaction_amount: u64,
    pub protocol_treasury: Pubkey,
    pub developer_fee_destination: Pubkey,
    pub cumulative_developer_fees: u64,
    pub timestamp: i64,
}

#[event]
pub struct VaultClosed {
    pub vault: Pubkey,
    pub owner: Pubkey,
    pub timestamp: i64,
}
