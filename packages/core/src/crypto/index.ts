import * as ed from "@noble/ed25519";
import { bytesToHex, hexToBytes } from "../utils/index.js";

export interface KeyPair {
  publicKey: string;
  secretKey: string;
}

export async function generateKeyPair(): Promise<KeyPair> {
  const secretBytes = ed.utils.randomPrivateKey();
  const publicBytes = await ed.getPublicKeyAsync(secretBytes);
  return {
    secretKey: bytesToHex(secretBytes),
    publicKey: bytesToHex(publicBytes),
  };
}
