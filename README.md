# ParyonUSD Contract Deployment Verification

This script allows technical users and reviewers to independently verify that a ParyonUSD deployment and its token IDs correspond to correctly deployed contracts on Bitcoin Cash.

## What You're Verifying

You are verifying a **deployment configuration** which specifies:
- 5 token IDs (paryonTokenId, poolTokenId, redeemerTokenId, loanKeyFactoryTokenId, oracleMigrationKeyTokenId)
- Contract parameters (oracle public key, fee address, block heights, etc.)

The script confirms that these token IDs were created in genesis transactions that set up the contracts correctly.

**Important**: You MUST cross-reference the deployment's token IDs with what you see in the app or your wallet to confirm you're verifying the intended deployment.

## Genesis Transaction IDs

The script requires genesis transaction IDs to be provided in `config.ts`. These are needed because the Electrum protocol cannot look up a genesis transaction from a token ID (there is no spent-by field on an output). The genesis txids allow the script to fetch and inspect the transaction that created each token.

## What Gets Verified

For each of the 5 token IDs the script verifies:
- The provided genesis transaction matches the deployment token IDs to verify
- The outputs have the expected contract addresses (reconstructed from artifacts)
- The outputs have the expected NFTs with correct capability + commitement data
- The outputs either have no fungible tokens or for the `paryonTokenId` that fungible tokens are only present on the paryon-borrowing contract
- No unexpected NFTs or fungible tokens are created to other outputs (other than to the contract addresses)

Across all 5 genesis transactions together the script additionally verifies the function-NFT base case:
- No output carries the function-NFT shape (paryon/pool category, immutable, a function commitment) anywhere other than on the function contract that shape designates
- Every output on a function contract is exactly that contract's function NFT

## Running the Verification

```bash
pnpm install
pnpm verifySetup
```

## Configuration

Edit `config.ts` to specify:
- `deploymentToVerify` - The deployment configuration to verify
- `genesisTxIds` - Genesis transaction IDs for each token (required to fetch tx data)
- `KNOWN_GP_ORACLE_PUBKEY` - the oracle public key to verify the deployment config against

## How Verification Works

1. **Verify Oracle PublicKey**: The script verifies the oraclePublicKey of the deployment matches the known Oracle PublicKey of the USD/BCH oracle by General Protocols.

2. **Genesis Input Check**: Each tokenId derives from a specific output. The script verifies the provided genesis txid contains an input spending that output.

3. **Address Reconstruction**: Using contract artifacts and deployment parameters, the script reconstructs expected contract addresses. Artifacts are loaded from `@paryonusd/contracts`; you can also use locally compiled artifacts.

4. **Output Validation**: For each genesis transaction, the script checks outputs go to expected addresses with correct token data.

5. **Function-NFT Base Case**: Finally, the script scans the outputs of all 5 genesis transactions together and verifies that no counterfeit function NFT was created off its own function contract. The contracts are formally verified to recreate in place every function NFT they spend, with the same category, contract and commitment; that induction only pins down the live system if the deploy state it starts from is clean, which is what this step establishes.

## Files

- `verifySetup.ts` - Main verification script
- `config.ts` - Deployment and genesis txids to verify
- `contractAddresses.ts` - Contract address reconstruction
- `validationUtils.ts` - Output validation helpers

## Example Output

```
Verifying correctness of deployment mainnet on mainnet with token IDs: {
  paryonTokenId: '...',
  poolTokenId: '...',
  ...
} and parameters: {
  oraclePublicKey: '...',
  ...
}

🚨 You must cross-reference the deployment token IDs to confirm they match the deployment you are expecting to verify.

Verifying the oraclePublicKey matches the known General Protocols oracle
✅ Oracle public key matches known General Protocols oracle

...

Verifying contract setup by inspecting each of the 5 genesis transactions:

Verifying the paryonTokenId genesis transaction (1/5)
...
Fungible tokens with paryonTokenId only present on the paryonContract addresses
Total fungible token supply: 9223372036854775807 (MAX_TOKEN_SUPPLY)
✅ Verified paryonTokenId genesis transaction successfully.

Verifying the poolTokenId genesis transaction (2/5)
...
✅ Verified poolTokenId genesis transaction successfully.

Verifying the redeemerTokenId genesis transaction (3/5)
...
✅ Verified redeemerTokenId genesis transaction successfully.

Verifying the loanKeyFactoryTokenId genesis transaction (4/5)
...
✅ Verified loanKeyFactoryTokenId genesis transaction successfully.

Verifying the oracleMigrationKeyTokenId genesis transaction (5/5)
...
✅ Verified oracleMigrationKeyTokenId genesis transaction.

Verifying the function NFTs were only created on their own function contracts
No genesis output carries a function-NFT shape off its own function contract, and every output on a function contract is that contract's function NFT
✅ Verified the function NFT base case across all 5 genesis transactions.

🎉 Contract setup verification completed successfully for the token IDs listed above.
```

If verification fails, the script throws an error with details about what didn't match:

```
Verifying the oracleMigrationKeyTokenId genesis transaction (5/5)
oracleMigrationKeyTokenId genesis transaction has 2 outputs, incl. 1 outputs with the oracleMigrationKeyTokenId

❌ Contract setup verification failed: No price contract outputs found at expected address
🚨 DO NOT TRUST the specified deployment and token IDs without further verification.
```

