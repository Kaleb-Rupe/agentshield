pub mod vault;
pub mod policy;
pub mod tracker;
pub mod session;

pub use vault::*;
pub use policy::*;
pub use tracker::*;
pub use session::*;

/// Maximum number of allowed tokens in a policy
pub const MAX_ALLOWED_TOKENS: usize = 10;

/// Maximum number of allowed protocols in a policy
pub const MAX_ALLOWED_PROTOCOLS: usize = 10;

/// Maximum number of recent transactions stored on-chain
pub const MAX_RECENT_TRANSACTIONS: usize = 50;

/// Maximum number of rolling spend entries
pub const MAX_SPEND_ENTRIES: usize = 100;

/// Rolling window duration in seconds (24 hours)
pub const ROLLING_WINDOW_SECONDS: i64 = 86_400;

/// Session expiry in slots (~20 slots ≈ 8 seconds)
pub const SESSION_EXPIRY_SLOTS: u64 = 20;

/// Fee rate denominator — fee_rate / 1,000,000 = fractional fee
pub const FEE_RATE_DENOMINATOR: u64 = 1_000_000;

/// Protocol fee rate: 20 / 1,000,000 = 0.002% = 0.2 BPS (hardcoded)
pub const PROTOCOL_FEE_RATE: u16 = 20;

/// Maximum developer fee rate: 50 / 1,000,000 = 0.005% = 0.5 BPS
pub const MAX_DEVELOPER_FEE_RATE: u16 = 50;

/// Protocol treasury address (devnet placeholder — replace before mainnet)
/// Base58: ASHie1dFTnDSnrHMPGmniJhMgfJVGPm3rAaEPnrtWDiT
pub const PROTOCOL_TREASURY: Pubkey = Pubkey::new_from_array([
    140, 51, 155, 5, 120, 99, 25, 69,
    20, 4, 163, 87, 229, 124, 111, 239,
    107, 28, 230, 192, 254, 239, 33, 251,
    37, 93, 179, 29, 45, 226, 14, 172,
]);

/// Vault status enum
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum VaultStatus {
    /// Vault is active, agent can execute actions
    Active,
    /// Vault is frozen (kill switch activated), no agent actions allowed
    Frozen,
    /// Vault is closed, all funds withdrawn, PDAs can be reclaimed
    Closed,
}

impl Default for VaultStatus {
    fn default() -> Self {
        VaultStatus::Active
    }
}

/// Action types that agents can request
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum ActionType {
    /// Token swap (e.g., Jupiter)
    Swap,
    /// Open a perpetual position (e.g., Flash Trade)
    OpenPosition,
    /// Close a perpetual position
    ClosePosition,
    /// Increase position size
    IncreasePosition,
    /// Decrease position size
    DecreasePosition,
    /// Deposit into a lending/yield protocol (e.g., Kamino)
    Deposit,
    /// Withdraw from a lending/yield protocol
    Withdraw,
}

use anchor_lang::prelude::*;
