use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Chapter {
    #[max_len(50)]      
    pub title: String,
    #[max_len(100)]
    pub content_uri: String,
    pub author: Pubkey,
    pub book_collection: Pubkey,
    pub chapter_number: u8,
    pub is_exclusive: bool,
    pub review_count: u32,
    pub rating: u8,
    pub chapter_mint: Pubkey,
}

#[account]
#[derive(InitSpace)]
pub struct Book {
    #[max_len(50)]
    pub title: String,
    pub author: Pubkey,
    pub chapter_count: u8,
    #[max_len(20)]
    pub genre: String,
    pub royalty_percentage: u8,
    pub total_sales: u64,
    pub review_score: u8,
    pub collection_mint: Pubkey,
}

#[account]
#[derive(InitSpace)]
pub struct ExclusiveContent {
    pub author: Pubkey,
    pub required_collection: Pubkey,  // The NFT collection that grants access
    #[max_len(100)]
    pub content_uri: String,          // IPFS/Arweave URI for the exclusive content
    pub is_active: bool,
    pub created_at: i64,
}