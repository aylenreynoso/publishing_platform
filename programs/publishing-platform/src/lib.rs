use anchor_lang::prelude::*;

declare_id!("8CjoRnJX56Rti4bzFjq6g2xhZK1gSmJUWKHZEDDAQqHG");

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
        ctx.accounts.initialize_platform()?;
        Ok(())
    }
    
    pub fn create_account(ctx: Context<CreateAccount>, role: u8) -> Result<()> {
        ctx.accounts.create_account(role, &ctx.bumps)
    }

    pub fn tip_writer(ctx: Context<TipWriter>, amount : u64) -> Result<()> {
        ctx.accounts.tip_writer(amount)
    }

    pub fn create_book(ctx: Context<CreateBook>, title: String, royalties: u8, genre: String) -> Result<()> {
        ctx.accounts.create_book(title, royalties, genre)
    }

    pub fn add_chapter(ctx: Context<AddChapter>, title: String, content_uri: String) -> Result<()> {
        ctx.accounts.add_chapter(title, content_uri)
    }



}