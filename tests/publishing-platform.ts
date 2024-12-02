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

const WRITER_ROLE = 1;
const READER_ROLE = 2;

const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

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

describe("publishing-platform", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.AnchorProvider.env();

  const publishingPlatform = anchor.workspace
    .PublishingPlatform as Program<PublishingPlatform>;

  const platformAccount = Keypair.generate();
  const user = provider.wallet;

  const reader = Keypair.generate();
  const writer = Keypair.generate();
  const writerAccount = PublicKey.findProgramAddressSync(
    [Buffer.from("user"), writer.publicKey.toBuffer()],
    publishingPlatform.programId
  )[0];
  const tipper = provider.wallet;

  //lets mint a collection and a nft directly to the reader so we can validate access
  //this state is expected after the reader buys the nft from the marketplace
  const nftMint = Keypair.generate();
  const collectionMint = Keypair.generate();

  //buyer destination
  const readerAta = getAssociatedTokenAddressSync(
    nftMint.publicKey,
    reader.publicKey
  );

  const bookMint = collectionMint;
  const bookPDA = PublicKey.findProgramAddressSync(
    [Buffer.from("book"), bookMint.publicKey.toBuffer()],
    publishingPlatform.programId
  )[0];

  const chapterMint = nftMint;
  const chapterPDA = PublicKey.findProgramAddressSync(
    [Buffer.from("chapter"), chapterMint.publicKey.toBuffer()],
    publishingPlatform.programId
  )[0];

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

    // Airdrop to reader
    const readerAirdropSignature = await provider.connection.requestAirdrop(
      reader.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction({
      signature: readerAirdropSignature,
      blockhash: (await provider.connection.getLatestBlockhash()).blockhash,
      lastValidBlockHeight: (
        await provider.connection.getLatestBlockhash()
      ).lastValidBlockHeight,
    });

    const minter = anchor.workspace.Minter as Program<Minter>;
    //Create Collection
    const collectionMetadata = await getMetadata(collectionMint.publicKey);
    const collectionMasterEdition = await getMasterEdition(
      collectionMint.publicKey
    );
    const collectionDestination = getAssociatedTokenAddressSync(
      collectionMint.publicKey,
      reader.publicKey
    );
    const mintAuthority = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("authority")],
      minter.programId
    )[0];

    try {
      const tx = await minter.methods
        .createCollection()
        .accountsPartial({
          user: reader.publicKey,
          mint: collectionMint.publicKey,
          mintAuthority: mintAuthority,
          metadata: collectionMetadata,
          masterEdition: collectionMasterEdition,
          destination: collectionDestination,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        })
        .signers([collectionMint, reader])
        .rpc({
          skipPreflight: true,
        });
      console.log("\nCollection NFT minted: TxID - ", tx);
    } catch (error) {
      console.error("Create Collection Error:", error);
      throw error;
    }

    const nftMetadata = await getMetadata(nftMint.publicKey);
    const nftMasterEdition = await getMasterEdition(nftMint.publicKey);
    const nftDestination = getAssociatedTokenAddressSync(
      nftMint.publicKey,
      reader.publicKey
    );

    //Mint NFT
    try {
      const tx = await minter.methods
        .mintNft("ipfs_cid", "title", "symbol", 100)
        .accountsPartial({
          owner: reader.publicKey,
          destination: nftDestination,
          metadata: nftMetadata,
          masterEdition: nftMasterEdition,
          mint: nftMint.publicKey,
          mintAuthority: mintAuthority,
          collectionMint: collectionMint.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        })
        .signers([nftMint, reader])
        .rpc({
          skipPreflight: true,
        });
      console.log("\nNFT Minted! Your transaction signature", tx);
    } catch (error) {
      console.error("Mint NFT Error:", error);
      throw error;
    }

    //Verify Collection
    await minter.methods
      .verifyCollection()
      .accountsPartial({
        authority: reader.publicKey,
        mintAuthority: mintAuthority,
        mint: nftMint.publicKey,
        metadata: nftMetadata,
        collectionMint: collectionMint.publicKey,
        collectionMetadata: collectionMetadata,
        collectionMasterEdition: collectionMasterEdition,
        systemProgram: SystemProgram.programId,
        sysvarInstruction: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      })
      .signers([reader])
      .rpc({
        skipPreflight: true,
      });
  });

  it("Publishing Platform initialized!", async () => {
    const tx = await publishingPlatform.methods
      .initializePlatform()
      .accountsPartial({
        user: user.publicKey,
        platformAccount: platformAccount.publicKey,
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
    const unregisteredWriter = Keypair.generate();

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

  it("Create book and add chapters", async () => {
    // First create the book collection

    await publishingPlatform.methods
      .createBook("My Book", 5, "Fiction")
      .accountsPartial({
        writer: writer.publicKey,
        collectionMint: bookMint.publicKey,
        book: bookPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([writer])
      .rpc();

    // Later, add a chapter to the existing book

    await publishingPlatform.methods
      .addChapter("Chapter 1", "ipfs://content-uri")
      .accountsPartial({
        writer: writer.publicKey,
        chapterMint: chapterMint.publicKey,
        bookCollection: bookMint.publicKey,
        book: bookPDA,
        chapter: chapterPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([writer])
      .rpc();

    // Verify chapter was added
    const bookAccount = await publishingPlatform.account.book.fetch(bookPDA);
    assert.equal(bookAccount.chapterCount, 1);

    const chapterAccount = await publishingPlatform.account.chapter.fetch(
      chapterPDA
    );
    assert.equal(chapterAccount.chapterNumber, 1);
    assert.equal(
      chapterAccount.bookCollection.equals(bookMint.publicKey),
      true
    );
  });

  it("Create and access exclusive content", async () => {
    const exclusiveContentPDA = PublicKey.findProgramAddressSync(
      [Buffer.from("exclusive"), bookMint.publicKey.toBuffer()],
      publishingPlatform.programId
    )[0];

    // Author creates exclusive content
    const contentUri = "ipfs://exclusive-content-hash";
    try {
      const tx = await publishingPlatform.methods
        .createExclusiveContent(contentUri)
        .accountsPartial({
          writer: writer.publicKey,
          collectionMint: bookMint.publicKey,
          exclusiveContent: exclusiveContentPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([writer])
        .rpc();

      console.log("Create transaction signature", tx);
    } catch (error) {
      console.error("Create Exclusive Content Error:", error);
      throw error;
    }

    // Reader tries to access content
    try {
      const tx = await publishingPlatform.methods
        .verifyAccess()
        .accountsPartial({
          reader: reader.publicKey,
          exclusiveContent: exclusiveContentPDA,
          chapterAta: readerAta,
          chapter: chapterPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([reader])
        .rpc();

      console.log("Access transaction signature", tx);
      // Frontend would use the returned content_uri to fetch the actual content
    } catch (error) {
      console.error("Access Exclusive Content Error:", error);
      throw error;
    }
  });
});
