import { binToHex, bigIntToVmNumber, padMinimallyEncodedVmNumber } from "@bitauth/libauth"
import type { ElectrumRawTransactionVout, ElectrumRawTransaction } from './electrumTypes.js';
import { loanFunctionAddresses, poolFunctionAddresses, stabilityPoolSidecarContractAddress } from './contractAddresses.js';
import { deploymentToVerify } from './config.js';

const bigIntToVmEncodingFixedByteLength = (
  value: bigint,
  byteLength: number,
): string => {
  if (byteLength < 1) throw new Error('byteLength must be ≥ 1');

  const minimal = bigIntToVmNumber(value);

  if (minimal.length > byteLength) {
    throw new Error('value exceeds the requested byteLength');
  }

  if (minimal.length === byteLength) {
    return binToHex(minimal);
  }

  return binToHex(padMinimallyEncodedVmNumber(minimal, byteLength));
};

const firstParyonPeriod = 0n
const firstPeriodHexBytes4 = bigIntToVmEncodingFixedByteLength(firstParyonPeriod,4)

export function validateParyonContractOutput(output: ElectrumRawTransactionVout, paryonGenesisTx: ElectrumRawTransaction) {
  if(!output.tokenData?.nft) {
    throw new Error(`Expected NFT token data in paryonTokenId genesis transaction output for paryon contract: ${paryonGenesisTx.txid}`)
  }
  const { capability, commitment } = output.tokenData.nft
  if(capability != "minting"){
    throw new Error(`Expected minting capability for paryon contract NFT in genesis transaction: ${paryonGenesisTx.txid}`)
  }
  const expectedCommitment = firstPeriodHexBytes4
  if(commitment != expectedCommitment){
    throw new Error(`Unexpected commitment for paryon contract NFT in genesis transaction: ${paryonGenesisTx.txid}. Expected: ${expectedCommitment}, got: ${commitment}`)
  }
}

export function validatePriceContractOutput(output: ElectrumRawTransactionVout, paryonGenesisTx: ElectrumRawTransaction) {
  if(!output.tokenData?.nft) {
    throw new Error(`Expected NFT token data in paryonTokenId genesis transaction output for price contract: ${paryonGenesisTx.txid}`)
  }
  const { capability, commitment } = output.tokenData.nft
  if(capability != "mutable"){
    throw new Error(`Expected mutable capability for price contract NFT in genesis transaction: ${paryonGenesisTx.txid}`)
  }
  // Price state is `0x00 identifier + bytes4 sequence + bytes4 price` (9 bytes). The covenants tell a
  // price contract from a loan by that leading byte alone, so it is a base case of the formal proof.
  if(!commitment || commitment.length != 18){
    throw new Error(`Unexpected commitment length for price contract NFT in genesis transaction: ${paryonGenesisTx.txid}. Expected length: 18, got: ${commitment?.length}`)
  }
  if(!commitment.startsWith("00")){
    throw new Error(`Unexpected leading byte for price contract NFT commitment in genesis transaction: ${paryonGenesisTx.txid}. Expected the price-state identifier 00, got: ${commitment.slice(0, 2)}`)
  }
}

// note: the order of the loanFunctionCommitments matches the order of the loanFunctionAddresses
const loanFunctionCommitments = ["01", "02", "03", "04", "05", "06", "07", "08"]

export function validateLoanFunctionOutput(output: ElectrumRawTransactionVout, paryonGenesisTx: ElectrumRawTransaction) {
  if(!output.tokenData?.nft) {
    throw new Error(`Expected NFT token data in paryonTokenId genesis transaction output for loan function contract: ${paryonGenesisTx.txid}`)
  }
  const { capability, commitment } = output.tokenData.nft
  if(capability != "none"){
    throw new Error(`Expected no capability for loan function contract NFT in genesis transaction: ${paryonGenesisTx.txid}`)
  }
  // check the commitment is matching the expected loan function commitments for this loan function contract
  const loanContractFunctionAddress = output.scriptPubKey.addresses[0]
  const loanContractFunctionIndex = loanFunctionAddresses.findIndex(address => loanContractFunctionAddress === address)
  const loanContractFunctionCommitment = loanFunctionCommitments[loanContractFunctionIndex]
  if(commitment !== loanContractFunctionCommitment) {
    throw new Error(`Invalid loan function commitment: ${commitment}. Expected ${loanContractFunctionCommitment} for loan function address: ${loanContractFunctionAddress}`)
  }
}

