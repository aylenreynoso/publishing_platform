use anchor_lang::error_code;

#[error_code]
pub enum PublishingPlatformError {
    #[msg("Writer account does not exist")]
    WriterAccountNotFound,
    #[msg("Account must have writer role to receive tips")]
    InvalidWriterRole,
    #[msg("Tip amount must be greater than zero")]
    ZeroTipAmount,
}
