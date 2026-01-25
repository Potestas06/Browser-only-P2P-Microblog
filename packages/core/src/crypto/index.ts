import * as ed from "@noble/ed25519";
import { bytesToHex, hexToBytes } from "../utils/index.js";

// ── Key types ────────────────────────────────────────────────────────────────

export interface KeyPair {
  publicKey: string;
  secretKey: string;
}

export { bytesToHex as pubkeyToHex, hexToBytes as hexToPubkey };

export function isValidHexKey(hex: string, expectedByteLen: number): boolean {
  return typeof hex === "string" && hex.length === expectedByteLen * 2 && /^[0-9a-f]+$/.test(hex);
}

// ── Key generation ────────────────────────────────────────────────────────────

export async function generateKeyPair(): Promise<KeyPair> {
  const secretBytes = ed.utils.randomPrivateKey();
  const publicBytes = await ed.getPublicKeyAsync(secretBytes);
  return {
    secretKey: bytesToHex(secretBytes),
    publicKey: bytesToHex(publicBytes),
  };
}

// ── Signing ───────────────────────────────────────────────────────────────────

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
