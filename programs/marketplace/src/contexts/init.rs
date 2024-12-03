use anchor_lang::prelude::*;
use crate::state::Marketplace;
use crate::errors::MarketplaceError;

#[derive(Accounts)]
#[instruction(name: String)]
pub struct Initialize<'info> {
    #[account(mut)]
    user: Signer<'info>,
    #[account(
        seeds = [b"admin"],
        bump,
    )]
    admin: SystemAccount<'info>,
    #[account(
        init,
        space = Marketplace::INIT_SPACE,
        payer = user,
        seeds = [b"marketplace", name.as_str().as_bytes()],
        bump
    )]
    marketplace: Box<Account<'info, Marketplace>>,
    #[account(
        seeds = [b"treasury", marketplace.key().as_ref()],
        bump,
    )]
    treasury: SystemAccount<'info>,
    system_program: Program<'info, System>,
}

impl<'info> Initialize<'info> {
    pub fn init(&mut self, name: String, fee: u16, bumps: &InitializeBumps) -> Result<()> {
    
        require!(name.len() > 0 && name.len() < 33, MarketplaceError::NameTooLong);
        self.marketplace.set_inner(Marketplace {
            admin: self.admin.key(),
            fee,
            name,
            bump: bumps.marketplace,
            treasury_bump: bumps.treasury,
        });

        Ok(())
    }
}