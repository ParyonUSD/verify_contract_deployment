import { DEPLOYMENT_MAINNET } from '@paryonusd/library';

// This deployment config is used in the 'verifySetup' script
const deploymentToVerify = DEPLOYMENT_MAINNET

const network = deploymentToVerify.network

// Since electrum protocol does not support looking up spending transactions, you
// need to manually provide the genesis transaction ID corresponding to each token ID.
const genesisTxIds = {
  paryonTokenGenesisTxid: 'de50ba8d7413d16b14b6284b6fb046b44587b191f0ef29d03e68d8f746b82eea',
  poolTokenGenesisTxid: 'd9f242ce8e1a568725b5d99691ce3a5e314490f05ee0699dd18dbb69dc03cabe',
  redeemerTokenGenesisTxid: '2c5abea1f48e1e93310f2f77dc590f70fa8af5c38d5c545f2c5fe8e39e1e6c68',
  loanKeyFactoryTokenGenesisTxid: 'db24747fb267f2b9b8231369c34649eb51b812dac7610b29b13f3a120fb949e0',
  oracleMigrationKeyTokenGenesisTxid: '8b2d4e25927350589fbd6992ab14a3e089cd75d1aec3a93b986aa22aa6db8249'
}

// Known General Protocols oracle public key, please verify this by visiting
//https://oracles.cash/oracles/02d09db08af1ff4e8453919cc866a4be427d7bfe18f2c05e5444c196fcf6fd2818
const KNOWN_GP_ORACLE_PUBKEY = '02d09db08af1ff4e8453919cc866a4be427d7bfe18f2c05e5444c196fcf6fd2818'

export { deploymentToVerify, network, genesisTxIds, KNOWN_GP_ORACLE_PUBKEY };