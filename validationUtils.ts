import { binToHex, bigIntToVmNumber, padMinimallyEncodedVmNumber } from "@bitauth/libauth"
import type { ElectrumRawTransactionVout, ElectrumRawTransaction } from './electrumTypes.js';
import { loanFunctionAddresses, poolFunctionAddresses, stabilityPoolSidecarContractAddress } from './contractAddresses.js';

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
  // starting price contract commitment is only validated to be 9 bytes
  if(commitment?.length != 18){
    throw new Error(`Unexpected commitment length for price contract NFT in genesis transaction: ${paryonGenesisTx.txid}. Expected length: 18, got: ${commitment?.length}`)
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