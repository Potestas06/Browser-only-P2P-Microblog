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
      objects: "objectId, type, authorPubkey, timestamp",
      peers: "&pubkey, seenAt",
    });
  }
}

export const db = new P2PDatabase();
