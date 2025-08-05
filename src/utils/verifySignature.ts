import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import nacl from "tweetnacl";

export default async function verifySignature(
  address: string,
  signatureBase58: string,
  message: string
): Promise<boolean> {
  try {
    const pubkey = new PublicKey(address).toBytes();
    const signature = bs58.decode(signatureBase58);
    const messageUint8 = new TextEncoder().encode(message);

    return nacl.sign.detached.verify(messageUint8, signature, pubkey);
  } catch {
    return false;
  }
}
