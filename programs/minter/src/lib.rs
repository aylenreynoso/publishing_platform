use anchor_lang::prelude::*;

declare_id!("FWSRvbQDi4kP6x2QvkXig5XNqXsFtH7QfiW6VMjmtHGk");

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
