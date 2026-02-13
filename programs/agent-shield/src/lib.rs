use anchor_lang::prelude::*;

pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("4ZeVCqnjUgUtFrHHPG7jELUxvJeoVGHhGNgPrhBPwrHL");

#[program]
pub mod agent_shield {
    use super::*;

    /// Initialize a new agent vault with policy configuration.
    /// Only the owner can call this. Creates vault PDA, policy PDA, and spend tracker PDA.
    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        vault_id: u64,
        daily_spending_cap: u64,
        max_transaction_size: u64,
        allowed_tokens: Vec<Pubkey>,
        allowed_protocols: Vec<Pubkey>,
        max_leverage_bps: u16,
        max_concurrent_positions: u8,
        developer_fee_rate: u16,
    ) -> Result<()> {
        instructions::initialize_vault::handler(
            ctx,
            vault_id,
            daily_spending_cap,
            max_transaction_size,
            allowed_tokens,
            allowed_protocols,
            max_leverage_bps,
            max_concurrent_positions,
            developer_fee_rate,
        )
    }

    /// Deposit SPL tokens into the vault's PDA-controlled token account.
    /// Only the owner can call this.
    pub fn deposit_funds(ctx: Context<DepositFunds>, amount: u64) -> Result<()> {
        instructions::deposit_funds::handler(ctx, amount)
    }

    /// Register an agent's signing key to this vault.
    /// Only the owner can call this. One agent per vault.
    pub fn register_agent(ctx: Context<RegisterAgent>, agent: Pubkey) -> Result<()> {
        instructions::register_agent::handler(ctx, agent)
    }

    /// Update the policy configuration for a vault.
    /// Only the owner can call this. Cannot be called by the agent.
    pub fn update_policy(
        ctx: Context<UpdatePolicy>,
        daily_spending_cap: Option<u64>,
        max_transaction_size: Option<u64>,
        allowed_tokens: Option<Vec<Pubkey>>,
        allowed_protocols: Option<Vec<Pubkey>>,
        max_leverage_bps: Option<u16>,
        can_open_positions: Option<bool>,
        max_concurrent_positions: Option<u8>,
        developer_fee_rate: Option<u16>,
    ) -> Result<()> {
        instructions::update_policy::handler(
            ctx,
            daily_spending_cap,
            max_transaction_size,
            allowed_tokens,
            allowed_protocols,
            max_leverage_bps,
            can_open_positions,
            max_concurrent_positions,
            developer_fee_rate,
        )
    }

    /// Core permission check. Called by the agent before a DeFi action.
    /// Validates the action against all policy constraints.
    /// If approved, creates a SessionAuthority PDA and updates spend tracking.
    /// If denied, reverts the entire transaction (including subsequent DeFi instructions).
    pub fn validate_and_authorize(
        ctx: Context<ValidateAndAuthorize>,
        action_type: state::ActionType,
        token_mint: Pubkey,
        amount: u64,
        target_protocol: Pubkey,
        leverage_bps: Option<u16>,
    ) -> Result<()> {
        instructions::validate_and_authorize::handler(
            ctx,
            action_type,
            token_mint,
            amount,
            target_protocol,
            leverage_bps,
        )
    }

    /// Finalize a session after the DeFi action completes.
    /// Closes the SessionAuthority PDA and records the transaction in the audit log.
    /// Can be called by the agent or permissionlessly (for cleanup of expired sessions).
    pub fn finalize_session(ctx: Context<FinalizeSession>, success: bool) -> Result<()> {
        instructions::finalize_session::handler(ctx, success)
    }

    /// Kill switch. Immediately freezes the vault, preventing all agent actions.
    /// Only the owner can call this. Funds can still be withdrawn by the owner.
    pub fn revoke_agent(ctx: Context<RevokeAgent>) -> Result<()> {
        instructions::revoke_agent::handler(ctx)
    }

    /// Reactivate a frozen vault. Optionally rotate the agent key.
    /// Only the owner can call this.
    pub fn reactivate_vault(
        ctx: Context<ReactivateVault>,
        new_agent: Option<Pubkey>,
    ) -> Result<()> {
        instructions::reactivate_vault::handler(ctx, new_agent)
    }

    /// Withdraw tokens from the vault back to the owner.
    /// Works in any vault status (Active or Frozen). Only the owner can call this.
    pub fn withdraw_funds(ctx: Context<WithdrawFunds>, amount: u64) -> Result<()> {
        instructions::withdraw_funds::handler(ctx, amount)
    }

    /// Close the vault entirely. Withdraws all remaining funds and closes all PDAs.
    /// Reclaims rent. Vault must have no open positions. Only the owner can call this.
    pub fn close_vault(ctx: Context<CloseVault>) -> Result<()> {
        instructions::close_vault::handler(ctx)
    }
}
