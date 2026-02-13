use anchor_lang::prelude::*;

use crate::state::*;
use crate::errors::AgentShieldError;
use crate::events::AgentRevoked;

#[derive(Accounts)]
pub struct RevokeAgent<'info> {
    pub owner: Signer<'info>,

    #[account(
        mut,
        has_one = owner @ AgentShieldError::UnauthorizedOwner,
        seeds = [b"vault", owner.key().as_ref(), vault.vault_id.to_le_bytes().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, AgentVault>,
}

pub fn handler(ctx: Context<RevokeAgent>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;

    require!(
        vault.status != VaultStatus::Closed,
        AgentShieldError::VaultAlreadyClosed
    );

    let agent = vault.agent;
    vault.status = VaultStatus::Frozen;
    // Clear agent key so compromised keys can't be reactivated accidentally
    vault.agent = Pubkey::default();

    let clock = Clock::get()?;
    emit!(AgentRevoked {
        vault: vault.key(),
        agent,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}
