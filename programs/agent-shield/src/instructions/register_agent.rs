use anchor_lang::prelude::*;

use crate::state::*;
use crate::errors::AgentShieldError;
use crate::events::AgentRegistered;

#[derive(Accounts)]
pub struct RegisterAgent<'info> {
    pub owner: Signer<'info>,

    #[account(
        mut,
        has_one = owner @ AgentShieldError::UnauthorizedOwner,
        seeds = [b"vault", owner.key().as_ref(), vault.vault_id.to_le_bytes().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, AgentVault>,
}

pub fn handler(ctx: Context<RegisterAgent>, agent: Pubkey) -> Result<()> {
    let vault = &mut ctx.accounts.vault;

    require!(
        vault.status != VaultStatus::Closed,
        AgentShieldError::VaultAlreadyClosed
    );
    require!(
        !vault.has_agent(),
        AgentShieldError::AgentAlreadyRegistered
    );
    require!(
        agent != Pubkey::default(),
        AgentShieldError::InvalidAgentKey
    );
    require!(
        agent != vault.owner,
        AgentShieldError::AgentIsOwner
    );

    vault.agent = agent;

    let clock = Clock::get()?;
    emit!(AgentRegistered {
        vault: vault.key(),
        agent,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}
