use anchor_lang::prelude::*;

declare_id!("HqaFFq5Y4UkuwVyAviiB9NZTPUZTsXDsW8Zir7svd8KE");

pub mod contexts;

pub use contexts::*;

#[program]
pub mod minter {

    use super::*;
    pub fn create_collection(ctx: Context<CreateCollection>) -> Result<()> {
        ctx.accounts.create_collection(&ctx.bumps)
    }
    
    pub fn mint_nft(ctx: Context<MintNFT>, ipfs_cid: String, title: String, symbol: String, royalties: u16) -> Result<()> {
        ctx.accounts.mint_nft(&ctx.bumps, ipfs_cid, title, symbol, royalties)
    }

    pub fn verify_collection(ctx: Context<VerifyCollectionMint>) -> Result<()> {
        ctx.accounts.verify_collection(&ctx.bumps)
    }
}
