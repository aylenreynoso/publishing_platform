use anchor_lang::prelude::*;
use crate::state::user_account::UserAccount;
use minter::cpi::accounts::CreateCollection;
use minter::program::Minter;
//use minter::ID as MINTER_PROGRAM_ID;

use anchor_spl::{
    associated_token::{AssociatedToken, get_associated_token_address}, 
    metadata::{Metadata}, 
    token::{
        Mint,
        Token, 
        TokenAccount,
    }
};

#[derive(Accounts)]
pub struct UploadContent<'info> {
    #[account(mut)]
    pub writer: Signer<'info>,
   // #[account(mut)]
    //pub writer_account: Account<'info, UserAccount>,
    //accounts for collection creation
    /// CHECK: This account will be initialized by the minter program
    #[account(mut)]
    pub collection_mint: Signer<'info>,
    #[account(
        seeds = [b"authority"],
        seeds::program = minter_program.key(),
        bump,
    )]
    /// CHECK: This account will be initialized by the minter program
    pub collection_authority: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: This account will be initialized by the minter program
    pub collection_metadata: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: This account will be initialized by the minter program
    pub collection_master_edition: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: This account will be initialized by the minter program
    pub collection_destination: UncheckedAccount<'info>,

    //Programs
    pub minter_program: Program<'info, Minter>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_metadata_program: Program<'info, Metadata>, 
}

impl<'info> UploadContent<'info> {
    pub fn upload_content(&mut self, ipfs_cid: String, title: String, symbol: String, royalties: u16, content_type: String) -> Result<()> {
        //let (collection_authority, bump) = Pubkey::find_program_address(
        //    &[b"authority"],
        //    self.minter_program.key
        //);
        
        //let seeds = &[b"authority", &[bumps.collection_authority]];
        //let signer = &[&seeds[..]];
        
        let cpi_program = self.minter_program.to_account_info();
        let cpi_accounts = CreateCollection {
            user: self.writer.to_account_info(),
            mint: self.collection_mint.to_account_info(),
            mint_authority: self.collection_authority.to_account_info(),
            metadata: self.collection_metadata.to_account_info(),
            master_edition: self.collection_master_edition.to_account_info(),
            destination: self.collection_destination.to_account_info(),
            system_program: self.system_program.to_account_info(),
            token_program: self.token_program.to_account_info(),
            associated_token_program: self.associated_token_program.to_account_info(),
            token_metadata_program: self.token_metadata_program.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            cpi_program,
            cpi_accounts,
            //signer
        );
        let _ = minter::cpi::create_collection(cpi_ctx);
        Ok(())
    }

    pub fn list_content(&mut self) -> Result<()> {
        Ok(())
    }
}