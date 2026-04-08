export type ObjectType = "post" | "reply" | "repost";

export interface Post {
  type: "post";
  authorPubkey: string;
  content: string;
  timestamp: number;
}

export interface Reply {
  type: "reply";
  authorPubkey: string;
  content: string;
  timestamp: number;
  parentId: string;
}

export interface Repost {
  type: "repost";
  authorPubkey: string;
  timestamp: number;
  targetId: string;
}

export interface PeerRecord {
  pubkey: string;
  seenAt: number;
}

export type P2PObject = Post | Reply | Repost;

export interface SignedObject {
  objectId: string;
  payload: P2PObject;
  signature: string;
}

export interface FollowList {
  ownerPubkey: string;
  following: string[];
}

export interface BlockList {
  ownerPubkey: string;
  blocked: string[];
}

export interface MessageEnvelope {
  type: string;
  id: string;
  from: string;
  timestamp: number;
  payload: unknown;
  signature: string;
}

export interface HelloPayload {
  protocolVersion: string;
  capabilities: string[];
}

export interface PeerListPayload {
  peers: PeerRecord[];
}

export interface ObjectsHavePayload {
  objectIds: string[];
}

export interface ObjectGetPayload {
  objectId: string;
}

export interface ObjectPutPayload {
  object: SignedObject;
}

export interface IntroduceRequestPayload {
  targetPubkey: string;
  sdp: string;
}

export interface IntroduceOfferPayload {
  forPubkey: string;
  fromPubkey: string;
  sdp: string;
}

export interface IntroduceAnswerPayload {
  forPubkey: string;
  fromPubkey: string;
  sdp: string;
}
