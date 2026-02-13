use anchor_lang::prelude::*;
use super::{SESSION_EXPIRY_SLOTS, ActionType};

#[account]
pub struct SessionAuthority {
    /// Associated vault
    pub vault: Pubkey,

    /// The agent who initiated this session
    pub agent: Pubkey,

    /// Whether this session has been authorized by the permission check
    pub authorized: bool,

    /// Authorized action details (for verification in finalize)
    pub authorized_amount: u64,
    pub authorized_token: Pubkey,
    pub authorized_protocol: Pubkey,

    /// The action type that was authorized (stored so finalize can record it)
    pub action_type: ActionType,

    /// Slot-based expiry: session is valid until this slot
    pub expires_at_slot: u64,

    /// Bump seed for PDA
    pub bump: u8,
}

impl SessionAuthority {
    /// discriminator (8) + vault (32) + agent (32) + authorized (1) +
    /// amount (8) + token (32) + protocol (32) + action_type (1) + expires (8) + bump (1)
    pub const SIZE: usize = 8 + 32 + 32 + 1 + 8 + 32 + 32 + 1 + 8 + 1;

    pub fn is_expired(&self, current_slot: u64) -> bool {
        current_slot > self.expires_at_slot
    }

    pub fn is_valid(&self, current_slot: u64) -> bool {
        self.authorized && !self.is_expired(current_slot)
    }

    /// Calculate the expiry slot from a given current slot
    pub fn calculate_expiry(current_slot: u64) -> u64 {
        // Saturating add to prevent overflow
        current_slot.saturating_add(SESSION_EXPIRY_SLOTS)
    }
}
