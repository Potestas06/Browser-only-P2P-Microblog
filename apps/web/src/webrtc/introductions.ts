import { createEnvelope } from "@p2p/core";
import type {
  MessageEnvelope,
  IntroduceRequestPayload,
  IntroduceOfferPayload,
  IntroduceAnswerPayload,
} from "@p2p/core";
import type { PeerConnection } from "./connection";
import type { IdentityRecord } from "@p2p/core";
import { createAnswer, applyAnswer } from "./invite";

export async function sendIntroduceRequest(
  conn: PeerConnection,
  identity: IdentityRecord,
  targetPubkey: string,
  sdp: string
): Promise<void> {
  const payload: IntroduceRequestPayload = { targetPubkey, sdp };
  const envelope = await createEnvelope(
    "introduce_request",
    payload,
    identity.publicKey,
    identity.secretKey
  );
  conn.send(envelope);
}

/**
 * B (broker) receives introduce_request from A and forwards A's SDP offer to C.
 * B does NOT create a new connection — it only relays A's offer.
 */
export async function handleIntroduceRequest(
  env: MessageEnvelope,
  conn: PeerConnection,
  identity: IdentityRecord,
  getPeer: (pubkey: string) => PeerConnection | undefined
): Promise<void> {
  const payload = env.payload as IntroduceRequestPayload;
  if (!payload?.targetPubkey || !payload?.sdp) return;

  const target = getPeer(payload.targetPubkey);
  if (!target) return;

  const offerPayload: IntroduceOfferPayload = {
    forPubkey: payload.targetPubkey,
    fromPubkey: env.from,
    sdp: payload.sdp,
  };
  const offerEnv = await createEnvelope(
    "introduce_offer",
    offerPayload,
    identity.publicKey,
    identity.secretKey
  );
  target.send(offerEnv);
}

/**
 * C receives introduce_offer (A's SDP offer forwarded by B).
 * C creates an answer and sends it back to B for forwarding to A.
 * Returns the new PeerConnection (A→C) so the caller can wire it up.
 */
export async function handleIntroduceOffer(
  env: MessageEnvelope,
  conn: PeerConnection,
  identity: IdentityRecord
): Promise<{ connection: PeerConnection; remotePubkey: string } | null> {
  const payload = env.payload as IntroduceOfferPayload;
  if (payload.forPubkey !== identity.publicKey) return null;

  const { connection, inviteCode, remotePubkey } = await createAnswer(
    identity.publicKey,
    payload.sdp
  );

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

  return { connection, remotePubkey };
}

/**
 * Handles introduce_answer:
 * - Broker (B): forPubkey !== identity.publicKey → forward to A.
 * - Requester (A): forPubkey === identity.publicKey → apply answer.
 */
export async function handleIntroduceAnswer(
  env: MessageEnvelope,
  identity: IdentityRecord,
  getPeer: (pubkey: string) => PeerConnection | undefined,
  getPendingConn: (pubkey: string) => PeerConnection | undefined,
  onConnected: (pubkey: string, conn: PeerConnection) => void
): Promise<void> {
  const payload = env.payload as IntroduceAnswerPayload;

  if (payload.forPubkey !== identity.publicKey) {
    const target = getPeer(payload.forPubkey);
    if (!target) return;
    // Re-sign so A's env.from check passes (A sees B as the sender, not C)
    const forwardEnv = await createEnvelope(
      "introduce_answer",
      payload,
      identity.publicKey,
      identity.secretKey
    );
    target.send(forwardEnv);
    return;
  }

  const pendingConn = getPendingConn(payload.fromPubkey);
  if (!pendingConn) return;

  try {
    const remotePubkey = await applyAnswer(pendingConn, payload.sdp);
    onConnected(remotePubkey, pendingConn);
  } catch (err) {
    console.warn("Failed to apply introduction answer", err);
  }
}
