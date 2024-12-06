# Publishing Platform

A decentralized publishing platform and NFT marketplace built on Solana, enabling writers to tokenize their content and readers to access, purchase, and interact with digital books through NFTs.

## Overview

This project consists of three main programs:

- Publishing Platform: Manages content creation, reader access, and social interactions
- NFT Marketplace: Handles NFT listings and purchases
- Minter: Handles NFT creation and collection management

### Architectural Decision

The initial approach was to use the Publishing Platform as a central entry point that would make CPI (Cross-Program Invocation) calls to the Marketplace and Minter programs. However, as the project complexity grew, a more modular approach was chosen where each program operates independently with clear boundaries and responsibilities. This decision:

- Improves maintainability by reducing inter-program dependencies
- Makes the codebase easier to test and debug
- Allows for independent deployment and upgrading of programs
- Reduces the complexity of transaction construction
- Provides better separation of concerns

## Core Functionalities

### Publishing Platform

1. **User Account Management**

   - Create writer accounts
   - Create reader accounts
   - Track user reputation and activity

2. **Content Management**

   - Create books account
   - Create chapters accounts
   - Create exclusive content for NFT holders
   - Upload and manage content metadata

3. **Social Features**
   - Submit reviews and ratings for chapters
   - Tip writers directly
   - Track reader engagement

### NFT Marketplace

1. **Listing Management**

   - List NFTs for sale
   - Set custom prices
   - Manage active listings

2. **Trading**

   - Purchase NFTs using SOL
   - Automatic fee handling
   - Secure escrow system

### Minter

1. **Collection Management**

   - Create NFT collections for books
   - Manage collection metadata
   - Verify collection membership

2. **NFT Creation**

   - Mint chapter NFTs
   - Set NFT metadata (title, symbol, URI)
   - Link NFTs to collections

3. **Metadata Handling**

   - Integrate with Metaplex Token Metadata Program
   - Manage NFT attributes and properties
   - Handle metadata verification

## Program Architecture

### PDAs (Program Derived Addresses)

- Writer Account: `[writer, writer_pubkey]`
- Reader Account: `[reader, reader_pubkey]`
- Book: `[book, collection_mint]`
- Chapter: `[chapter, chapter_mint]`
- Listing: `[marketplace, nft_mint]`
- Marketplace: `[marketplace, platform]`

### Key Features

- Decentralized content ownership
- Direct writer-reader interactions
- Automated royalty distribution
- Secure NFT trading
- Collection-based content organization

## Tests

- The test suite focuses on integration testing, simulating real-world usage scenarios rather than unit tests. Each test file demonstrates the happy path for core features, helping to validate the complete workflow of the platform.

### Publishing Platform Tests

- The publishing platform tests (`tests/publishing-platform.ts`) simulate a complete content creation and interaction flow:
  1. **Platform Setup**
   - Initialize platform state
   - Create writer and reader accounts

  2. **Content Creation Flow**
   - Create a book collection
   - Add chapters to the book
   - Create exclusive content for NFT holders

  3. **Reader Interactions**
   - Submit and verify chapter reviews
   - Test tipping functionality
   - Validate content access control

### Marketplace Tests

- The marketplace tests (`tests/marketplace.ts`) demonstrate the NFT trading lifecycle:

 1. **Setup Flow**
  - Initialize marketplace
  - Create test NFT collection
  - Mint test NFTs

 2. **Trading Flow**
  - List NFT for sale
  - Complete purchase
  - Verify token and SOL transfers
  - Validate marketplace fee collection

 ### Running Tests

# Start local validator
 ```solana-test-validator -r --bpf-program metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s .anchor/metaplex.so```

# Run all tests
```anchor test```

Note: These tests are designed to validate complete features rather than individual functions. They ensure that the main user workflows function correctly in a realistic environment.

## References & Acknowledgments

This project builds upon and learns from several open-source projects and examples:

- [ASCorreira NFT Operations](https://github.com/ASCorreia/nft-operations)
- [ASCorreira Anchor Marketplace](https://github.com/ASCorreia/anchor-marketplace)
- [Metaplex Developer Hub](https://developers.metaplex.com/)
- [Anchor Cookbook](https://book.anchor-lang.com/)
- [Anchor Examples](https://github.com/coral-xyz/anchor/tree/master/examples)

Special thanks to these projects for providing excellent reference implementations and documentation.
