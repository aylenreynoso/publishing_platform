import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Marketplace } from "../target/types/marketplace";
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
import {
  CollectionMasterEditionAccountInvalidError,
  KeyMismatchError,
} from "@metaplex-foundation/mpl-token-metadata";
import { min } from "bn.js";

const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);
const MARKETPLACE_PROGRAM_ID = new anchor.web3.PublicKey(
  "Bx17atdmjhPiwcFfr4gpwW1p2M2DSCTLRSmoTb3UDZsE"
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

describe("marketplace", () => {
  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.AnchorProvider.env();
  const marketplace = anchor.workspace.Marketplace as Program<Marketplace>;
  const minter = anchor.workspace.Minter as Program<Minter>;
  const user = provider.wallet;

  const admin = PublicKey.findProgramAddressSync(
    [Buffer.from("admin")],
    MARKETPLACE_PROGRAM_ID
  )[0];

  const marketplaceAccount = PublicKey.findProgramAddressSync(
    [Buffer.from("marketplace"), Buffer.from("platform")],
    MARKETPLACE_PROGRAM_ID
  )[0];

  const treasury = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury"), marketplaceAccount.toBuffer()],
    MARKETPLACE_PROGRAM_ID
  )[0];

  const seller = Keypair.generate();
  const buyer = Keypair.generate();
  const nftMint = Keypair.generate();
  const collectionMint = Keypair.generate();

  before(async () => {
    // Airdrop to seller
    const sellerAirdrop = await provider.connection.requestAirdrop(
      seller.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction({
      signature: sellerAirdrop,
      blockhash: (await provider.connection.getLatestBlockhash()).blockhash,
      lastValidBlockHeight: (
        await provider.connection.getLatestBlockhash()
      ).lastValidBlockHeight,
    });

    // Airdrop to buyer
    const buyerAirdrop = await provider.connection.requestAirdrop(
      buyer.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction({
      signature: buyerAirdrop,
      blockhash: (await provider.connection.getLatestBlockhash()).blockhash,
      lastValidBlockHeight: (
        await provider.connection.getLatestBlockhash()
      ).lastValidBlockHeight,
    });
  });

  it("Initialize Marketplace", async () => {
    const tx = await marketplace.methods
      .initialize("platform", 10) //title and fee
      .accountsPartial({
        user: user.publicKey,
        admin: admin,
        marketplace: marketplaceAccount,
        treasury: treasury,
        systemProgram: SystemProgram.programId,
      })
      .signers([])
      .rpc();

    console.log("Marketplace initialized with signature:", tx);

    const marketplaceData = await marketplace.account.marketplace.fetch(
      marketplaceAccount
    );
    assert.equal(marketplaceData.name, "platform");
    assert.equal(marketplaceData.fee, 10);
  });

  it("Create Listing", async () => {
    //Create Collection
    const collectionMetadata = await getMetadata(collectionMint.publicKey);
    const collectionMasterEdition = await getMasterEdition(
      collectionMint.publicKey
    );
    const collectionDestination = getAssociatedTokenAddressSync(
      collectionMint.publicKey,
      seller.publicKey
    );
    const mintAuthority = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("authority")],
      minter.programId
    )[0];
    console.log("\nCreate Collection Accounts:");
    console.log("User:", seller.publicKey.toBase58());
    console.log("Mint:", collectionMint.publicKey.toBase58());
    console.log("Mint Authority:", mintAuthority.toBase58());
    console.log("Metadata:", collectionMetadata.toBase58());
    console.log("Master Edition:", collectionMasterEdition.toBase58());
    console.log("Destination:", collectionDestination.toBase58());

    try {
      const tx = await minter.methods
        .createCollection()
        .accountsPartial({
          user: seller.publicKey,
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
        .signers([collectionMint, seller])
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
      seller.publicKey
    );
    console.log("\nMint NFT Accounts:");
    console.log("Owner:", seller.publicKey.toBase58());
    console.log("Destination:", nftDestination.toBase58());
    console.log("Metadata:", nftMetadata.toBase58());
    console.log("Master Edition:", nftMasterEdition.toBase58());
    console.log("Mint:", nftMint.publicKey.toBase58());
    console.log("Mint Authority:", mintAuthority.toBase58());
    console.log("Collection Mint:", collectionMint.publicKey.toBase58());

    //Mint NFT
    try {
      const tx = await minter.methods
        .mintNft("ipfs_cid", "title", "symbol", 100)
        .accountsPartial({
          owner: seller.publicKey,
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
        .signers([nftMint, seller])
        .rpc({
          skipPreflight: true,
        });
      console.log("\nNFT Minted! Your transaction signature", tx);
    } catch (error) {
      console.error("Mint NFT Error:", error);
      throw error;
    }

    const vault = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), nftMint.publicKey.toBuffer()],
      MARKETPLACE_PROGRAM_ID
    )[0];

    const listing = PublicKey.findProgramAddressSync(
      [Buffer.from("listing"), nftMint.publicKey.toBuffer()],
      MARKETPLACE_PROGRAM_ID
    )[0];

    const price = new anchor.BN(1 * LAMPORTS_PER_SOL);
    console.log("\nListing Accounts:");
    console.log("Maker:", seller.publicKey.toBase58());
    console.log("Marketplace:", marketplaceAccount.toBase58());
    console.log("Maker Mint:", nftMint.publicKey.toBase58());
    console.log("Collection Mint:", collectionMint.publicKey.toBase58());
    console.log("Maker ATA:", nftDestination.toBase58());
    console.log("Vault:", vault.toBase58());
    console.log("Listing:", listing.toBase58());
    console.log("Metadata:", nftMetadata.toBase58());
    console.log("Master Edition:", nftMasterEdition.toBase58());
    const tx = await marketplace.methods
      .list(price)
      .accounts({
        maker: seller.publicKey,
        marketplace: marketplaceAccount,
        makerMint: nftMint.publicKey,
        collectionMint: collectionMint.publicKey,
        makerAta: nftDestination,
        vault: vault,
        listing: listing,
        metadata: nftMetadata,
        masterEdition: nftMasterEdition,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        metadataProgram: TOKEN_METADATA_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([seller])
      .rpc();

    console.log("Listing created with signature:", tx);

    const listingData = await marketplace.account.listing.fetch(listing);
    assert.equal(listingData.price.toString(), price.toString());
    assert.equal(listingData.maker.toBase58(), seller.publicKey.toBase58());
  });
});
