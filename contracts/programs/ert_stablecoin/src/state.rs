use anchor_lang::prelude::*;

#[account]
pub struct AdvancedReserveVault {
    pub authority: Pubkey,      // Multisig
    pub total_reserves: u64,    // In USD equiv (6 decimals)
    pub current_peg: u64,       // e.g., 1_000_000 = $1.00
    pub zk_proof_hash: [u8; 32], // ZK proof hash
    pub ai_audit_hash: [u8; 32], // AI report hash
    pub bump: u8,
}

#[account]
pub struct MiningStake {
    pub owner: Pubkey,
    pub amount: u64,            // Staked $ERT
    pub level: u8,              // 1-5
    pub referral_tree: Vec<Pubkey>, // Max 5 deep
    pub last_claim: i64,        // Timestamp
    pub bump: u8,
}
