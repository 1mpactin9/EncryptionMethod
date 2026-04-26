use clap::{Parser, Subcommand};
use std::path::PathBuf;

#[derive(Parser)]
#[command(name = "vlt", version = "1.0", about = "Secure Local Password Vault")]
pub struct Cli {
    #[arg(short, long, default_value = "vault.dat")]
    pub file: PathBuf,

    #[command(subcommand)]
    pub command: Commands,
}

#[derive(Subcommand)]
pub enum Commands {
    /// Create a new vault
    Create,
    /// Add a new password entry to the vault
    Add { name: String },
    /// Retrieve a password (copies to clipboard by default)
    Get { 
        name: String, 
        /// Output to terminal instead of clipboard
        #[arg(long)]
        stdout: bool 
    },
    /// List all entry names in the vault
    List,
    /// Search for entries by name
    Search { query: String },
    /// Change the master password
    ChangePassword,
    /// Generate a random password using OS RNG
    Generate {
        #[arg(short, long, default_value_t = 16)]
        length: usize,
    },
}