use anchor_lang::{prelude::*, solana_program::clock::Clock};
use ert_stablecoin::prelude::*;
use pyth_sdk_solana::test_utils::create_price_feed;  // Mock oracle

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_advanced_mint_with_zk() {
        let mut ctx = mock_context();  // Use Anchor's test utils
        let amount = 1000u64;
        let mock_zk_proof = vec![1u8; 64];  // Dummy proof

        // Mock oracle price
        let oracle_price = OraclePrice { price: 1_000_000, confidence: 1000, timestamp: 0 };

        // Initialize vault with sufficient reserves
        let mut vault = AdvancedReserveVault::default();
        vault.total_reserves = amount * 2;  // Over-collateralized

        // Call mint
        advanced_mint_ert(&mut ctx, amount, mock_zk_proof).unwrap();

        // Assert: Reserves deducted, $ERT minted
        assert_eq!(vault.total_reserves, amount);  // After deduction
    }

    #[test]
    #[should_panic(expected = "InsufficientCollateral")]
    fn test_mint_insufficient_collateral() {
        // Similar setup but reserves < required
        // ... (expect panic)
    }

    // Add tests for rewards, peg adjustment, zk verification
}
