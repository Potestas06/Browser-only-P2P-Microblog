import { createEnvelope, parseEnvelope, verifyEnvelope } from "@p2p/core";
import type {
  MessageEnvelope,
  ObjectsHavePayload,
  ObjectGetPayload,
  PeerListPayload,
  PeerRecord,
} from "@p2p/core";
import { listObjectIds, getObject, savePeer, listPeers, putObject } from "@p2p/core";
import type { PeerConnection } from "./connection";
import type { IdentityRecord } from "@p2p/core";
import { sendObjectPut } from "./handlers";

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

export async function handleObjectsHave(
  env: MessageEnvelope,
  conn: PeerConnection,
  identity: IdentityRecord,
  onNewObjects?: () => void
): Promise<void> {
  const payload = env.payload as ObjectsHavePayload;
  if (!payload?.objectIds) return;

  const local = new Set(await listObjectIds());
  const missing = payload.objectIds.filter((id) => !local.has(id));

  for (const objectId of missing) {
    const getPayload: ObjectGetPayload = { objectId };
    const envelope = await createEnvelope(
      "object_get",
      getPayload,
      identity.publicKey,
      identity.secretKey
    );
    conn.send(envelope);
  }
}

export async function sendPeerList(
  conn: PeerConnection,
  identity: IdentityRecord
): Promise<void> {
  const peers = await listPeers();
  const payload: PeerListPayload = {
    peers: peers.map((p) => ({ pubkey: p.pubkey, seenAt: p.seenAt })),
  };
  const envelope = await createEnvelope(
    "peer_list",
    payload,
    identity.publicKey,
    identity.secretKey
  );
  conn.send(envelope);
}

export async function handlePeerList(
  env: MessageEnvelope,
  onNewPeer: (peer: PeerRecord) => void
): Promise<void> {
  const payload = env.payload as PeerListPayload;
  if (!payload?.peers) return;

  for (const peer of payload.peers) {
    await savePeer({ pubkey: peer.pubkey, seenAt: peer.seenAt });
    onNewPeer(peer);
  }
}
