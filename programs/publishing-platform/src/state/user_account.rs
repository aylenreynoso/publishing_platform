use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct WriterAccount {
    pub wallet_address: Pubkey,
    pub bump: u8,
    pub book_count: u32,
    pub total_royalties: u64,
}

#[account]
#[derive(InitSpace)]
pub struct ReaderAccount {
    pub wallet_address: Pubkey,
    pub bump: u8,
    pub review_count: u32,
    pub total_upvotes: u32,
    pub reputation_score: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum UserRole {
    Reader = 0,
    Writer = 1,
}