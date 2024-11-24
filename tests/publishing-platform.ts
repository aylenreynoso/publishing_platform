import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublishingPlatform } from "../target/types/publishing_platform";
import { Minter } from "../target/types/minter";
import { SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("publishing-platform", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.AnchorProvider.env();

  const publishingPlatform = anchor.workspace
    .PublishingPlatform as Program<PublishingPlatform>;

  const minter = anchor.workspace.Minter as Program<Minter>;

  const platformAccount = anchor.web3.Keypair.generate();
  const user = provider.wallet;

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

    // Fetch the capsule machine and check its state
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
});
