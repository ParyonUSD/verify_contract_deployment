import { paryonArtifacts } from '@paryonusd/contracts';
import { getAddressLockingBytecode, reverseHex } from './utils.js';
import { Contract, ElectrumNetworkProvider } from 'cashscript';
import { network, deploymentToVerify } from './config.js';

const { oraclePublicKey, protocolFeeLockingBytecode, startBlockHeight, periodLengthBlocks, timeLockRedemption  } = deploymentToVerify.contractParams;
const { paryonTokenId, poolTokenId, redeemerTokenId, loanKeyFactoryTokenId, oracleMigrationKeyTokenId } = deploymentToVerify.tokenIds;

const { artifactLoan, artifactBorrowing, artifactPriceContract, loanContractFunctions, artifactLoanSidecar } = paryonArtifacts
const { artifactPayout, artifactStabilityPool, artifactStabilityPoolSidecar, poolContractFunctions, artifactCollector } = paryonArtifacts.stabilityPool
const { artifactRedeemer, artifactRedemption, artifactRedemptionSidecar } = paryonArtifacts.redeemer
const { artifactLoanKeyFactory, artifactLoanKeyOriginEnforcer, artifactLoanKeyOriginProof } = paryonArtifacts.loanKey

// provider needed to generate contract addresses for the correct network
const provider = new ElectrumNetworkProvider(network);

/* 1. Construct the contract addresses for the ParyonTokenId genesis transaction */

// generate loanContractLockingBytecode
const loanContract = new Contract(artifactLoan, [], { provider });
const loanContractLockingBytecode = getAddressLockingBytecode(loanContract.address)
// generate loanSidecarLockingScript
const loanSidecarContract = new Contract(artifactLoanSidecar, [], { provider });
const loanSidecarLockingScript = getAddressLockingBytecode(loanSidecarContract.address)
// generate loanKeyOriginEnforcerLockingBytecode
const enforcerArgs = [reverseHex(loanKeyFactoryTokenId), reverseHex(paryonTokenId)] as const
const loanKeyOriginEnforcerContract = new Contract(artifactLoanKeyOriginEnforcer, [...enforcerArgs], { provider });
const loanKeyOriginEnforcerLockingBytecode = getAddressLockingBytecode(loanKeyOriginEnforcerContract.address);
// initialise contracts
const paryonArgs = [
  loanContractLockingBytecode,
  loanSidecarLockingScript,
  protocolFeeLockingBytecode,
  loanKeyOriginEnforcerLockingBytecode,
  startBlockHeight,
  periodLengthBlocks
] as const
const paryonContract = new Contract(artifactBorrowing, [...paryonArgs], { provider });
const priceContractArgs = [oraclePublicKey, reverseHex(oracleMigrationKeyTokenId)] as const
const priceContract = new Contract(artifactPriceContract, [...priceContractArgs], { provider });
const contractFunctionsLoan = [
  new Contract(loanContractFunctions.artifactFunctionLiquidate, [reverseHex(poolTokenId)], { provider }),
  new Contract(loanContractFunctions.artifactFunctionManage, [], { provider }),
  new Contract(loanContractFunctions.artifactFunctionRedeem, [
    reverseHex(redeemerTokenId), timeLockRedemption, startBlockHeight, periodLengthBlocks
  ], { provider }),
  new Contract(loanContractFunctions.artifactFunctionStartRedemption, [reverseHex(redeemerTokenId)], { provider }),
  new Contract(loanContractFunctions.artifactFunctionSwapInRedemption, [reverseHex(redeemerTokenId)], { provider }),
  new Contract(loanContractFunctions.artifactFunctionSwapOutRedemption, [reverseHex(redeemerTokenId)], { provider }),
  new Contract(loanContractFunctions.artifactFunctionPayInterest, [reverseHex(poolTokenId)], { provider }),
  new Contract(loanContractFunctions.artifactFunctionChangeInterest, [],  { provider })
]
const borrowingContractAddress = paryonContract.address;
const priceContractAddress = priceContract.address;
const loanFunctionAddresses = contractFunctionsLoan.map(contractFunction => contractFunction.address)
const allParyonTokenIdContractAddresses = [
  paryonContract.address,
  priceContract.address,
  ...loanFunctionAddresses
]

