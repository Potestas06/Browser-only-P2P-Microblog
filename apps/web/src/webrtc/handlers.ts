import { createEnvelope, parseEnvelope, verifyEnvelope } from "@p2p/core";
import type { MessageEnvelope, HelloPayload } from "@p2p/core";
import type { PeerConnection } from "./connection";
import type { IdentityRecord } from "@p2p/core";

export type HandlerFn = (
  env: MessageEnvelope,
  conn: PeerConnection,
  identity: IdentityRecord
) => Promise<void>;

export type MessageHandlers = Record<string, HandlerFn>;

export async function sendHello(conn: PeerConnection, identity: IdentityRecord): Promise<void> {
  const payload: HelloPayload = {
    protocolVersion: "0.1",
    capabilities: ["gossip", "introductions"],
  };
  const envelope = await createEnvelope("hello", payload, identity.publicKey, identity.secretKey);
  conn.send(envelope);
}

export async function handleMessage(
  data: unknown,
  conn: PeerConnection,
  identity: IdentityRecord,
  handlers: MessageHandlers
): Promise<void> {
  let env: MessageEnvelope;
  try {
    env = parseEnvelope(data);
  } catch {
    return;
  }

  const valid = await verifyEnvelope(env);
  if (!valid) return;

  const handler = handlers[env.type];
  if (handler) await handler(env, conn, identity);
}
