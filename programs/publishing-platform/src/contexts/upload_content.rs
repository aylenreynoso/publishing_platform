use anchor_lang::prelude::*;
//use crate::state::user_account::UserAccount;
use minter::cpi::accounts::CreateCollection;
use minter::cpi::accounts::MintNFT;
use minter::instruction::MintNft;
use minter::program::Minter;

use anchor_spl::{
    associated_token::{AssociatedToken}, 
    metadata::{Metadata}, 
    token::{
        Mint,
        Token,
    }
};

#[derive(Accounts)]
pub struct UploadContent<'info> {
    #[account(mut)]
    pub writer: Signer<'info>,
    // #[account(mut)]
    //pub writer_account: Account<'info, UserAccount>,

    //Accounts for collection creation
    /// CHECK: This account is passed in by the caller
    #[account(mut)]
    pub collection_mint: Signer<'info>,
    /// CHECK: This account is passed in by the caller
    #[account(mut)]
    pub nft_mint: Signer<'info>,
    #[account(
        seeds = [b"authority"],
        seeds::program = minter_program.key(),
        bump,
    )]
    /// CHECK: This account is not initialized and is being used for signing purposes only
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

    //Accounts for NFT minting
    #[account(mut)]
    /// CHECK: This account will be initialized by the minter program
    pub nft_metadata: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: This account will be initialized by the minter program
    pub nft_master_edition: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: This account will be initialized by the minter program
    pub nft_destination: UncheckedAccount<'info>,

    //Programs
    pub minter_program: Program<'info, Minter>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_metadata_program: Program<'info, Metadata>, 
}

impl<'info> UploadContent<'info> {
    pub fn call_create_collection(&mut self) -> Result<()> {
        
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

    pub fn call_mint_nft(&mut self, ipfs_cid: String, title: String, symbol: String, royalties: u16, _content_type: String) -> Result<()> {
        
        let cpi_program = self.minter_program.to_account_info();
        let cpi_accounts = MintNFT {
            owner: self.writer.to_account_info(),
            mint: self.nft_mint.to_account_info(),
            metadata: self.nft_metadata.to_account_info(),
            master_edition: self.nft_master_edition.to_account_info(),
            destination: self.nft_destination.to_account_info(),
            collection_mint: self.collection_mint.to_account_info(), //should b e initialized in previuos method
            mint_authority: self.collection_authority.to_account_info(),
            system_program: self.system_program.to_account_info(),
            token_program: self.token_program.to_account_info(),
            associated_token_program: self.associated_token_program.to_account_info(),
            token_metadata_program: self.token_metadata_program.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            cpi_program,
            cpi_accounts,
        );
        let _ = minter::cpi::mint_nft(cpi_ctx, ipfs_cid, title, symbol, royalties);


        Ok(())
    }

    pub fn list_content(&mut self) -> Result<()> {
        Ok(())
    }
}