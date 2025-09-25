const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const anchor = require('@coral-xyz/anchor');
const { PythHttpClient } = require('@pythnetwork/client');
const bs58 = require('bs58');

async function adjustPeg() {
    const connection = new Connection(process.env.RPC_URL || 'https://api.devnet.solana.com');
    anchor.setProvider(anchor.AnchorProvider.env());
    const program = anchor.workspace.ErtStablecoin;

    const vaultPubkey = new PublicKey(process.env.VAULT_PUBKEY);  // From deploy
    const pythClient = new PythHttpClient('https://hermes.pyth.network');  // Pyth endpoint

    // Fetch prices: Gold/USD and TEOS/USD (use TEOS as proxy for backing)
    const goldFeedId = 'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d';  // Real Pyth Gold/USD ID (devnet equivalent)
    const teosFeedId = 'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace';  // Example TEOS/USD (replace with actual)

    const goldPrice = await pythClient.getLatestAvailablePrice(goldFeedId);
    const teosPrice = await pythClient.getLatestAvailablePrice(teosFeedId);

    const goldValue = parseInt(goldPrice.price.price) / Math.pow(10, goldPrice.price.expo);
    const teosValue = parseInt(teosPrice.price.price) / Math.pow(10, teosPrice.price.expo);
    const combinedBackingValue = (goldValue + teosValue) / 2;  // Simplified average for $ERT peg

    // Fetch current vault state
    const vaultAccount = await program.account.advancedReserveVault.fetch(vaultPubkey);
    const currentPeg = vaultAccount.currentPeg / 1e6;  // Normalize

    const deviation = Math.abs(combinedBackingValue - currentPeg) / currentPeg * 100;
    if (deviation > 1) {  // >1% deviation triggers adjustment
        console.log(`Peg deviation: ${deviation.toFixed(2)}%. Adjusting to $${combinedBackingValue.toFixed(6)}`);

        // Generate mock AI audit report (hash of prices for on-chain)
        const auditReport = Buffer.from(JSON.stringify({ gold: goldValue, teos: teosValue })).toString('base64');

        // Call on-chain update (requires AI oracle signer keypair)
        const aiOracleKp = Keypair.fromSecretKey(bs58.decode(process.env.AI_ORACLE_KEY));
        await program.methods
            .updateReservesWithAiAudit(Buffer.from(auditReport, 'base64'))
            .accounts({
                vault: vaultPubkey,
                aiOracle: aiOracleKp.publicKey,
            })
            .signers([aiOracleKp])
            .rpc();

        console.log('Peg adjusted successfully');
    } else {
        console.log('Peg stable, no adjustment needed');
    }
}

adjustPeg().catch(console.error);
