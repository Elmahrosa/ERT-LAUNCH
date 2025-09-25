use anchor_lang::prelude::*;

#[error_code]
pub enum AdvancedError {
    #[msg("Insufficient collateral for minting")]
    InsufficientCollateral,
    #[msg("Oracle price stale or invalid")]
    InvalidOracle,
    #[msg("ZK proof verification failed")]
    ZKProofFailed,
    #[msg("Mining level exceeds max (5)")]
    InvalidMiningLevel,
    #[msg("Governance multisig not approved")]
    UnauthorizedGovernance,
}
