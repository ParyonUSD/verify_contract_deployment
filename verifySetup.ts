import { network, deploymentToVerify, genesisTxIds, KNOWN_GP_ORACLE_PUBKEY } from './config.js';
import { ElectrumNetworkProvider } from 'cashscript';
import { type ElectrumRawTransaction } from '@paryonusd/library';
import {
  validateCollectorContractOutput,
  validateLoanFunctionOutput, 
  validateParyonContractOutput,
  validatePoolFunctionOutput,
  validatePriceContractOutput,
  validateStabilityPoolContractOutput,
  validateStabilityPoolHasSidecarOutput,
  validateLoanKeyFactoryContractOutput,
  validateRedeemerContractOutput,
} from './validationUtils.js';
import {
  borrowingContractAddress,
  priceContractAddress,
  loanFunctionAddresses,
  allParyonTokenIdContractAddresses,
  stabilityPoolContractAddress,
  collectorContractAddress,
  poolFunctionAddresses,
  allPoolTokenIdContractAddresses,
  redeemerContractAddress,
  loanKeyFactoryContractAddress
} from './contractAddresses.js';

// Create provider with manual connection management
// Uses the default provider for that network
const provider = new ElectrumNetworkProvider(network, {
  manualConnectionManagement: true
});

try {
  console.log("Verifying correctness of deployment", deploymentToVerify.name, "on",
    network, "with token IDs:", deploymentToVerify.tokenIds, "and parameters:",
    deploymentToVerify.contractParams)

  console.log("\nNote: Using contract artifacts from @paryonusd/contracts.",
    "Locally compiled artifacts can also be used in contractAddresses.ts.")
  
  console.log("\n🚨 You must cross-reference the deployment token IDs to confirm",
    "they match the deployment you are expecting to verify.")

  // Verify oraclePublicKey matches the known General Protocols oracle
  console.log("\nVerifying the oraclePublicKey matches the known General Protocols oracle")

  if (deploymentToVerify.contractParams.oraclePublicKey !== KNOWN_GP_ORACLE_PUBKEY) {
    throw new Error(`Oracle public key mismatch! Deployment uses: ${deploymentToVerify.contractParams.oraclePublicKey}, expected General Protocols oracle: ${KNOWN_GP_ORACLE_PUBKEY}`)
  }

  console.log("✅ Oracle public key matches known General Protocols oracle")

  console.log("\nYou have provided the following genesis transaction IDs to assist in verifying the deployment:", genesisTxIds)
 
  await provider.connect()

  console.log("\nChecking genesis transactions:")

  // fetch full tx info for claimed genesis transactions
  const fullGenesisTxsPromises: Promise<ElectrumRawTransaction>[] = []

  console.log("\nFetching the full transaction details of the genesis transactions...")

  // note: the ordering of the keys in the deploymentToVerify object and the ordering in genesisTxIds is the same
  const listDeploymentTokenIds = Object.values(deploymentToVerify.tokenIds);
  const listGenesisTxIds = Object.values(genesisTxIds);

  for (const genesisTxId of listGenesisTxIds) {
    const fullGenesisTxpromise = provider.performRequest(
      "blockchain.transaction.get", genesisTxId, true
    ) as Promise<ElectrumRawTransaction>;
    fullGenesisTxsPromises.push(fullGenesisTxpromise)
  }
  const fullGenesisTxs = await Promise.all(fullGenesisTxsPromises)

  console.log("Checking for the presence of the correct genesis transaction inputs...")

  // Verify that each claimed genesis transaction is indeed the genesis transaction for the corresponding token
  for (const [index, fullGenesisTx] of fullGenesisTxs.entries()) {
    const expectedPrevoutTxId = listDeploymentTokenIds[index]
    // the genesis transaction should have the genesis input
    // this means the expected prevout txid matching the tokenId and vout 0
    const genesisInput = fullGenesisTx.vin.find(input =>
      input.txid === expectedPrevoutTxId && input.vout === 0
    )
    if (!genesisInput) {
      const failedGenesisTxId = listGenesisTxIds[index]
      console.error("Genesis transaction input not found for txid:", failedGenesisTxId)
      throw new Error("Genesis transaction input not found")
    }
  }

  console.log("✅ The genesis transactions match the token IDs of the deployment you are verifying.")

  console.log("\nVerifying contract setup by inspecting each of the 5 genesis transactions:")

  /* 1. Verify ParyonTokenId genesis transaction */

  console.log("\nVerifying the paryonTokenId genesis transaction (1/5)")
  const paryonGenesisTx = fullGenesisTxs[0]
  const paryonTokenIdOutputs = paryonGenesisTx.vout.filter(output =>
    output.tokenData && output.tokenData.category === deploymentToVerify.tokenIds.paryonTokenId
  )
  console.log(`paryonTokenId genesis transaction has ${paryonGenesisTx.vout.length} outputs, incl. ${paryonTokenIdOutputs.length} outputs with the paryonTokenId`)

  const paryonTokenIdGenesisOutputTypes = {
    borrowingContractAddress: 0,
    priceContractAddress: 0,
    loanFunctionAddresses: 0
  }
  const seenLoanFunctionAddresses = new Set<string>()

  for (const output of paryonGenesisTx.vout) {
    // Skip OP_RETURN outputs (e.g. BCMR metadata) — they are provably unspendable
    if (output.scriptPubKey.hex.startsWith('6a')) continue;
    const outputAddress = output.scriptPubKey.addresses[0]
    if (!allParyonTokenIdContractAddresses.includes(outputAddress) && output.tokenData) {
      throw new Error(`Unexpected token output found in paryonTokenId genesis transaction: ${paryonGenesisTx.txid}`)
    }
    if (outputAddress !== borrowingContractAddress && output.tokenData && BigInt(output.tokenData.amount)) {
      throw new Error(`Unexpected fungible token output found in paryonTokenId genesis transaction: ${paryonGenesisTx.txid} for address: ${outputAddress}`)
    }
    if (outputAddress === borrowingContractAddress) {
      validateParyonContractOutput(output, paryonGenesisTx)
      paryonTokenIdGenesisOutputTypes.borrowingContractAddress += 1
    }
    if (outputAddress === priceContractAddress) {
      validatePriceContractOutput(output, paryonGenesisTx)
      paryonTokenIdGenesisOutputTypes.priceContractAddress += 1
    }
    if (loanFunctionAddresses.includes(outputAddress)) {
      validateLoanFunctionOutput(output, paryonGenesisTx)
      paryonTokenIdGenesisOutputTypes.loanFunctionAddresses += 1
      seenLoanFunctionAddresses.add(outputAddress)
    }
  }

  // Verify total fungible token supply equals MAX_TOKEN_SUPPLY
  let totalFungibleSupply = 0n
  for (const output of paryonGenesisTx.vout) {
    if (output.scriptPubKey.hex.startsWith('6a')) continue;
    if (output.scriptPubKey.addresses[0] === borrowingContractAddress && output.tokenData) {
      totalFungibleSupply += BigInt(output.tokenData.amount)
    }
  }
  const MAX_TOKEN_SUPPLY = 9223372036854775807n
  if (totalFungibleSupply !== MAX_TOKEN_SUPPLY) {
    throw new Error(`Fungible token supply mismatch. Expected: ${MAX_TOKEN_SUPPLY}, got: ${totalFungibleSupply}`)
  }

  // Verify all expected addresses are present
  if (paryonTokenIdGenesisOutputTypes.borrowingContractAddress === 0) {
    throw new Error("No paryon contract outputs found")
  }
  if (paryonTokenIdGenesisOutputTypes.priceContractAddress === 0) {
    throw new Error("No price contract outputs found")
  }
  if (seenLoanFunctionAddresses.size !== loanFunctionAddresses.length) {
    throw new Error(`Expected ${loanFunctionAddresses.length} unique loan function addresses, found ${seenLoanFunctionAddresses.size}`)
  }

  console.log("paryonTokenId genesis transaction output counts by address:", paryonTokenIdGenesisOutputTypes)
  console.log(`All ${allParyonTokenIdContractAddresses.length} expected contract addresses are present`)
  console.log("Fungible tokens only present on the paryonContract addresses")
  console.log(`Total fungible token supply: ${totalFungibleSupply} (MAX_TOKEN_SUPPLY)`)
  console.log("✅ Verified paryonTokenId genesis transaction successfully.")

  /* 2. Verify PoolTokenId genesis transaction */

  console.log("\nVerifying the poolTokenId genesis transaction (2/5)")
  const poolGenesisTx = fullGenesisTxs[1]
  const poolTokenIdOutputs = poolGenesisTx.vout.filter(output =>
    output.tokenData && output.tokenData.category === deploymentToVerify.tokenIds.poolTokenId
  )
  console.log(`poolTokenId genesis transaction has ${poolGenesisTx.vout.length} outputs, incl. ${poolTokenIdOutputs.length} outputs with the poolTokenId`)

  const poolTokenIdGenesisOutputTypes = {
    stabilityPoolContractAddress: 0,
    collectorContractAddress: 0,
    poolFunctionAddresses: 0
  }
  const seenPoolFunctionAddresses = new Set<string>()

  for (const output of poolGenesisTx.vout) {
    if (output.scriptPubKey.hex.startsWith('6a')) continue;
    const outputAddress = output.scriptPubKey.addresses[0]
    if (!allPoolTokenIdContractAddresses.includes(outputAddress) && output.tokenData) {
      throw new Error(`Unexpected token output found in poolTokenId genesis transaction: ${poolGenesisTx.txid}`)
    }
    if (output.tokenData && BigInt(output.tokenData.amount) > 0n) {
      throw new Error(`Unexpected fungible tokens in poolTokenId genesis transaction: ${poolGenesisTx.txid}`)
    }
    if (outputAddress === stabilityPoolContractAddress) {
      validateStabilityPoolContractOutput(output, poolGenesisTx)
      validateStabilityPoolHasSidecarOutput(output, poolGenesisTx)
      poolTokenIdGenesisOutputTypes.stabilityPoolContractAddress += 1
    }
    if (outputAddress === collectorContractAddress) {
      validateCollectorContractOutput(output, poolGenesisTx)
      poolTokenIdGenesisOutputTypes.collectorContractAddress += 1
    }
    if (poolFunctionAddresses.includes(outputAddress)) {
      validatePoolFunctionOutput(output, poolGenesisTx)
      poolTokenIdGenesisOutputTypes.poolFunctionAddresses += 1
      seenPoolFunctionAddresses.add(outputAddress)
    }
  }

  // Verify all expected addresses are present
  if (poolTokenIdGenesisOutputTypes.stabilityPoolContractAddress === 0) {
    throw new Error("No stability pool contract outputs found")
  }
  if (poolTokenIdGenesisOutputTypes.collectorContractAddress === 0) {
    throw new Error("No collector contract outputs found")
  }
  if (seenPoolFunctionAddresses.size !== poolFunctionAddresses.length) {
    throw new Error(`Expected ${poolFunctionAddresses.length} unique pool function addresses, found ${seenPoolFunctionAddresses.size}`)
  }

  console.log("poolTokenId genesis transaction output counts by address:", poolTokenIdGenesisOutputTypes)
  console.log(`All ${allPoolTokenIdContractAddresses.length} expected contract addresses are present`)
  console.log("StabilityPool sidecar output correctly created without any token data")
  console.log("✅ Verified poolTokenId genesis transaction successfully.")

  /* 3. Verify RedeemerTokenId genesis transaction */

  console.log("\nVerifying the redeemerTokenId genesis transaction (3/5)")
  const redeemerGenesisTx = fullGenesisTxs[2]
  const redeemerTokenIdOutputs = redeemerGenesisTx.vout.filter(output =>
    output.tokenData && output.tokenData.category === deploymentToVerify.tokenIds.redeemerTokenId
  )
  console.log(`redeemerTokenId genesis transaction has ${redeemerGenesisTx.vout.length} outputs, incl. ${redeemerTokenIdOutputs.length} outputs with the redeemerTokenId`)

  const redeemerTokenIdGenesisOutputTypes = {
    redeemerContractAddress: 0
  }

  for (const output of redeemerGenesisTx.vout) {
    const outputAddress = output.scriptPubKey.addresses[0]
    if (outputAddress !== redeemerContractAddress && output.tokenData) {
      throw new Error(`Unexpected token output found in redeemerTokenId genesis transaction: ${redeemerGenesisTx.txid}`)
    }
    if (output.tokenData && BigInt(output.tokenData.amount) > 0n) {
      throw new Error(`Unexpected fungible tokens in redeemerTokenId genesis transaction: ${redeemerGenesisTx.txid}`)
    }
    if (outputAddress === redeemerContractAddress) {
      validateRedeemerContractOutput(output, redeemerGenesisTx)
      redeemerTokenIdGenesisOutputTypes.redeemerContractAddress += 1
    }
  }
console.log("Total fungible token supply is zero as expected")
  console.log("redeemerTokenId genesis transaction output counts by address:", redeemerTokenIdGenesisOutputTypes)
  console.log("✅ Verified redeemerTokenId genesis transaction successfully.")

  /* 4. Verify LoanKeyFactoryTokenId genesis transaction */

  console.log("\nVerifying the loanKeyFactoryTokenId genesis transaction (4/5)")
  const loanKeyFactoryGenesisTx = fullGenesisTxs[3]
  const loanKeyFactoryTokenIdOutputs = loanKeyFactoryGenesisTx.vout.filter(output =>
    output.tokenData && output.tokenData.category === deploymentToVerify.tokenIds.loanKeyFactoryTokenId
  )
  console.log(`loanKeyFactoryTokenId genesis transaction has ${loanKeyFactoryGenesisTx.vout.length} outputs, incl. ${loanKeyFactoryTokenIdOutputs.length} outputs with the loanKeyFactoryTokenId`)

  const loanKeyFactoryTokenIdGenesisOutputTypes = {
    loanKeyFactoryContractAddress: 0
  }

  for (const output of loanKeyFactoryGenesisTx.vout) {
    const outputAddress = output.scriptPubKey.addresses[0]
    if (outputAddress !== loanKeyFactoryContractAddress && output.tokenData) {
      throw new Error(`Unexpected token output found in loanKeyFactoryTokenId genesis transaction: ${loanKeyFactoryGenesisTx.txid}`)
    }
    if (output.tokenData && BigInt(output.tokenData.amount) > 0n) {
      throw new Error(`Unexpected fungible tokens in loanKeyFactoryTokenId genesis transaction: ${loanKeyFactoryGenesisTx.txid}`)
    }
    if (outputAddress === loanKeyFactoryContractAddress) {
      validateLoanKeyFactoryContractOutput(output, loanKeyFactoryGenesisTx)
      loanKeyFactoryTokenIdGenesisOutputTypes.loanKeyFactoryContractAddress += 1
    }
  }
  console.log("Total fungible token supply is zero as expected")
  console.log("loanKeyFactoryTokenId genesis transaction output counts by address:", loanKeyFactoryTokenIdGenesisOutputTypes)
  console.log("✅ Verified loanKeyFactoryTokenId genesis transaction successfully.")

  /* 5. Verify OracleMigrationKeyTokenId genesis transaction */

  console.log("\nVerifying the oracleMigrationKeyTokenId genesis transaction (5/5)")
  const oracleMigrationKeyGenesisTx = fullGenesisTxs[4]
  const oracleMigrationKeyTokenIdOutputs = oracleMigrationKeyGenesisTx.vout.filter(output =>
    output.tokenData && output.tokenData.category === deploymentToVerify.tokenIds.oracleMigrationKeyTokenId
  )
  console.log(`oracleMigrationKeyTokenId genesis transaction has ${oracleMigrationKeyGenesisTx.vout.length} outputs, incl. ${oracleMigrationKeyTokenIdOutputs.length} outputs with the oracleMigrationKeyTokenId`)

  // Verify no fungible tokens in oracleMigrationKeyTokenId genesis transaction
  for (const output of oracleMigrationKeyGenesisTx.vout) {
    if (output.tokenData && BigInt(output.tokenData.amount) > 0n) {
      throw new Error(`Unexpected fungible tokens in oracleMigrationKeyTokenId genesis transaction: ${oracleMigrationKeyGenesisTx.txid}`)
    }
  }
  console.log("Total fungible token supply is zero as expected")

  // priceContractAddress is derived from oracleMigrationKeyTokenId in contractAddresses.ts
  // Verification that outputs exist at priceContractAddress confirms the oracleMigrationKeyTokenId is correct
  if (paryonTokenIdGenesisOutputTypes.priceContractAddress === 0) {
    throw new Error("No price contract outputs found at expected address (derived from oracleMigrationKeyTokenId)")
  }

  console.log(`PriceContract address (derived from oracleMigrationKeyTokenId) has ${paryonTokenIdGenesisOutputTypes.priceContractAddress} output(s) in paryonTokenId genesis tx`)

  console.log("✅ Verified oracleMigrationKeyTokenId genesis transaction.")

  console.log("\n🎉 Contract setup verification completed successfully for the token IDs listed above.")

  await provider.disconnect();
} catch (error) {
  console.error("\n❌ Contract setup verification failed:", (error as Error).message);
  console.error("🚨 DO NOT TRUST the specified deployment and token IDs without further verification.\n\n");
  
  await provider.disconnect();
}
