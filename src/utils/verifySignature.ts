import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";

export default async function verifySignature(
  address: string,
  signatureBase58: string,
  message: string
): Promise<boolean> {
  try {
    const pubkey = new PublicKey(address);
    const signature = bs58.decode(signatureBase58);
    const messageUint8 = new TextEncoder().encode(message);

    return pubkey.verify(messageUint8, signature);
  } catch {
    return false;
  }
}