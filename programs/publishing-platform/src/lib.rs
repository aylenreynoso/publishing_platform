use anchor_lang::prelude::*;

declare_id!("B2RyptGoJ6LxfrMM6iBZeSm97W93p4YecoNB5d3Z324t");

pub mod contexts;
pub mod state;
pub mod errors;
pub use contexts::*;
pub use state::*;
pub use errors::*;

#[program]
pub mod publishing_platform {

    use super::*;   
    pub fn initialize_platform(ctx: Context<InitializePlatform>) -> Result<()> {
        ctx.accounts.initialize_platform()
    }
    
    pub fn create_account(ctx: Context<CreateAccount>, role: u8) -> Result<()> {
        ctx.accounts.create_account(role, &ctx.bumps)
    }

    pub fn tip_writer(ctx: Context<TipWriter>, amount : u64) -> Result<()> {
        ctx.accounts.tip_writer(amount)
    }

    pub fn upload_content(ctx: Context<UploadContent>, ipfs_cid: String, title: String, symbol: String, royalties: u16, content_type: String) -> Result<()> {   
        ctx.accounts.call_create_collection()?;
        ctx.accounts.call_mint_nft(ipfs_cid, title, symbol, royalties, content_type)?;
        ctx.accounts.list_content()?;
        Ok(())
    }
}
