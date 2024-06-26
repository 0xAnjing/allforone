# All For One

Solana Token transfer from multiple wallets to a single wallet.

All the amount of the token in the wallets will be transferred to the single wallet.

## Prerequisites

- Node.js
- npm

## Dependencies

- solana/web3.js
- solana/spl-token
- bs58
- dotenv
- fs

## Installation

1. Clone this repository

```bash
git clone https://github.com/0xAnjing/allforone.git
```

2. Install the dependencies

```bash
npm install
```

3. Copy the `.env.example` file to `.env`

```bash
cp .env.example .env
```

4. Update your environment variables in the `.env` file

5. Update `private_keys.txt` file with the private keys of wallets that is going to transfer the tokens.

## Usage

To run the token transfer, run the following command:

```bash
node index.js
```

## Private Keys File

The `private_keys.txt` file should contain the private keys of wallets in the following format:

```
wallet_address_1
wallet_address_2
wallet_address_3
wallet_address_n
```

## Only Chad People Will Do This 🗿

Donations are very much appreciated!

Solana: `6HGAhEQESn6A1YvwsfQFYdK6vWis4Se5EmdHQRKALqEm`

Ethereum: `0x85688Dfbd329d66f655eC1638Ef0Ccc886d3446F`

Bitcoin Nested SegWit: `3CuKNCB1TFtnNj1Xvzuq64jS3tqUfau5Sg`

Bitcoin Taproot: `bc1pnnmrvzgnm4hk3mpaq7ppcxcfw4vxr3kfvw7ugrpql7tvhe4c7e3qh98sg5`
