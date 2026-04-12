import { DEPLOYMENT_CHIPNET_12 } from '@paryonusd/library';

// This deployment config is used in the 'verifySetup' script
// TODO: update this with new mainnet deployment when ready
const deploymentToVerify = DEPLOYMENT_CHIPNET_12

const network = deploymentToVerify.network

// Since electrum protocol does not support looking up spending transactions, you
// need to manually provide the genesis transaction ID corresponding to each token ID.
const genesisTxIds = {
  paryonTokenGenesisTxid: '0e7f8c599058dce0315c013bcfe5bfcf8a6c0a983b40f87f15cf682ea01b807e',
  poolTokenGenesisTxid: '50cbb101835bd48e017884302a7dfa434a502f99319f06a59f7a238f04de91e9',
  redeemerTokenGenesisTxid: 'd8560303632252cb0ae7dbc159adcfcb233900137ab200efdac6b04a09710c39',
  loanKeyFactoryTokenGenesisTxid: 'a342c24cde932a7145d379ab5227200b97fa1ba4f70119da5954e94b49158128',
  oracleMigrationKeyTokenGenesisTxid: '2a05314f5684a1ccd11cae841d2a699a6d17a723111a758c1a1cb53857c298da'
}

// Known General Protocols oracle public key, please verify this by visiting
//https://oracles.cash/oracles/02d09db08af1ff4e8453919cc866a4be427d7bfe18f2c05e5444c196fcf6fd2818
const KNOWN_GP_ORACLE_PUBKEY = '02d09db08af1ff4e8453919cc866a4be427d7bfe18f2c05e5444c196fcf6fd2818'

export { deploymentToVerify, network, genesisTxIds, KNOWN_GP_ORACLE_PUBKEY };