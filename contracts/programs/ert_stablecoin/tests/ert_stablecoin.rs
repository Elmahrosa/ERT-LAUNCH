use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

declare_id!("YourProgramIDHere");  // Generate with `anchor init`

#[program]
pub mod ert_stablecoin {
    use super::*;

    pub fn initialize_vault(ctx: Context<InitializeVault>, initial_supply: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.reserve_amount = initial_supply;
        vault.backing_token = ctx.accounts.backing_mint.key();  // e.g., $TEOS mint
        Ok(())
    }

    pub fn mint_ert(ctx: Context<MintErt>, amount: u64) -> Result<()> {
        // Check backing reserves (simplified: require $TEOS deposit)
        require!(ctx.accounts.vault.reserve_amount >= amount, ErrorCode::InsufficientBacking);
        
        // Mint $ERT to user
        let cpi_accounts = anchor_spl::token::MintTo {
            mint: ctx.accounts.ert_mint.to_account_info(),
            to: ctx.accounts.user_token.to_account_info(),
            authority: ctx.accounts.mint_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        anchor_spl::token::mint_to(cpi_ctx, amount)?;

        // Update vault (deduct backing)
        ctx.accounts.vault.reserve_amount -= amount;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(init, payer = payer, space = 8 + 64)]
    pub vault: Account<'info, ReserveVault>,
    pub backing_mint: Account<'info, Mint>,  // e.g., $TEOS
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintErt<'info> {
    #[account(mut)]
    pub vault: Account<'info, ReserveVault>,
    #[account(mut)]
    pub ert_mint: Account<'info, Mint>,  // $ERT mint account
    #[account(mut)]
    pub user_token: Account<'info, TokenAccount>,
    pub mint_authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct ReserveVault {
    pub reserve_amount: u64,
    pub backing_token: Pubkey,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Insufficient backing reserves")]
    InsufficientBacking,
}
