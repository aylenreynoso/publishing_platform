use anchor_lang::prelude::*;
use crate::state::user_account::WriterAccount;

#[derive(Accounts)]
//#[instruction(role: u8)]
pub struct CreateWriterAccount<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init,
        payer = user,
        seeds = [b"writer".as_ref(), user.key().as_ref()],
        bump,
        space = 8 + WriterAccount::INIT_SPACE,
    )]
    pub user_account: Account<'info, WriterAccount>,
    pub system_program: Program<'info, System>,
}

impl<'info> CreateWriterAccount<'info> {

    pub fn create_writer_account(&mut self, bumps: &CreateWriterAccountBumps) -> Result<()> {
        self.user_account.set_inner(WriterAccount { 
            wallet_address: self.user.key(),
            bump: bumps.user_account,
            book_count: 0,
            total_royalties: 0,
        });
        Ok(())
    }
}