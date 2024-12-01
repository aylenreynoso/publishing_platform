// tests/publishing-workflow.ts
describe("Publishing Workflow", () => {
    const nftMinter = anchor.workspace.NftMinting;
    const marketplace = anchor.workspace.Marketplace;
    const publishingPlatform = anchor.workspace.PublishingPlatform;
  
    it("Complete publishing workflow", async () => {
      // 1. Mint NFT first
      const { mint: nftMint, metadata } = await nftMinter.methods
        .mintContentNft({
          title: "My First Article",
          symbol: "ART1",
          uri: "...",
        })
        .accounts({...})
        .rpc();
  
      // 2. Create listing
      const { listing } = await marketplace.methods
        .createListing(new BN(10000000))
        .accounts({
          nftMint,
          ...listingAccounts
        })
        .rpc();
  
      // 3. Finally publish content
      await publishingPlatform.methods
        .publishContent(
          "QmXExS4BMc1YrH6iWERyryFcDWkvobxryXSwECLrcd7Y1H",
          "My First Article",
          nftMint,
          listing
        )
        .accounts({...})
        .rpc();
    });
  });