export function validateStabilityPoolContractOutput(output: ElectrumRawTransactionVout, poolGenesisTx: ElectrumRawTransaction) {
  if(!output.tokenData?.nft) {
    throw new Error(`Expected NFT token data in poolTokenId genesis transaction output for stability pool contract: ${poolGenesisTx.txid}`)
  }
  const { capability, commitment } = output.tokenData.nft
  if(capability != "minting"){
    throw new Error(`Expected minting capability for poolTokenId contract NFT in genesis transaction: ${poolGenesisTx.txid}`)
  }
  // starting pool contract commitment is only validated to be 10 bytes
  const totalStakedEpoch = 0n
  const totalStakedEpochBytes6 = bigIntToVmEncodingFixedByteLength(totalStakedEpoch,6)
  const expectedPoolCommitment = firstPeriodHexBytes4 + totalStakedEpochBytes6
  if(commitment !== expectedPoolCommitment){
    throw new Error(`Unexpected commitment length for stability pool contract NFT in genesis transaction: ${poolGenesisTx.txid}. Expected ${expectedPoolCommitment}, got: ${commitment}`)
  }
}

export function validateStabilityPoolHasSidecarOutput(output: ElectrumRawTransactionVout, poolGenesisTx: ElectrumRawTransaction) {
  const stabilityPoolOutputIndex = output.n
  // sidecar output must be the next output after the stability pool output
  const sidecarOutputIndex = stabilityPoolOutputIndex + 1
  const sidecarOutput = poolGenesisTx.vout[sidecarOutputIndex]
  const sidecarOutputAddress = sidecarOutput.scriptPubKey.addresses[0]
  if(!sidecarOutput || sidecarOutputAddress !== stabilityPoolSidecarContractAddress) {
    throw new Error(`Expected sidecar output at index ${sidecarOutputIndex} in poolTokenId genesis transaction for stability pool contract: ${poolGenesisTx.txid}`)
  }
  if(sidecarOutput.tokenData) {
    throw new Error(`Expected no token data in poolTokenId genesis transaction output for stability pool sidecar contract: ${poolGenesisTx.txid}`)
  }
}

export function validateCollectorContractOutput(output: ElectrumRawTransactionVout, poolGenesisTx: ElectrumRawTransaction) {
  if(!output.tokenData?.nft) {
    throw new Error(`Expected NFT token data in poolTokenId genesis transaction output for collector contract: ${poolGenesisTx.txid}`)
  }
  const { capability, commitment } = output.tokenData.nft
  if(capability != "mutable"){
    throw new Error(`Expected mutable capability for collector contract NFT in genesis transaction: ${poolGenesisTx.txid}`)
  }
  const expectedCommitment = firstPeriodHexBytes4
  if(commitment != expectedCommitment){
    throw new Error(`Unexpected commitment for collector contract NFT in genesis transaction: ${poolGenesisTx.txid}. Expected: ${expectedCommitment}, got: ${commitment}`)
  }
}

// note: the order of the poolFunctionCommitments matches the order of the poolFunctionAddresses
const poolFunctionCommitments = ["01", "02", "03", "04"]

export function validatePoolFunctionOutput(output: ElectrumRawTransactionVout, poolGenesisTx: ElectrumRawTransaction) {
  if(!output.tokenData?.nft) {
    throw new Error(`Expected NFT token data in poolTokenId genesis transaction output for pool function contract: ${poolGenesisTx.txid}`)
  }
  const { capability, commitment } = output.tokenData.nft
  if(capability != "none"){
    throw new Error(`Expected no capability for pool function contract NFT in genesis transaction: ${poolGenesisTx.txid}`)
  }
  // check the commitment is matching the expected pool function commitments for this pool function contract
  const poolFunctionAddress = output.scriptPubKey.addresses[0]
  const poolFunctionIndex = poolFunctionAddresses.findIndex(address => poolFunctionAddress === address)
  const poolFunctionCommitment = poolFunctionCommitments[poolFunctionIndex]
  if(commitment !== poolFunctionCommitment) {
    throw new Error(`Invalid pool function commitment: ${commitment}. Expected ${poolFunctionCommitment} for pool function address: ${poolFunctionAddress}`)
  }
}

