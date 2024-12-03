use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;
use crate::state::{Review, Chapter};
use crate::state::user_account::ReaderAccount;

use crate::errors::PublishingPlatformError;

#[derive(Accounts)]
#[instruction(content: String)]
pub struct SubmitReview<'info> {
    #[account(mut)]
    pub reviewer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"reader", reviewer.key().as_ref()],
        bump
    )]
    pub reader_account: Account<'info, ReaderAccount>,
    #[account(
        mut,
        seeds = [b"chapter", chapter_ata.mint.as_ref()],
        bump
    )]
    pub chapter: Account<'info, Chapter>,
    pub chapter_ata: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = reviewer,
        space = 8 + Review::INIT_SPACE,
        seeds = [
            b"review",
            reviewer.key().as_ref(),
            chapter.key().as_ref()
        ],
        bump,
    )]
    pub review: Account<'info, Review>,
    pub system_program: Program<'info, System>,
}

impl<'info> SubmitReview<'info> {
    pub fn submit_review(
        &mut self,
        content: String,
        rating: u8,
    ) -> Result<()> {

        require!(
            rating >= 1 && rating <= 5,
            PublishingPlatformError::InvalidRating
        );

        // Initialize the review
        self.review.set_inner(Review {
            reviewer: self.reviewer.key(),
            chapter: self.chapter.key(),
            book_collection: self.chapter.book_collection,
            content,
            rating,
            upvotes: 0,
            created_at: Clock::get()?.unix_timestamp,
        });

        // Update reader profile
        self.reader_account.review_count += 1;
        self.reader_account.total_upvotes += 0;
        self.reader_account.reputation_score += 50;

        // Update chapter rating
        let total_rating = (self.chapter.rating as u32)
            .checked_mul(self.chapter.review_count)
            .and_then(|x| x.checked_add(rating as u32));

        self.chapter.review_count += 1;
        self.chapter.rating = (total_rating.unwrap()
            .checked_div(self.chapter.review_count)
            .unwrap()) as u8;
        /*let mut total_rating = self.chapter.rating as u32 * self.chapter.review_count;
        total_rating += rating as u32;
        self.chapter.review_count += 1;
        self.chapter.rating = (total_rating / self.chapter.review_count) as u8;*/


        Ok(())
    }
}