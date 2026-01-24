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

export async function sign(message: string, secretKeyHex: string): Promise<string> {
  const msgBytes = new TextEncoder().encode(message);
  const secretBytes = hexToBytes(secretKeyHex);
  const sigBytes = await ed.signAsync(msgBytes, secretBytes);
  return bytesToHex(sigBytes);
}

export async function verify(
  message: string,
  signatureHex: string,
  publicKeyHex: string
): Promise<boolean> {
  try {
    const msgBytes = new TextEncoder().encode(message);
    const sigBytes = hexToBytes(signatureHex);
    const pubBytes = hexToBytes(publicKeyHex);
    return await ed.verifyAsync(sigBytes, msgBytes, pubBytes);
  } catch {
    return false;
  }
}
