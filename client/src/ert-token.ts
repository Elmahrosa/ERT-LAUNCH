import * as anchor from '@coral-xyz/anchor';
import { Program, web3 } from '@solana/web3.js';

export class ERTToken {
    private program: Program;
    private wallet: anchor.Wallet;

    constructor(provider: anchor.AnchorProvider) {
        this.program = anchor.workspace.ErtStablecoin as Program;
        this.wallet = provider.wallet;
    }

    async mint(amount: number) {
        const vault = web3.PublicKey.findProgramAddressSync(
            [Buffer.from('vault')],
            this.program.programId
        )[0];

        await this.program.methods
            .mintErt(new anchor.BN(amount))
            .accounts({
                vault,
                ertMint: new web3.PublicKey('ERT_MINT_ADDRESS'),  // Replace
                userToken: /* User's token account */,
                mintAuthority: this.wallet.publicKey,
                tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
            })
            .signers([this.wallet.payer])
            .rpc();

        console.log(`Minted ${amount} $ERT`);
    }
}
