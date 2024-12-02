use anchor_lang::prelude::*;
use crate::state::content::Book;

#[derive(Accounts)]
pub struct CreateBook<'info> {
    #[account(mut)]
    pub writer: Signer<'info>,
    
    #[account(mut)]
    pub collection_mint: SystemAccount<'info>,
    
    #[account(
        init,
        payer = writer,
        space = 8 + Book::INIT_SPACE,
        seeds = [b"book", collection_mint.key().as_ref()],
        bump
    )]
    pub book: Account<'info, Book>,
    
    pub system_program: Program<'info, System>,
}

impl<'info> CreateBook<'info> {
    pub fn create_book(&mut self, title: String, royalties: u8, genre: String) -> Result<()> {
        self.book.set_inner(Book {
            title,
            author: self.writer.key(),
            collection_mint: self.collection_mint.key(),
            chapter_count: 0,
            genre,
            royalty_percentage: royalties,
            total_sales: 0,
            review_score: 0,
        });
        Ok(())
    }
}