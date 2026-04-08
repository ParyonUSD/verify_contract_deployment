import { cashAddressToLockingBytecode, binToHex } from '@bitauth/libauth';

export function getAddressLockingBytecode(address: string): string {
  const result = cashAddressToLockingBytecode(address);
  if (typeof result === 'string') throw new Error(result);
  return binToHex(result.bytecode);
}

export function reverseHex(hex: string): string {
  return hex.match(/../g)!.reverse().join('');
}
