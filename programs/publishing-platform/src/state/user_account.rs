use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct UserAccount {
    pub role: u8,
    pub wallet_address: Pubkey,
    pub bump: u8,
}