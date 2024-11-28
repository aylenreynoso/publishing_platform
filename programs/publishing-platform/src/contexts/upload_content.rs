use anchor_lang::prelude::*;
use crate::state::user_account::UserAccount;
use minter::cpi::accounts::MintNFT;
use minter::program::Minter;
use minter::ID as MINTER_PROGRAM_ID;
//use minter::{self};
use anchor_spl::{
    associated_token::AssociatedToken, 
    metadata::Metadata, 
    token::{
        Mint,
        Token, 
        TokenAccount
    }
};

#[derive(Accounts)]
pub struct UploadContent<'info> {
    #[account(mut)]
    pub writer: Signer<'info>,
    #[account(mut)]
    pub writer_account: Account<'info, UserAccount>,
    #[account(mut)]
    pub destination: Account<'info, TokenAccount>,
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    /// CHECK: This account will be initialized by the metaplex program
    pub metadata: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: This account will be initialized by the metaplex program
    pub master_edition: UncheckedAccount<'info>,
    #[account(mut)]
    pub collection_mint: Account<'info, Mint>,
    #[account(
        seeds = [b"authority"],
        bump,
    )]
    /// CHECK: This is account is not initialized and is being used for signing purposes only
    pub mint_authority: UncheckedAccount<'info>,
    #[account(address = MINTER_PROGRAM_ID)]
    pub minter_program: Program<'info, Minter>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_metadata_program: Program<'info, Metadata>, 
}

impl<'info> UploadContent<'info> {
    pub fn upload_content(&mut self, ipfs_cid: String, title: String, symbol: String, royalties: u16, content_type: String) -> Result<()> {
        
        let cpi_program = self.minter_program.to_account_info();
        let cpi_accounts = MintNFT {
            owner: self.writer.to_account_info(),
            mint: self.mint.to_account_info(),
            destination: self.destination.to_account_info(),
            metadata: self.metadata.to_account_info(),
            master_edition: self.master_edition.to_account_info(),
            collection_mint: self.collection_mint.to_account_info(),
            system_program: self.system_program.to_account_info(),
            token_program: self.token_program.to_account_info(),
            associated_token_program: self.associated_token_program.to_account_info(),
            token_metadata_program: self.token_metadata_program.to_account_info(),
            mint_authority: self.writer.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        let _ = minter::cpi::mint_nft(cpi_ctx, ipfs_cid, title, symbol, royalties);
        Ok(())
    }

    pub fn list_content(&mut self) -> Result<()> {
        Ok(())
    }
}