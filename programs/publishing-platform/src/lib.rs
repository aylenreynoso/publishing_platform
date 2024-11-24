use anchor_lang::prelude::*;

declare_id!("7ngCaXyvZFyV8bpo6oSutCxxrcocVLoJ48cURQ8Xy2on");

pub mod contexts;
pub mod state;
pub use contexts::*;
pub use state::*;   

#[program]
pub mod publishing_platform {

    use super::*;   
    pub fn initialize_platform(ctx: Context<InitializePlatform>) -> Result<()> {
        ctx.accounts.initialize_platform()
    }
    
    pub fn create_account(ctx: Context<CreateAccount>, role: u8) -> Result<()> {
        ctx.accounts.create_account(role, &ctx.bumps)
    }

}