use anchor_lang::prelude::*;
use crate::state::content::ExclusiveContent;
use anchor_spl::token::Mint;

#[derive(Accounts)]
pub struct CreateExclusiveContent<'info> {
    #[account(mut)]
    pub writer: Signer<'info>,
    pub collection_mint: Account<'info, Mint>,
    #[account(
        init,
        payer = writer,
        space = 8 + ExclusiveContent::INIT_SPACE,
        seeds = [
            b"exclusive",
            collection_mint.key().as_ref()
        ],
        bump
    )]
    pub exclusive_content: Account<'info, ExclusiveContent>,
    pub system_program: Program<'info, System>,
}

impl<'info> CreateExclusiveContent<'info> {
    pub fn create_exclusive_content(&mut self, content_uri: String) -> Result<()> {
        self.exclusive_content.set_inner(ExclusiveContent {
            author: self.writer.key(),
            required_collection: self.collection_mint.key(),
            content_uri,
            is_active: true,
            created_at: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }
}