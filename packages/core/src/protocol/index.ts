import { canonicalize, objectId } from "../canonical/index.js";
import { sign } from "../crypto/index.js";
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
