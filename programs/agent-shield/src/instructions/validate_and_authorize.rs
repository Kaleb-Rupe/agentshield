use anchor_lang::prelude::*;

use crate::state::*;
use crate::errors::AgentShieldError;
use crate::events::ActionAuthorized;

#[derive(Accounts)]
pub struct ValidateAndAuthorize<'info> {
    #[account(mut)]
    pub agent: Signer<'info>,

    #[account(
        mut,
        constraint = vault.is_agent(&agent.key()) @ AgentShieldError::UnauthorizedAgent,
        seeds = [b"vault", vault.owner.as_ref(), vault.vault_id.to_le_bytes().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, AgentVault>,

    #[account(
        has_one = vault,
        seeds = [b"policy", vault.key().as_ref()],
        bump = policy.bump,
    )]
    pub policy: Account<'info, PolicyConfig>,

    #[account(
        mut,
        has_one = vault,
        seeds = [b"tracker", vault.key().as_ref()],
        bump = tracker.bump,
    )]
    pub tracker: Account<'info, SpendTracker>,

    /// Ephemeral session PDA — `init` ensures no double-authorization
    #[account(
        init,
        payer = agent,
        space = SessionAuthority::SIZE,
        seeds = [b"session", vault.key().as_ref(), agent.key().as_ref()],
        bump,
    )]
    pub session: Account<'info, SessionAuthority>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<ValidateAndAuthorize>,
    action_type: ActionType,
    token_mint: Pubkey,
    amount: u64,
    target_protocol: Pubkey,
    leverage_bps: Option<u16>,
) -> Result<()> {
    let vault = &ctx.accounts.vault;
    let policy = &ctx.accounts.policy;
    let clock = Clock::get()?;

    // 1. Vault must be active
    require!(vault.is_active(), AgentShieldError::VaultNotActive);

    // 1b. Amount must be positive
    require!(amount > 0, AgentShieldError::TransactionTooLarge);

    // 2. Token must be whitelisted
    require!(
        policy.is_token_allowed(&token_mint),
        AgentShieldError::TokenNotAllowed
    );

    // 3. Protocol must be whitelisted
    require!(
        policy.is_protocol_allowed(&target_protocol),
        AgentShieldError::ProtocolNotAllowed
    );

    // 4. Single transaction size check
    require!(
        amount <= policy.max_transaction_size,
        AgentShieldError::TransactionTooLarge
    );

    // 5. Rolling 24h spend check
    let tracker = &mut ctx.accounts.tracker;
    let rolling_spend = tracker.get_rolling_spend(&token_mint, clock.unix_timestamp)?;
    let new_total = rolling_spend
        .checked_add(amount)
        .ok_or(AgentShieldError::Overflow)?;
    require!(
        new_total <= policy.daily_spending_cap,
        AgentShieldError::DailyCapExceeded
    );

    // 6. Leverage check (for perp actions)
    if let Some(lev) = leverage_bps {
        require!(
            policy.is_leverage_within_limit(lev),
            AgentShieldError::LeverageTooHigh
        );
    }

    // 7. Position opening checks
    if action_type == ActionType::OpenPosition {
        require!(
            policy.can_open_positions,
            AgentShieldError::PositionOpeningDisallowed
        );
        require!(
            vault.open_positions < policy.max_concurrent_positions,
            AgentShieldError::TooManyPositions
        );
    }

    // All checks passed — record spend and create session
    tracker.record_spend(token_mint, amount, clock.unix_timestamp)?;

    let session = &mut ctx.accounts.session;
    session.vault = vault.key();
    session.agent = ctx.accounts.agent.key();
    session.authorized = true;
    session.authorized_amount = amount;
    session.authorized_token = token_mint;
    session.authorized_protocol = target_protocol;
    session.action_type = action_type;
    session.expires_at_slot = SessionAuthority::calculate_expiry(clock.slot);
    session.bump = ctx.bumps.session;

    emit!(ActionAuthorized {
        vault: vault.key(),
        agent: ctx.accounts.agent.key(),
        action_type,
        token_mint,
        amount,
        protocol: target_protocol,
        rolling_spend_after: new_total,
        daily_cap: policy.daily_spending_cap,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}
