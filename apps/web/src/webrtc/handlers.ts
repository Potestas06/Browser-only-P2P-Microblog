import { createEnvelope, parseEnvelope, verifyEnvelope } from "@p2p/core";
import type {
  MessageEnvelope,
  HelloPayload,
  ObjectPutPayload,
  ObjectGetPayload,
  ObjectsHavePayload,
} from "@p2p/core";
import { putObject, getObject, listObjectIds } from "@p2p/core";
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

export async function sendObjectPut(
  conn: PeerConnection,
  identity: IdentityRecord,
  object: ObjectPutPayload["object"]
): Promise<void> {
  const payload: ObjectPutPayload = { object };
  const envelope = await createEnvelope(
    "object_put",
    payload,
    identity.publicKey,
    identity.secretKey
  );
  conn.send(envelope);
}

export async function sendObjectGet(
  conn: PeerConnection,
  identity: IdentityRecord,
  objectId: string
): Promise<void> {
  const payload: ObjectGetPayload = { objectId };
  const envelope = await createEnvelope(
    "object_get",
    payload,
    identity.publicKey,
    identity.secretKey
  );
  conn.send(envelope);
}

export async function sendObjectsHave(
  conn: PeerConnection,
  identity: IdentityRecord
): Promise<void> {
  const objectIds = await listObjectIds();
  const payload: ObjectsHavePayload = { objectIds };
  const envelope = await createEnvelope(
    "objects_have",
    payload,
    identity.publicKey,
    identity.secretKey
  );
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

export const defaultHandlers: MessageHandlers = {
  object_put: async (env) => {
    const payload = env.payload as ObjectPutPayload;
    if (payload?.object) {
      await putObject(payload.object);
    }
  },
  object_get: async (env, conn, identity) => {
    const payload = env.payload as ObjectGetPayload;
    if (!payload?.objectId) return;
    const obj = await getObject(payload.objectId);
    if (obj) await sendObjectPut(conn, identity, obj);
  },
};
