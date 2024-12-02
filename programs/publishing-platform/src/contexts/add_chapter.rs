use anchor_lang::prelude::*;
use crate::state::content::{Chapter, Book};
use crate::errors::PublishingPlatformError;
use anchor_spl::token::Mint;
#[derive(Accounts)]
pub struct AddChapter<'info> {
    #[account(mut)]
    pub writer: Signer<'info>,
    
    #[account(mut)]
    pub chapter_mint: Account<'info, Mint>,
    
    #[account(
        mut,
        seeds = [b"book", book_collection.key().as_ref()],
        bump,
        constraint = book.author == writer.key() @ PublishingPlatformError::UnauthorizedWriter
    )]
    pub book: Account<'info, Book>,

    pub book_collection: Account<'info, Mint>,
    
    #[account(
        init,
        payer = writer,
        space = 8 + Chapter::INIT_SPACE,
        seeds = [b"chapter", chapter_mint.key().as_ref()],
        bump
    )]
    pub chapter: Account<'info, Chapter>,
    
    pub system_program: Program<'info, System>,
}

impl<'info> AddChapter<'info> {
    pub fn add_chapter(&mut self, title: String, content_uri: String) -> Result<()> {
        // Increment chapter count in book
        self.book.chapter_count = self.book.chapter_count.checked_add(1)
            .ok_or(PublishingPlatformError::ChapterLimitExceeded)?;
            
        self.chapter.set_inner(Chapter {
            title,
            content_uri,
            author: self.writer.key(),
            book_collection: self.book_collection.key(),
            chapter_mint: self.chapter_mint.key(),
            chapter_number: self.book.chapter_count,
            is_exclusive: false,
            review_count: 0,
            rating: 0,
        });
        Ok(())
    }
}

