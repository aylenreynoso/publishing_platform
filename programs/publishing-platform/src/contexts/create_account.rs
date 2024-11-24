use anchor_lang::prelude::*;
use crate::state::user_account::UserAccount;

#[derive(Accounts)]
//#[instruction(role: u8)]y
pub struct CreateAccount<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init,
        payer = user,
        seeds = [b"user".as_ref(), user.key().as_ref()], //change to use user role 
        bump,
        space = 8 + UserAccount::INIT_SPACE,
    )]
    pub user_account: Account<'info, UserAccount>,
    pub system_program: Program<'info, System>,
}

impl<'info> CreateAccount<'info> {

    pub fn create_account(&mut self, role: u8, bumps: &CreateAccountBumps) -> Result<()> {
        self.user_account.set_inner(UserAccount { 
            role,
            wallet_address: self.user.key(),
            bump: bumps.user_account 
        });
        Ok(())
    }
}