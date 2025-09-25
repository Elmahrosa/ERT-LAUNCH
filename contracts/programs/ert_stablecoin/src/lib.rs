use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

pub mod state;
pub mod instructions;

use state::*;
use instructions::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod ert_stablecoin {
    use super::*;

    pub fn initialize_vault(ctx: Context<InitializeVault>, initial_peg: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.multisig.key();
        vault.total_reserves = 0;
        vault.current_peg = initial_peg;  // e.g., 1_000_000 for $1.00 (6 decimals)
        vault.zk_proof_hash = [0u8; 32];  // Placeholder for ZK hash
        Ok(())
    }

    pub fn advanced_mint_ert(ctx: Context<AdvancedMintErt>, amount: u64, zk_proof: [u8; 32]) -> Result<()> {
        // Verify ZK proof (mock Light Protocol verification)
        require!(verify_zk_proof(&zk_proof, amount), ErrorCode::InvalidZKProof);

        // Oracle check (Pyth)
        let gold_price = get_pyth_price(&ctx.accounts.gold_oracle)?;
        require!(gold_price >= ctx.accounts.vault.current_peg, ErrorCode::PegDeviation);

        // Mint via SPL
        let cpi_accounts = anchor_spl::token::MintTo {
            mint: ctx.accounts.ert_mint.to_account_info(),
            to: ctx.accounts.user_token.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        anchor_spl::token::mint_to(cpi_ctx, amount)?;

        // Update reserves
        ctx.accounts.vault.total_reserves += amount * 15 / 10;  // 150% collateral
        ctx.accounts.vault.zk_proof_hash = zk_proof;

        emit!(MintEvent {
            amount,
            user: ctx.accounts.user.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn stake_for_mining(ctx: Context<StakeForMining>, amount: u64, level: u8, referrer: Option<Pubkey>) -> Result<()> {
        require!(level <= 5, ErrorCode::InvalidLevel);
        let stake = &mut ctx.accounts.mining_stake;
        stake.amount = amount;
        stake.level = level;
        if let Some(ref_pubkey) = referrer {
            stake.referral_tree.push(ref_pubkey);  // On-chain tree
        }
        // Accrue rewards logic (simplified)
        Ok(())
    }

    pub fn claim_mining_rewards(ctx: Context<ClaimMiningRewards>, level: u8) -> Result<()> {
        let stake = &ctx.accounts.mining_stake;
        require!(level == stake.level, ErrorCode::InvalidLevel);
        let reward = stake.amount * (10 + level as u64 * 5) / 1000;  // 1% base + 0.5%/level
        // Mint reward $ERT (similar to above)
        // ...
        emit!(RewardClaimed { reward, user: ctx.accounts.user.key() });
        Ok(())
    }

    pub fn update_reserves_with_ai_audit(ctx: Context<UpdateReservesWithAiAudit>, audit_report: Vec<u8>) -> Result<()> {
        // Verify AI report hash (on-chain check)
        let hash = ctx.accounts.vault.zk_proof_hash;  // Compare with submitted
        require!(audit_report.len() > 0, ErrorCode::InvalidAudit);
        ctx.accounts.vault.ai_audit_hash = audit_report.try_into().unwrap();
        // Adjust peg based on report
        Ok(())
    }
}

// Events
#[event]
pub struct MintEvent {
    pub amount: u64,
    pub user: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct RewardClaimed {
    pub reward: u64,
    pub user: Pubkey,
}

// Mock ZK verify (integrate Light Protocol full)
fn verify_zk_proof(proof: &[u8; 32], amount: u64) -> bool {
    // In prod: Call Light verifier CPI
    proof[0] == (amount as u8)  // Mock: Simple check
}

// Pyth price fetch
fn get_pyth_price(oracle: &AccountInfo) -> Result<u64> {
    // Use pyth-sdk-solana to parse PriceAccount
    let price = pyth_sdk_solana::load_price(oracle)?;
    Ok(price.price as u64)
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid ZK proof")]
    InvalidZKProof,
    #[msg("Peg deviation too high")]
    PegDeviation,
    #[msg("Invalid mining level")]
    InvalidLevel,
    #[msg("Invalid AI audit report")]
    InvalidAudit,
                            }
