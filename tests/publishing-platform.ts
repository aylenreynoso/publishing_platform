import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublishingPlatform } from "../target/types/publishing_platform";

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
const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);
const MINTER_PROGRAM_ID = new anchor.web3.PublicKey(
  "Csi65XvSe7Wbs4ZcUGmAgx22mAw8mCduaX71mwzAb2b"
);
const MARKETPLACE_PROGRAM_ID = new anchor.web3.PublicKey(
  "Bx17atdmjhPiwcFfr4gpwW1p2M2DSCTLRSmoTb3UDZsE"
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

  const admin = PublicKey.findProgramAddressSync(
    [Buffer.from("admin")],
    MARKETPLACE_PROGRAM_ID
  )[0];

  const marketplace = PublicKey.findProgramAddressSync(
    [Buffer.from("marketplace"), Buffer.from("platform")],
    MARKETPLACE_PROGRAM_ID
  )[0];

  const treasury = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury"), marketplace.toBuffer()],
    MARKETPLACE_PROGRAM_ID
  )[0];

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
    const tx = await publishingPlatform.methods
      .initializePlatform()
      .accountsPartial({
        user: user.publicKey,
        admin: admin,
        platformAccount: platformAccount.publicKey,
        marketplace: marketplace,
        treasury: treasury,
        marketplaceProgram: MARKETPLACE_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
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
  //use as authority for collection and nft signing
  const mintAuthority = PublicKey.findProgramAddressSync(
    [Buffer.from("authority")],
    MINTER_PROGRAM_ID
  )[0];

  const collectionKeypair = Keypair.generate();
  const collectionMint = collectionKeypair.publicKey;

  const nftKeypair = Keypair.generate();
  const nftMint = nftKeypair.publicKey;

  const getMetadata = async (mint: PublicKey): Promise<PublicKey> => {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )[0];
  };

  const getMasterEdition = async (mint: PublicKey): Promise<PublicKey> => {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
        Buffer.from("edition"),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )[0];
  };

  it("Create Collection NFT", async () => {
    try {
      console.log("\nCollection Mint Key: ", collectionMint.toBase58());

      const collectionMetadata = await getMetadata(collectionMint);
      console.log(
        "Collection Metadata Account: ",
        collectionMetadata.toBase58()
      );

      const collectionMasterEdition = await getMasterEdition(collectionMint);
      console.log(
        "Collection Master Edition Account: ",
        collectionMasterEdition.toBase58()
      );

      const collectionDestination = getAssociatedTokenAddressSync(
        collectionMint,
        user.publicKey
      );
      console.log(
        "Collection Destination ATA = ",
        collectionDestination.toBase58()
      );

      console.log("\nNFT Mint Key: ", nftMint.toBase58());

      const nftMetadata = await getMetadata(nftMint);
      console.log("NFT Metadata Account: ", nftMetadata.toBase58());

      const nftMasterEdition = await getMasterEdition(nftMint);
      console.log("NFT Master Edition Account: ", nftMasterEdition.toBase58());

      const nftDestination = getAssociatedTokenAddressSync(
        nftMint,
        user.publicKey
      );
      console.log("NFT Destination ATA = ", nftDestination.toBase58());

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
          collectionMetadata: collectionMetadata, //metadata account
          collectionMasterEdition: collectionMasterEdition, //master edition account
          collectionDestination: collectionDestination, //destination ata
          nftMint: nftMint, //nft mint
          nftMetadata: nftMetadata, //nft metadata account
          nftMasterEdition: nftMasterEdition, //nft master edition account
          nftDestination: nftDestination, //nft destination ata
          minterProgram: MINTER_PROGRAM_ID, //minter program
          systemProgram: SystemProgram.programId, //system program
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        })
        .signers([collectionKeypair, nftKeypair])
        .rpc({
          skipPreflight: true,
        });
      console.log("\nContent uploaded: TxID - ", tx);
    } catch (error) {
      console.error("Upload Content Error:", error);
      throw error;
    }
  });
});
