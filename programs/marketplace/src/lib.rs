use anchor_lang::prelude::*;

declare_id!("EQyrfGETTAa2FHMhLbkZVpfFcbxubQMitjPD37q9SWgj");

#[program]
pub mod marketplace {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