export function validateRedeemerContractOutput(output: ElectrumRawTransactionVout, redeemerGenesisTx: ElectrumRawTransaction) {
  if(!output.tokenData?.nft) {
    throw new Error(`Expected NFT token data in redeemerTokenId genesis transaction output for redeemer contract: ${redeemerGenesisTx.txid}`)
  }
  const { capability, commitment } = output.tokenData.nft
  if(capability != "minting"){
    throw new Error(`Expected minting capability for redeemer contract NFT in genesis transaction: ${redeemerGenesisTx.txid}`)
  }
  if(commitment != ""){
    throw new Error(`Expected empty commitment for redeemer contract NFT in genesis transaction: ${redeemerGenesisTx.txid}`)
  }
}

export function validateLoanKeyFactoryContractOutput(output: ElectrumRawTransactionVout, loanKeyFactoryGenesisTx: ElectrumRawTransaction) {
  if(!output.tokenData?.nft) {
    throw new Error(`Expected NFT token data in loanKeyFactoryTokenId genesis transaction output for loan key factory contract: ${loanKeyFactoryGenesisTx.txid}`)
  }
  const { capability, commitment } = output.tokenData.nft
  if(capability != "minting"){
    throw new Error(`Expected minting capability for loan key factory contract NFT in genesis transaction: ${loanKeyFactoryGenesisTx.txid}`)
  }
  if(commitment != ""){
    throw new Error(`Expected empty commitment for loan key factory contract NFT in genesis transaction: ${loanKeyFactoryGenesisTx.txid}`)
  }
}
/**
 * The function NFTs of the deployment: the immutable NFTs whose presence on a function contract
 * is what makes that covenant operation possible. Each one is identified by its
 * (category, immutable capability, 1-byte commitment) shape and belongs on exactly one address.
 */
const functionNfts = [
  ...loanFunctionAddresses.map((address, index) => ({
    label: `loan function ${index + 1}/${loanFunctionAddresses.length}`,
    category: deploymentToVerify.tokenIds.paryonTokenId,
    commitment: loanFunctionCommitments[index],
    address
  })),
  ...poolFunctionAddresses.map((address, index) => ({
    label: `pool function ${index + 1}/${poolFunctionAddresses.length}`,
    category: deploymentToVerify.tokenIds.poolTokenId,
    commitment: poolFunctionCommitments[index],
    address
  }))
]

/**
 * Base case of the function-NFT invariant proven in paryon_formal_verification. The covenants accept
 * a function NFT by shape alone (category + one-byte commitment), and the proof that no such NFT can
 * ever exist off its function contract assumes the deploy state starts that way. Over every output
 * of all 5 genesis transactions: a function-NFT shape sits only on the function contract it
 * designates, and every output on a function contract is that contract's function NFT.
 */
export function validateNoStrayFunctionNfts(genesisTxs: ElectrumRawTransaction[]) {
  for (const genesisTx of genesisTxs) {
    for (const output of genesisTx.vout) {
      // Skip OP_RETURN outputs (e.g. BCMR metadata) — they are provably unspendable
      if (output.scriptPubKey.hex.startsWith('6a')) continue;
      const outputAddress = output.scriptPubKey.addresses[0]
      const { category, nft } = output.tokenData ?? {}

      // 1. an output with the function-NFT shape must sit on the function contract it designates
      const impersonatedFunctionNft = nft?.capability === "none"
        ? functionNfts.find(functionNft =>
            functionNft.category === category && functionNft.commitment === nft.commitment
          )
        : undefined
      if (impersonatedFunctionNft && outputAddress !== impersonatedFunctionNft.address) {
        throw new Error(`Stray ${impersonatedFunctionNft.label} NFT (commitment ${nft?.commitment}) in genesis transaction ${genesisTx.txid} output ${output.n}: it is on address ${outputAddress} instead of its function contract ${impersonatedFunctionNft.address}`)
      }

      // 2. an output on a function contract must be exactly that contract's function NFT
      const expectedFunctionNft = functionNfts.find(functionNft => functionNft.address === outputAddress)
      if (expectedFunctionNft && !impersonatedFunctionNft) {
        throw new Error(`Unexpected output on the ${expectedFunctionNft.label} contract ${outputAddress} in genesis transaction ${genesisTx.txid} output ${output.n}: expected the function NFT (category ${expectedFunctionNft.category}, capability none, commitment ${expectedFunctionNft.commitment}), got category ${category}, capability ${nft?.capability}, commitment ${nft?.commitment}`)
      }
    }
  }
}
