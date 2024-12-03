use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Review {
    pub reviewer: Pubkey,
    pub chapter: Pubkey,
    pub book_collection: Pubkey,
    #[max_len(500)]
    pub content: String,
    pub rating: u8,
    pub upvotes: u32,
    pub created_at: i64,
}