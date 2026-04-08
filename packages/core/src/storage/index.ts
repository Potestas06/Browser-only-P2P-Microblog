import Dexie, { type Table } from "dexie";
import type { SignedObject, FollowList, BlockList } from "../types/index.js";

export interface IdentityRecord {
  id: string;
  publicKey: string;
  secretKey: string;
  username: string;
}

export interface StoredObject {
  objectId: string;
  type: string;
  authorPubkey: string;
  timestamp: number;
  data: SignedObject;
}

export interface PeerEntry {
  pubkey: string;
  seenAt: number;
}

class P2PDatabase extends Dexie {
  identity!: Table<IdentityRecord, string>;
  objects!: Table<StoredObject, string>;
  peers!: Table<PeerEntry, string>;
  follows!: Table<FollowList, string>;
  blocks!: Table<BlockList, string>;

  constructor() {
    super("p2p-microblog");
    this.version(1).stores({
      identity: "id",
      objects: "&objectId, type, authorPubkey, timestamp",
      peers: "&pubkey, seenAt",
    });
    this.version(2).stores({
      identity: "id",
      objects: "&objectId, type, authorPubkey, timestamp",
      peers: "&pubkey, seenAt",
      follows: "&ownerPubkey",
      blocks: "&ownerPubkey",
    });
  }
}

export const db = new P2PDatabase();

export async function saveIdentity(identity: IdentityRecord): Promise<void> {
  await db.identity.put(identity);
}

export async function loadIdentity(): Promise<IdentityRecord | undefined> {
  return db.identity.get("local");
}

export async function putObject(obj: SignedObject): Promise<void> {
  const payload = obj.payload;
  await db.objects.put({
    objectId: obj.objectId,
    type: payload.type,
    authorPubkey: payload.authorPubkey,
    timestamp: payload.timestamp,
    data: obj,
  });
}

export async function getObject(id: string): Promise<SignedObject | undefined> {
  const row = await db.objects.get(id);
  return row?.data;
}

export async function listObjects(): Promise<SignedObject[]> {
  const rows = await db.objects.orderBy("timestamp").reverse().toArray();
  return rows.map((r) => r.data);
}

export async function listObjectsByAuthor(pubkey: string): Promise<SignedObject[]> {
  const rows = await db.objects.where("authorPubkey").equals(pubkey).toArray();
  rows.sort((a, b) => b.timestamp - a.timestamp);
  return rows.map((r) => r.data);
}

export async function listObjectsByType(type: string): Promise<SignedObject[]> {
  const rows = await db.objects.where("type").equals(type).toArray();
  rows.sort((a, b) => b.timestamp - a.timestamp);
  return rows.map((r) => r.data);
}

export async function savePeer(entry: PeerEntry): Promise<void> {
  await db.peers.put(entry);
}

export async function listPeers(): Promise<PeerEntry[]> {
  return db.peers.toArray();
}

export async function listObjectIds(): Promise<string[]> {
  const rows = await db.objects.toCollection().primaryKeys();
  return rows as string[];
}

export async function getFollowList(ownerPubkey: string): Promise<FollowList> {
  const row = await db.follows.get(ownerPubkey);
  return row ?? { ownerPubkey, following: [] };
}

export async function saveFollowList(list: FollowList): Promise<void> {
  await db.follows.put(list);
}

export async function getBlockList(ownerPubkey: string): Promise<BlockList> {
  const row = await db.blocks.get(ownerPubkey);
  return row ?? { ownerPubkey, blocked: [] };
}

export async function saveBlockList(list: BlockList): Promise<void> {
  await db.blocks.put(list);
}


