use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

#[account]
pub struct AdvancedReserveVault {
    pub authority: Pubkey,              // Multisig authority
    pub ert_mint: Pubkey,               // $ERT mint
    pub backing_mints: Vec<Pubkey>,     // $TEOS, gold proxy, etc.
    pub collateral_ratio: u64,          // e.g., 150% over-collateralization (15000 = 150%)
    pub current_peg: u64,               // Current $ERT value in USD (from oracle)
    pub total_reserves: u64,            // Total backing value
    pub last_audit_timestamp: i64,      // For AI audit triggers
    pub zk_proof_hash: [u8; 32],        // Hash of zk-SNARK proof for private reserves
}

#[account]
pub struct MiningStake {
    pub user: Pubkey,                   // Staker's pubkey
    pub level: u8,                      // 1-5 referral levels
    pub staked_amount: u64,             // $ERT or $TEOS staked
    pub rewards_claimed: u64,           // Total rewards
    pub referral_tree: Vec<Pubkey>,     // On-chain referral links (limited to 5 levels)
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct OraclePrice {
    pub price: u64,                     // Price in USD * 1e6 (Pyth format)
    pub confidence: u64,                // Pyth confidence interval
    pub timestamp: i64,
}
