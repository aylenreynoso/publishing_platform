#[derive(Accounts)]
pub struct CreateExclusiveContent<'info> {
    #[account(mut)]
    pub author: Signer<'info>,
    pub collection_mint: Account<'info, Mint>,
    #[account(
        init,
        payer = author,
        space = 8 + ExclusiveContent::SIZE,
        seeds = [
            b"exclusive",
            author.key().as_ref(),
            collection_mint.key().as_ref()
        ],
        bump
    )]
    pub exclusive_content: Account<'info, ExclusiveContent>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VerifyAccess<'info> {
    pub reader: Signer<'info>,
    #[account(mut)]
    pub exclusive_content: Account<'info, ExclusiveContent>,
    pub nft_token_account: Account<'info, TokenAccount>,
    pub collection_mint: Account<'info, Mint>,
}

pub fn create_exclusive_content(
    ctx: Context<CreateExclusiveContent>,
    content_uri: String,
) -> Result<()> {
    ctx.accounts.exclusive_content.set_inner(ExclusiveContent {
        author: ctx.accounts.author.key(),
        required_collection: ctx.accounts.collection_mint.key(),
        content_uri,
        is_active: true,
        created_at: Clock::get()?.unix_timestamp,
    });
    Ok(())
}

pub fn verify_access(ctx: Context<VerifyAccess>) -> Result<()> {
    // Verify the reader owns an NFT from the required collection
    require!(
        ctx.accounts.nft_token_account.amount > 0,
        MarketplaceError::NoNftOwnership
    );
    
    require!(
        ctx.accounts.nft_token_account.mint == ctx.accounts.collection_mint.key(),
        MarketplaceError::InvalidCollection
    );
    
    // If we reach here, access is granted
    // Return the content_uri that the frontend can use to fetch the content
    Ok(())
}