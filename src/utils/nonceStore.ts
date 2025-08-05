const nonces: Record<string, string> = {};

export function setNonce(address: string, nonce: string) {
  nonces[address] = nonce;
}

export function getNonce(address: string): string | undefined {
  return nonces[address];
}