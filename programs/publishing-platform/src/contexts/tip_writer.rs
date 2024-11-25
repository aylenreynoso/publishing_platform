use anchor_lang::prelude::*;
use crate::errors::PublishingPlatformError;
use crate::state::user_account::UserAccount;

#[derive(Accounts)]
pub struct TipWriter<'info> {
    #[account(mut)]
    pub reader: Signer<'info>,
    #[account(mut)]
    pub writer: SystemAccount<'info>,
    #[account(
        seeds = [b"user".as_ref(), writer.key().as_ref()],
        bump,
        constraint = writer_account.role == 1 @ PublishingPlatformError::InvalidWriterRole,
        constraint = writer_account.wallet_address == writer.key() @ PublishingPlatformError::WriterAccountNotFound
    )]
    pub writer_account: Account<'info, UserAccount>,
    pub system_program: Program<'info, System>,
}

impl<'info> TipWriter<'info> {
    pub fn tip_writer(&mut self, amount: u64) -> Result<()> {
        
        if amount == 0 {
            return Err(PublishingPlatformError::ZeroTipAmount.into());
        }

        // Create the transfer instruction
        anchor_lang::system_program::transfer(
            CpiContext::new(
                self.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: self.reader.to_account_info(),
                    to: self.writer.to_account_info(),
                },
            ),
            amount,
        )?;
        
        Ok(())
    }
}