/* 2. Construct the contract addresses for the PoolTokenId genesis transaction */

const stabilityPoolContract = new Contract(artifactStabilityPool, [], { provider });
const stabilityPoolSidecarContract = new Contract(artifactStabilityPoolSidecar,  [reverseHex(paryonTokenId)], { provider });
const payoutContract = new Contract(artifactPayout, [], { provider });

const collectorContract = new Contract(artifactCollector, [reverseHex(paryonTokenId), protocolFeeLockingBytecode], { provider });

// get lockingbytecodes
const payoutContractLockingBytecode = getAddressLockingBytecode(payoutContract.address)
const collectorContractLockingBytecode = getAddressLockingBytecode(collectorContract.address)

const contractFunctionsPool = [
  new Contract(poolContractFunctions.artifactFunctionAddLiquidity, [reverseHex(paryonTokenId)], { provider }),
  new Contract(poolContractFunctions.artifactFunctionLiquidateLoan, [reverseHex(paryonTokenId)], { provider }),
  new Contract(poolContractFunctions.artifactFunctionNewPeriodPool, [
    payoutContractLockingBytecode, collectorContractLockingBytecode, startBlockHeight, periodLengthBlocks
  ], { provider }),
  new Contract(poolContractFunctions.artifactFunctionWithdrawFromPool, [], { provider })
]
const poolFunctionAddresses = contractFunctionsPool.map(contractFunction => contractFunction.address)

const stabilityPoolContractAddress = stabilityPoolContract.address;
const collectorContractAddress = collectorContract.address;
const allPoolTokenIdContractAddresses = [
  stabilityPoolContract.address,
  collectorContract.address,
  ...poolFunctionAddresses
]

// the stabilityPoolSidecarContractAddress does not hold any PoolTokenId tokens, 
// but will still be verified for correct setup
const stabilityPoolSidecarContractAddress = stabilityPoolSidecarContract.address;

/* 3. Construct the redeemerContractAddress for the RedeemerTokenId genesis transaction */

// generate redemptionSidecarLockingScript
const redemptionSidecarContract = new Contract(artifactRedemptionSidecar, [], { provider });
const redemptionSidecarLockingScript = getAddressLockingBytecode(redemptionSidecarContract.address)

// generate redemptionLockingScript
const redemptionContract = new Contract(artifactRedemption, [reverseHex(paryonTokenId)], { provider });
const redemptionLockingScript = getAddressLockingBytecode(redemptionContract.address)

const redeemerArgs = [reverseHex(paryonTokenId), redemptionLockingScript, redemptionSidecarLockingScript] as const
const redeemerContract = new Contract(artifactRedeemer, [...redeemerArgs], { provider });
const redeemerContractAddress = redeemerContract.address;

/* 4. Construct the loanKeyFactoryContract contract address for the LoanKeyFactoryTokenId genesis transaction */

// generate loanKeyOriginProofLockingBytecode
const loanKeyOriginProofContract = new Contract(artifactLoanKeyOriginProof, [], { provider });
const loanKeyOriginProofLockingBytecode = getAddressLockingBytecode(loanKeyOriginProofContract.address);

const loanKeyFactoryArgs = [
  loanKeyOriginEnforcerLockingBytecode, loanKeyOriginProofLockingBytecode
] as const
const loanKeyFactoryContract = new Contract(artifactLoanKeyFactory, [...loanKeyFactoryArgs], { provider });
const loanKeyFactoryContractAddress = loanKeyFactoryContract.address;

export {
  borrowingContractAddress,
  priceContractAddress,
  loanFunctionAddresses,
  allParyonTokenIdContractAddresses,
  stabilityPoolContractAddress,
  collectorContractAddress,
  poolFunctionAddresses,
  allPoolTokenIdContractAddresses,
  stabilityPoolSidecarContractAddress,
  redeemerContractAddress,
  loanKeyFactoryContractAddress
}