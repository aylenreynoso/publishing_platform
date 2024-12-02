use anchor_lang::prelude::*;
use crate::state::content::{ExclusiveContent, Chapter};
use crate::errors::PublishingPlatformError;
use anchor_spl::token::TokenAccount;

#[derive(Accounts)]
pub struct VerifyAccess<'info> {
    pub reader: Signer<'info>,
    #[account(mut)]
    pub exclusive_content: Account<'info, ExclusiveContent>,
    pub chapter_ata: Account<'info, TokenAccount>,
    #[account(
        seeds = [b"chapter", chapter_ata.mint.as_ref()],
        bump
    )]
    pub chapter: Account<'info, Chapter>,
    pub system_program: Program<'info, System>,
}

impl<'info> VerifyAccess<'info> {   
    pub fn verify_access(&self) -> Result<String> {
        // Verify the reader owns an NFT from the required collection
        require!(
            self.chapter_ata.amount > 0,
            PublishingPlatformError::NoNftOwnership
        );
    
        require!(
            self.chapter.book_collection == self.exclusive_content.required_collection,
            PublishingPlatformError::InvalidCollection
        );
        
        // Return the content_uri
        Ok(self.exclusive_content.content_uri.clone()) 
    }
}
