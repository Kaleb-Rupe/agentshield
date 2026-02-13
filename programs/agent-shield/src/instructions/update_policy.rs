use anchor_lang::prelude::*;

use crate::state::*;
use crate::errors::AgentShieldError;
use crate::events::PolicyUpdated;

#[derive(Accounts)]
pub struct UpdatePolicy<'info> {
    pub owner: Signer<'info>,

    #[account(
        has_one = owner @ AgentShieldError::UnauthorizedOwner,
        seeds = [b"vault", owner.key().as_ref(), vault.vault_id.to_le_bytes().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, AgentVault>,

    #[account(
        mut,
        has_one = vault,
        seeds = [b"policy", vault.key().as_ref()],
        bump = policy.bump,
    )]
    pub policy: Account<'info, PolicyConfig>,
}

pub fn handler(
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
    let vault = &ctx.accounts.vault;
    require!(
        vault.status != VaultStatus::Closed,
        AgentShieldError::VaultAlreadyClosed
    );

    let policy = &mut ctx.accounts.policy;

    if let Some(cap) = daily_spending_cap {
        policy.daily_spending_cap = cap;
    }
    if let Some(max_tx) = max_transaction_size {
        policy.max_transaction_size = max_tx;
    }
    if let Some(tokens) = allowed_tokens {
        require!(
            tokens.len() <= MAX_ALLOWED_TOKENS,
            AgentShieldError::TooManyAllowedTokens
        );
        policy.allowed_tokens = tokens;
    }
    if let Some(protocols) = allowed_protocols {
        require!(
            protocols.len() <= MAX_ALLOWED_PROTOCOLS,
            AgentShieldError::TooManyAllowedProtocols
        );
        policy.allowed_protocols = protocols;
    }
    if let Some(leverage) = max_leverage_bps {
        policy.max_leverage_bps = leverage;
    }
    if let Some(can_open) = can_open_positions {
        policy.can_open_positions = can_open;
    }
    if let Some(max_pos) = max_concurrent_positions {
        policy.max_concurrent_positions = max_pos;
    }
    if let Some(fee_rate) = developer_fee_rate {
        require!(
            fee_rate <= MAX_DEVELOPER_FEE_RATE,
            AgentShieldError::DeveloperFeeTooHigh
        );
        policy.developer_fee_rate = fee_rate;
    }

    let clock = Clock::get()?;
    emit!(PolicyUpdated {
        vault: vault.key(),
        daily_cap: policy.daily_spending_cap,
        max_transaction_size: policy.max_transaction_size,
        allowed_tokens_count: policy.allowed_tokens.len() as u8,
        allowed_protocols_count: policy.allowed_protocols.len() as u8,
        max_leverage_bps: policy.max_leverage_bps,
        developer_fee_rate: policy.developer_fee_rate,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}
