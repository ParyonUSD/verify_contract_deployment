import { DEPLOYMENT_MAINNET_V1 } from '@paryonusd/library';

// This deployment config is used in the 'verifySetup' script
const deploymentToVerify = DEPLOYMENT_MAINNET_V1

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