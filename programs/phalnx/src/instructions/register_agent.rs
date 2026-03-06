use anchor_lang::prelude::*;

use crate::errors::PhalnxError;
use crate::events::AgentRegistered;
use crate::state::*;

#[derive(Accounts)]
pub struct RegisterAgent<'info> {
    pub owner: Signer<'info>,

    #[account(
        mut,
        has_one = owner @ PhalnxError::UnauthorizedOwner,
        seeds = [b"vault", owner.key().as_ref(), vault.vault_id.to_le_bytes().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, AgentVault>,

    /// Agent spend overlay (shard 0) — for claiming a per-agent tracking slot.
    #[account(
        mut,
        seeds = [b"agent_spend", vault.key().as_ref(), &[0u8]],
        bump,
    )]
    pub agent_spend_overlay: AccountLoader<'info, AgentSpendOverlay>,
}

pub fn handler(
    ctx: Context<RegisterAgent>,
    agent: Pubkey,
    permissions: u64,
    spending_limit_usd: u64,
) -> Result<()> {
    let vault = &mut ctx.accounts.vault;

    require!(
        vault.status != VaultStatus::Closed,
        PhalnxError::VaultAlreadyClosed
    );
    require!(
        permissions & !FULL_PERMISSIONS == 0,
        PhalnxError::InvalidPermissions
    );
    require!(!vault.is_agent(&agent), PhalnxError::AgentAlreadyRegistered);
    require!(
        vault.agent_count() < MAX_AGENTS_PER_VAULT,
        PhalnxError::MaxAgentsReached
    );
    require!(agent != Pubkey::default(), PhalnxError::InvalidAgentKey);
    require!(agent != vault.owner, PhalnxError::AgentIsOwner);

    vault.agents.push(AgentEntry {
        pubkey: agent,
        permissions,
        spending_limit_usd,
    });

    // Try to claim a slot in the overlay for per-agent tracking.
    // If shard 0 is full (7 agents), silently continue — agents 8-10
    // won't have per-agent tracking but vault-wide cap still applies.
    if let Ok(mut overlay) = ctx.accounts.agent_spend_overlay.load_mut() {
        if overlay.find_agent_slot(&agent).is_none() {
            let _ = overlay.claim_slot(&agent);
        }
    }

    let clock = Clock::get()?;
    emit!(AgentRegistered {
        vault: vault.key(),
        agent,
        permissions,
        spending_limit_usd,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}
