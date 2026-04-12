// Electrum raw transaction types (copied from @paryonusd/library to avoid library dependency)

export type NFTCapability = "none" | "mutable" | "minting"

export interface ElectrumTokenData {
  amount: string;
  category: string;
  nft?: {
    capability?: NFTCapability;
    commitment?: string;
  };
}

export interface ElectrumRawTransactionVinScriptSig {
  asm: string;
  hex: string;
}

export interface ElectrumRawTransactionVin {
  scriptSig: ElectrumRawTransactionVinScriptSig;
  sequence: number;
  txid: string;
  vout: number;
}

export interface ElectrumRawTransactionVoutScriptPubKey {
  addresses: string[];
  asm: string;
  hex: string;
  reqSigs: number;
  type: string;
}

export interface ElectrumRawTransactionVout {
  n: number;
  scriptPubKey: ElectrumRawTransactionVoutScriptPubKey;
  value: number;
  tokenData?: ElectrumTokenData;
}

export interface ElectrumRawTransaction {
  blockhash: string;
  blocktime: number | undefined;
  time: number | undefined;
  confirmations: number | undefined;
  hash: string;
  hex: string;
  locktime: number;
  size: number;
  txid: string;
  version: number;
  vin: ElectrumRawTransactionVin[];
  vout: ElectrumRawTransactionVout[];
}
