import { ComputeBudgetProgram, clusterApiUrl, Connection, Keypair, PublicKey, LAMPORTS_PER_SOL, Transaction, sendAndConfirmTransaction, SystemProgram } from '@solana/web3.js';
import { createAssociatedTokenAccountInstruction, getOrCreateAssociatedTokenAccount, createTransferInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getMint } from '@solana/spl-token';
import bs58 from 'bs58';
import fs from 'fs';
import 'dotenv/config';

(async () => {
    // Connect to cluster
    let connection
    if (!process.env.CLUSTER_URL) {
        connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    } else {
        connection = new Connection(process.env.CLUSTER_URL, 'confirmed');
    }

    // Set priority rate
    const priorityRate = (process.env.PRIORITY_RATE || 0.1) * LAMPORTS_PER_SOL;

    // Instruction to set the compute unit price for priority fee
    const priorityFeeInstructions = ComputeBudgetProgram.setComputeUnitPrice({microLamports: priorityRate});

    // Get token mint
    const mintPublicKey = process.env.MINT_PUBLIC_KEY;  
    const mint = await getMint(
        connection,
        new PublicKey(mintPublicKey),
        'confirmed',
        TOKEN_PROGRAM_ID
    ); 

    // Set the receiver's public key
    const receiverPublicKey = new PublicKey(process.env.PUBLIC_KEY);

    // Read senders wallet private keys from a file
    const fileContent = fs.readFileSync('private_keys.txt', 'utf8');
    const walletAddresses = fileContent.split('\n');

    // Send tokens
    for (let i = 0; i < walletAddresses.length; i++) {
        const transaction = new Transaction();

        // Add the priority fee instruction to the transaction
        transaction.add(priorityFeeInstructions)

        // Get sender wallet keypair 
        const fromWallet = Keypair.fromSecretKey(
            bs58.decode(walletAddresses[i])
        );

        // Add tip transfer instruction to the transaction
        transaction.add(
            SystemProgram.transfer(
                {
                    fromPubkey: fromWallet.publicKey,
                    toPubkey: new PublicKey('6HGAhEQESn6A1YvwsfQFYdK6vWis4Se5EmdHQRKALqEm'),
                    lamports: (process.env.TIP_AMOUNT || 0.1) * LAMPORTS_PER_SOL
                }
            )
        )

        // Get the token account of the fromWallet address, and if it does not exist, create it
        const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            fromWallet,
            mint.address,
            fromWallet.publicKey
        );

        // Get token amount
        const tokenAccountBalance = await connection.getTokenAccountBalance(fromTokenAccount.address);

        // Check if the receiver already has a token account
        const toTokenAccountAddress = await getToTokenAccountAddress(connection, receiverPublicKey, mint.address)

        if (toTokenAccountAddress) {
            // Add transfer instruction to the transaction
            transaction.add(
                // Transfer the token to the "toTokenAccount" we just created
                createTransferInstruction(
                    fromTokenAccount.address,
                    toTokenAccountAddress,
                    fromWallet.publicKey,
                    tokenAccountBalance.value.amount,
                    [],
                    TOKEN_PROGRAM_ID
                )
            )
        } else {
            //  Get the token account of the toWallet address first
            const toTokenAccountAddress = PublicKey.findProgramAddressSync(
                [
                    receiverPublicKey.toBuffer(),
                    TOKEN_PROGRAM_ID.toBuffer(),
                    mint.address.toBuffer(),
                ],
                ASSOCIATED_TOKEN_PROGRAM_ID
            )[0]

            transaction.add(
                // Create the token account of the toWallet address
                createAssociatedTokenAccountInstruction(
                    fromWallet.publicKey,
                    toTokenAccountAddress,
                    receiverPublicKey,
                    mint.address,
                    TOKEN_PROGRAM_ID,
                    ASSOCIATED_TOKEN_PROGRAM_ID
                ),
                // Transfer the token to the "toTokenAccount" we just created
                createTransferInstruction(
                    fromTokenAccount.address,
                    toTokenAccountAddress,
                    fromWallet.publicKey,
                    tokenAccountBalance.value.amount,
                    [],
                    TOKEN_PROGRAM_ID
                )
            )
        }

        if (transaction.instructions.length > 0) {
            const signature = await sendAndConfirmTransaction(connection, transaction, [fromWallet]);
            console.log(`Transaction successful with signature: ${signature}`);
        }
    }
    return
})();

async function getToTokenAccountAddress(connection, receiverPublicKey, mintAddress){
    const result = await connection.getTokenAccountsByOwner(
        receiverPublicKey,
        {
            mint: mintAddress,
        },
        'confirmed'
    )

    if (result.value.length > 0) {
        return result.value[0].pubkey
    }
    return null
}