import type { Network } from 'cashscript';

// This deployment config is used in the 'verifySetup' script.
// The mainnet-v1 deployment is hardcoded here so this verification tool avoids having a
// dependency on the @paryonusd/library.
// Once the library has been open sourced, deployments can instead be imported from it, e.g.:
//   import { DEPLOYMENT_MAINNET_V1 } from '@paryonusd/library';
const deploymentToVerify = {
  name: 'mainnet-v1',
  network: 'mainnet' as Network,
  tokenIds: {
    paryonTokenId: '2469acc5afa4b10cb5b5c04afb89c3a3ffd61c5da9c01e26d00951cae2a02544',
    poolTokenId: '7708645a7f30e97003573d9322202960a560a87527bef3666a30044a0dfdfa81',
    redeemerTokenId: '649b2d862f01a904addf9095ae64860a59071544ee4a3695f14cbbc75571f930',
    loanKeyFactoryTokenId: 'f07165f2c3448ced3bf0b33f9048ceb7567a2c07adb60d8f11b301c42db97405',
    oracleMigrationKeyTokenId: '7776202e8f4eca51d5e634799c66c6a87076cc6efcc64c1322e7e880c71f6d30'
  },
  contractParams: {
    oraclePublicKey: '02d09db08af1ff4e8453919cc866a4be427d7bfe18f2c05e5444c196fcf6fd2818',
    protocolFeeLockingBytecode: 'aa207c7a248c794af2cdf1b1a66a2311347c45b177fcb3aad730a7823c9e32fc754087',
    startBlockHeight: 948406n,
    periodLengthBlocks: 144n,
    timeLockRedemption: 12n
  }
}

const network = deploymentToVerify.network

// Since electrum protocol does not support looking up spending transactions, you
// need to manually provide the genesis transaction ID corresponding to each token ID.
const genesisTxIds = {
  paryonTokenGenesisTxid: '9c938f53eb97e089c72c47e9e5cf5f68ad23fd5eb4cb579c5266f04bba4b4d62',
  poolTokenGenesisTxid: '6a9eb371b2f9379568dad9ed0d4757859f2aa1db33207b6b885135ed8db31c2f',
  redeemerTokenGenesisTxid: '693c322cf1f0012bd17e765ffb5fa46602c1a37af21f6a8a69447e0a511895ea',
  loanKeyFactoryTokenGenesisTxid: '9d432d0f13842ced1f37d03dc3d31faf628c24146292a4c69b09c1a6758a79ff',
  oracleMigrationKeyTokenGenesisTxid: '68180fe720cfd1240e8fc571843522a7fe151ddc6405d6c5d93f3543906051de'
}

// Known General Protocols oracle public key, please verify this by visiting
//https://oracles.cash/oracles/02d09db08af1ff4e8453919cc866a4be427d7bfe18f2c05e5444c196fcf6fd2818
const KNOWN_GP_ORACLE_PUBKEY = '02d09db08af1ff4e8453919cc866a4be427d7bfe18f2c05e5444c196fcf6fd2818'

export { deploymentToVerify, network, genesisTxIds, KNOWN_GP_ORACLE_PUBKEY };