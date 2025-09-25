use anchor_lang::prelude::*;
use crate::instructions::*;
use crate::state::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");  // Your ID

#[program]
pub mod ert_stablecoin {
    use super::*;

    pub fn initialize_vault(ctx: Context<InitializeVault>, collateral_ratio: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.multisig.key();
        vault.ert_mint = ctx.accounts.ert_mint.key();
        vault.backing_mints = vec![ctx.accounts.teos_mint.key(), ctx.accounts.gold_proxy.key()];
        vault.collateral_ratio = collateral_ratio;
        vault.current_peg = 1_000_000;  // $1.00 * 1e6
        vault.total_reserves = 0;
        vault.zk_proof_hash = [0u8; 32];  // Initialize
        Ok(())
    }

    pub fn advanced_mint_ert(ctx: Context<AdvancedMint>, amount: u64, zk_proof: Vec<u8>) -> Result<()> {
        instructions::advanced_mint_ert(ctx, amount, zk_proof)
    }

    pub fn claim_mining_rewards(ctx: Context<ClaimRewards>, level: u8) -> Result<()> {
        instructions::claim_mining_rewards(ctx, level)
    }

    pub fn update_reserves_with_ai_audit(ctx: Context<UpdateReserves>, audit_report: Vec<u8>) -> Result<()> {
        instructions::update_reserves_with_ai_audit(ctx, audit_report)
    }

    // Add more: e.g., burn_ert, governance_vote
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(init, payer = payer, space = 8 + 1 + 32*3 + 8*4 + 32)]  // Adjust space
    pub vault: Account<'info, AdvancedReserveVault>,
    pub ert_mint: Account<'info, Mint>,
    pub teos_mint: Account<'info, Mint>,
    pub gold_proxy: Account<'info, Mint>,  // Proxy for gold-backed token
    /// CHECK: Multisig for governance
    pub multisig: AccountInfo<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AdvancedMint<'info> {
    #[account(mut)]
    pub vault: Account<'info, AdvancedReserveVault>,
    #[account(mut)]
    pub ert_mint: Account<'info, Mint>,
    #[account(mut)]
    pub user_token: Account<'info, anchor_spl::token::TokenAccount>,
    /// CHECK: Pyth price account for $TEOS/USD
    #[account(mut)]
    pub pyth_price: AccountInfo<'info>,
    /// CHECK: Multisig signer
    pub multisig: Signer<'info>,
    pub token_program: Program<'info, anchor_spl::token::Token>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(mut)]
    pub stake: Account<'info, MiningStake>,
    #[account(mut)]
    pub user_token: Account<'info, anchor_spl::token::TokenAccount>,
    pub vault: Account<'info, AdvancedReserveVault>,
    pub token_program: Program<'info, anchor_spl::token::Token>,
}

#[derive(Accounts)]
pub struct UpdateReserves<'info> {
    #[account(mut)]
    pub vault: Account<'info, AdvancedReserveVault>,
    pub ai_oracle: Signer<'info>,  // Off-chain AI signer (via backend)
}
