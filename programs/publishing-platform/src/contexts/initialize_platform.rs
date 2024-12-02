use anchor_lang::prelude::*;
use crate::state::platform_account::PlatformAccount;

#[derive(Accounts)]
//#[instruction(role: u8)]
pub struct InitializePlatform<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init,
        payer = user,
        space = 8 + PlatformAccount::INIT_SPACE,            
    )]
    pub platform_account: Account<'info, PlatformAccount>,
    pub system_program: Program<'info, System>,
}

impl<'info> InitializePlatform <'info> {

    pub fn initialize_platform(&mut self) -> Result<()> {
        self.platform_account.set_inner(PlatformAccount { 
            counter: 0,
        });
        Ok(())
    }
}