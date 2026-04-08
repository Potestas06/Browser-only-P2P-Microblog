import { canonicalize, objectId } from "../canonical/index.js";
import { sign, verify } from "../crypto/index.js";
import type { MessageEnvelope } from "../types/index.js";

export async function createEnvelope(
  type: string,
  payload: unknown,
  fromPubkey: string,
  secretKey: string
): Promise<MessageEnvelope> {
  const timestamp = Date.now();
  const id = await objectId({ type, payload, from: fromPubkey, timestamp });
  const signable = canonicalize({ type, id, from: fromPubkey, timestamp, payload });
  const signature = await sign(signable, secretKey);
  return { type, id, from: fromPubkey, timestamp, payload, signature };
}

export function parseEnvelope(raw: unknown): MessageEnvelope {
  if (typeof raw !== "object" || raw === null) throw new Error("Invalid envelope");
  const env = raw as Record<string, unknown>;
  if (!env.type || !env.id || !env.from || typeof env.timestamp !== "number" || !env.signature || env.payload === undefined) {
    throw new Error("Missing required envelope fields");
  }
  return raw as MessageEnvelope;
}

export async function verifyEnvelope(env: MessageEnvelope): Promise<boolean> {
  const { signature, ...rest } = env;
  const signable = canonicalize(rest);
  return verify(signable, signature, env.from);
}
