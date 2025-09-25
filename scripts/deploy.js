const anchor = require('@coral-xyz/anchor');
const { SystemProgram } = anchor.web3;

async function main() {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.ErtStablecoin;
    const vaultKeypair = anchor.web3.Keypair.generate();

    await program.methods
        .initializeVault(new anchor.BN(1000000))  // Initial supply
        .accounts({
            vault: vaultKeypair.publicKey,
            backingMint: new anchor.web3.PublicKey('TEOS_MINT_ADDRESS'),  // Replace
            payer: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
        })
        .signers([vaultKeypair])
        .rpc();

    console.log('Vault deployed to:', vaultKeypair.publicKey.toString());
}

main().catch(console.error);
