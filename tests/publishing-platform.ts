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
});
