const anchor = require('@coral-xyz/anchor');
const { PublicKey, Keypair } = require('@solana/web3.js');
const pyth = require('@pythnetwork/client');  // For feed setup

async function main() {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.ErtStablecoin;

    // Generate keys
    const vaultKp = Keypair.generate();
    const multisig = Keypair.generate();  // For governance

    // Get Pyth feeds (gold/USD, SOL/USD)
    const goldFeedId = new PublicKey('YOUR_GOLD_PYTH_FEED_ID');  // e.g., from pyth.network
    console.log('Gold Feed:', goldFeedId.toString());

    await program.methods
        .initializeVault(new anchor.BN(15000))  // 150% ratio
        .accounts({
            vault: vaultKp.publicKey,
            ertMint: new PublicKey('YOUR_ERT_MINT'),
            teosMint: new PublicKey('YOUR_TEOS_MINT'),
            goldProxy: new PublicKey('GOLD_PROXY_MINT'),  // If using a wrapped gold token
            multisig: multisig.publicKey,
            payer: provider.wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([vaultKp, multisig])
        .rpc();

    console.log('Advanced Vault Deployed:', vaultKp.publicKey.toString());
    // Save to config for client use
}

main().catch(console.error);
