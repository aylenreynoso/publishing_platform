use anchor_lang::prelude::*;
use crate::state::user_account::ReaderAccount;

#[derive(Accounts)]
//#[instruction(role: u8)]
pub struct CreateReaderAccount<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init,
        payer = user,
        seeds = [b"reader".as_ref(), user.key().as_ref()],
        bump,
        space = 8 + ReaderAccount::INIT_SPACE,
    )]
    pub user_account: Account<'info, ReaderAccount>,
    pub system_program: Program<'info, System>,
}

impl<'info> CreateReaderAccount<'info> {

    pub fn create_reader_account(&mut self, bumps: &CreateReaderAccountBumps) -> Result<()> {
        self.user_account.set_inner(ReaderAccount { 
            wallet_address: self.user.key(),
            bump: bumps.user_account,
            review_count: 0,
            total_upvotes: 0,
            reputation_score: 0,
        });
        Ok(())
    }
}