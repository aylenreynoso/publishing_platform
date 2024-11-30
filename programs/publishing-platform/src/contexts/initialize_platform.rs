use anchor_lang::prelude::*;
use crate::state::platform_account::PlatformAccount;
use crate::state::admin::Admin;
use marketplace::program::Marketplace;
use marketplace::cpi::accounts::Initialize; 


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

    //Accounts for marketplace
    /// CHECK: PDA that will be created in marketplace program
    #[account(
        mut,
        seeds = [b"marketplace", "platform".as_bytes()],  // Use same seeds as marketplace program
        bump,
        seeds::program = marketplace_program.key()  // Important: Use marketplace program as owner
    )]
    pub marketplace: UncheckedAccount<'info>,
    #[account(
        seeds = [b"admin"],
        seeds::program = marketplace_program.key(),
        bump,
    )]
    pub admin: SystemAccount<'info>,
    #[account(
        seeds = [b"treasury", marketplace.key().as_ref()],
        seeds::program = marketplace_program.key(),
        bump,
    )]
    pub treasury: SystemAccount<'info>,

    //Programs
    pub marketplace_program: Program<'info, Marketplace>,
    pub system_program: Program<'info, System>,
}

impl<'info> InitializePlatform <'info> {

    pub fn initialize_platform(&mut self) -> Result<()> {
        self.platform_account.set_inner(PlatformAccount { 
            counter: 0,
        });
        Ok(())
    }
    pub fn initialize_marketplace(&mut self) -> Result<()> {
        let cpi_ctx = CpiContext::new(
            self.marketplace_program.to_account_info(),
            Initialize {
                user: self.user.to_account_info(),
                admin: self.admin.to_account_info(),
                marketplace: self.marketplace.to_account_info(),  // Pass the PDA
                treasury: self.treasury.to_account_info(),
                system_program: self.system_program.to_account_info(),
            },
        );
        
        marketplace::cpi::initialize(cpi_ctx, "platform".to_string(), 100)?;  // Add the CPI call
        Ok(())
    }
}