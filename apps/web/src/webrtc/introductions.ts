import { createEnvelope, parseEnvelope, verifyEnvelope } from "@p2p/core";
import type {
  MessageEnvelope,
  IntroduceRequestPayload,
  IntroduceOfferPayload,
  IntroduceAnswerPayload,
} from "@p2p/core";
import type { PeerConnection } from "./connection";
import type { IdentityRecord } from "@p2p/core";
import { createOffer, createAnswer, applyAnswer } from "./invite";

export async function sendIntroduceRequest(
  conn: PeerConnection,
  identity: IdentityRecord,
  targetPubkey: string
): Promise<void> {
  const payload: IntroduceRequestPayload = { targetPubkey };
  const envelope = await createEnvelope(
    "introduce_request",
    payload,
    identity.publicKey,
    identity.secretKey
  );
  conn.send(envelope);
}

export async function handleIntroduceRequest(
  env: MessageEnvelope,
  conn: PeerConnection,
  identity: IdentityRecord,
  getPeer: (pubkey: string) => PeerConnection | undefined
): Promise<void> {
  const payload = env.payload as IntroduceRequestPayload;
  const target = getPeer(payload.targetPubkey);
  if (!target) return;

  const { connection, inviteCode } = await createOffer(identity.publicKey);
  const offerPayload: IntroduceOfferPayload = {
    forPubkey: env.from,
    fromPubkey: identity.publicKey,
    sdp: inviteCode,
  };
  const offerEnv = await createEnvelope(
    "introduce_offer",
    offerPayload,
    identity.publicKey,
    identity.secretKey
  );
  target.send(offerEnv);
  return connection as unknown as void;
}

export async function handleIntroduceOffer(
  env: MessageEnvelope,
  conn: PeerConnection,
  identity: IdentityRecord
): Promise<void> {
  const payload = env.payload as IntroduceOfferPayload;
  if (payload.forPubkey !== identity.publicKey) return;

  const { inviteCode } = await createAnswer(identity.publicKey, payload.sdp);
  const answerPayload: IntroduceAnswerPayload = {
    forPubkey: payload.fromPubkey,
    fromPubkey: identity.publicKey,
    sdp: inviteCode,
  };
  const answerEnv = await createEnvelope(
    "introduce_answer",
    answerPayload,
    identity.publicKey,
    identity.secretKey
  );
  conn.send(answerEnv);
}

export async function handleIntroduceAnswer(
  env: MessageEnvelope,
  getPendingConn: (pubkey: string) => PeerConnection | undefined,
  onConnected: (pubkey: string, conn: PeerConnection) => void
): Promise<void> {
  const payload = env.payload as IntroduceAnswerPayload;
  const conn = getPendingConn(payload.fromPubkey);
  if (!conn) return;

  try {
    const remotePubkey = await applyAnswer(conn, payload.sdp);
    onConnected(remotePubkey, conn);
  } catch (err) {
    console.warn("Failed to apply introduction answer", err);
  }
}
