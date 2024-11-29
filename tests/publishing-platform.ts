import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublishingPlatform } from "../target/types/publishing_platform";
import { Minter } from "../target/types/minter";
import {
  Keypair,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { assert } from "chai";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);
const MINTER_PROGRAM_ID = new anchor.web3.PublicKey(
  "FWSRvbQDi4kP6x2QvkXig5XNqXsFtH7QfiW6VMjmtHGk"
);
const WRITER_ROLE = 1;
const READER_ROLE = 2;

describe("publishing-platform", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.AnchorProvider.env();

  const publishingPlatform = anchor.workspace
    .PublishingPlatform as Program<PublishingPlatform>;

  const platformAccount = anchor.web3.Keypair.generate();
  const user = provider.wallet;

  // Add these new variables for tip writer tests
  const writer = anchor.web3.Keypair.generate();
  const writerAccount = PublicKey.findProgramAddressSync(
    [Buffer.from("user"), writer.publicKey.toBuffer()],
    publishingPlatform.programId
  )[0];
  const tipper = provider.wallet;

  before(async () => {
    // Airdrop to tipper
    const airdropSignature = await provider.connection.requestAirdrop(
      tipper.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction({
      signature: airdropSignature,
      blockhash: (await provider.connection.getLatestBlockhash()).blockhash,
      lastValidBlockHeight: (
        await provider.connection.getLatestBlockhash()
      ).lastValidBlockHeight,
    });

    // Airdrop to writer
    const writerAirdropSignature = await provider.connection.requestAirdrop(
      writer.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction({
      signature: writerAirdropSignature,
      blockhash: (await provider.connection.getLatestBlockhash()).blockhash,
      lastValidBlockHeight: (
        await provider.connection.getLatestBlockhash()
      ).lastValidBlockHeight,
    });
  });

  it("Publishing Platform initialized!", async () => {
    const init_accounts = {
      platformAccount: platformAccount.publicKey,
      user: user.publicKey,
      systemProgram: SystemProgram.programId,
    };

    const tx = await publishingPlatform.methods
      .initializePlatform()
      .accounts(init_accounts)
      .signers([platformAccount])
      .rpc();

    console.log("Your transaction signature", tx);

    // Fetch the account and check its state
    const publishingPlatformAccount =
      await publishingPlatform.account.platformAccount.fetch(
        platformAccount.publicKey
      );
    assert.equal(
      publishingPlatformAccount.counter,
      0,
      "Publishing platform count should be 0"
    );
  });

  it("Can tip a writer", async () => {
    // First create writer account
    const createWriterAccounts = {
      user: writer.publicKey,
      userAccount: writerAccount,
      systemProgram: SystemProgram.programId,
    };

    await publishingPlatform.methods
      .createAccount(WRITER_ROLE)
      .accounts(createWriterAccounts)
      .signers([writer])
      .rpc();

    // Get writer's initial balance
    const writerInitialBalance = await provider.connection.getBalance(
      writer.publicKey
    );

    // Send tip to writer
    const tipAccounts = {
      reader: tipper.publicKey,
      writer: writer.publicKey,
      writerAccount: writerAccount,
      systemProgram: SystemProgram.programId,
    };

    const tipAmount = new anchor.BN(1000000); // 0.001 SOL
    const tx = await publishingPlatform.methods
      .tipWriter(tipAmount)
      .accounts(tipAccounts)
      .rpc();

    console.log("Tip transaction signature", tx);

    // Get writer's final balance
    const writerFinalBalance = await provider.connection.getBalance(
      writer.publicKey
    );

    // Verify the tip was received
    assert.equal(
      writerFinalBalance - writerInitialBalance,
      tipAmount.toNumber(),
      "Writer should receive the exact tip amount"
    );
  });

  it("Cannot tip unregistered writer", async () => {
    const unregisteredWriter = anchor.web3.Keypair.generate();

    const tipAccounts = {
      reader: tipper.publicKey,
      writer: unregisteredWriter.publicKey,
      writerAccount: writerAccount,
      systemProgram: SystemProgram.programId,
    };

    try {
      await publishingPlatform.methods
        .tipWriter(new anchor.BN(1000000))
        .accounts(tipAccounts)
        .rpc();
      assert.fail("Should not be able to tip unregistered writer");
    } catch (error) {
      assert.include(
        error.message,
        "Error",
        "Expected error when tipping unregistered writer"
      );
    }
  });

  it("Cannot tip with zero amount", async () => {
    const tipAccounts = {
      reader: tipper.publicKey,
      writer: writer.publicKey,
      writerAccount: writerAccount,
      systemProgram: SystemProgram.programId,
    };

    try {
      await publishingPlatform.methods
        .tipWriter(new anchor.BN(0))
        .accounts(tipAccounts)
        .rpc();
      assert.fail("Should not be able to tip zero amount");
    } catch (error) {
      assert.include(
        error.message,
        "Error",
        "Expected error about zero tip amount"
      );
    }
  });
});

describe("upload-content", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.AnchorProvider.env();
  const user = provider.wallet;

  const publishingPlatform = anchor.workspace
    .PublishingPlatform as Program<PublishingPlatform>;

  //const platformAccount = Keypair.generate();

  // Add these new variables for tip writer tests
  const writer = Keypair.generate();
  const writerAccount = PublicKey.findProgramAddressSync(
    [Buffer.from("user"), writer.publicKey.toBuffer()],
    publishingPlatform.programId
  )[0];

  const mintAuthority = PublicKey.findProgramAddressSync(
    [Buffer.from("authority")],
    MINTER_PROGRAM_ID
  )[0];

  const collectionKeypair = Keypair.generate();
  const collectionMint = collectionKeypair.publicKey;

  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;

  const getMetadata = async (
    mint: anchor.web3.PublicKey
  ): Promise<anchor.web3.PublicKey> => {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )[0];
  };

  const getMasterEdition = async (
    mint: anchor.web3.PublicKey
  ): Promise<anchor.web3.PublicKey> => {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
        Buffer.from("edition"),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )[0];
  };

  before(async () => {
    // Airdrop to tipper
    const airdropSignature = await provider.connection.requestAirdrop(
      user.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction({
      signature: airdropSignature,
      blockhash: (await provider.connection.getLatestBlockhash()).blockhash,
      lastValidBlockHeight: (
        await provider.connection.getLatestBlockhash()
      ).lastValidBlockHeight,
    });

    // Airdrop to writer
    const writerAirdropSignature = await provider.connection.requestAirdrop(
      writer.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction({
      signature: writerAirdropSignature,
      blockhash: (await provider.connection.getLatestBlockhash()).blockhash,
      lastValidBlockHeight: (
        await provider.connection.getLatestBlockhash()
      ).lastValidBlockHeight,
    });
  });

  it("Create Collection NFT", async () => {
    try {
      console.log("\nCollection Mint Key: ", collectionMint.toBase58());

      const metadata = await getMetadata(collectionMint);
      console.log("Collection Metadata Account: ", metadata.toBase58());

      const masterEdition = await getMasterEdition(collectionMint);
      console.log("Master Edition Account: ", masterEdition.toBase58());

      const destination = getAssociatedTokenAddressSync(
        collectionMint,
        user.publicKey
      );
      console.log("Destination ATA = ", destination.toBase58());

      const tx = await publishingPlatform.methods
        .uploadContent(
          "QmXExS4BMc1YrH6iWERyryFcDWkvobxryXSwECLrcd7Y1H",
          "My First Article",
          "ART1",
          500,
          "0"
        )
        .accountsPartial({
          writer: user.publicKey, //user signer
          //writerAccount: writerAccount, //to check writer role
          collectionMint: collectionMint, //collection mint
          collectionAuthority: mintAuthority, //mint authority
          collectionMetadata: metadata, //metadata account
          collectionMasterEdition: masterEdition, //master edition account
          collectionDestination: destination, //destination ata
          minterProgram: MINTER_PROGRAM_ID, //minter program
          systemProgram: SystemProgram.programId, //system program
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        })
        .signers([collectionKeypair])
        .rpc({
          skipPreflight: true,
        });
      console.log("\nCollection NFT minted: TxID - ", tx);
    } catch (error) {
      console.error("Create Collection Error:", error);
      throw error;
    }
  });
});
