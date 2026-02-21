import { toBase64, fromBase64 } from "@p2p/core";
import { PeerConnection } from "./connection";

export interface InviteOffer {
  type: "offer";
  sdp: string;
  pubkey: string;
}

export interface InviteAnswer {
  type: "answer";
  sdp: string;
  pubkey: string;
}

export function encodeInvite(data: InviteOffer | InviteAnswer): string {
  return toBase64(JSON.stringify(data));
}

export function decodeInvite(code: string): InviteOffer | InviteAnswer {
  return JSON.parse(fromBase64(code.trim()));
}

export async function createOffer(
  localPubkey: string
): Promise<{ connection: PeerConnection; inviteCode: string }> {
  const conn = new PeerConnection("pending");
  const pc = conn.getPeerConnection();

  const channel = pc.createDataChannel("p2p");
  conn.setupChannel(channel);

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  await waitForIceGathering(pc);

  const invite: InviteOffer = {
    type: "offer",
    sdp: pc.localDescription!.sdp,
    pubkey: localPubkey,
  };

  return { connection: conn, inviteCode: encodeInvite(invite) };
}

export async function createAnswer(
  localPubkey: string,
  offerCode: string
): Promise<{ connection: PeerConnection; inviteCode: string; remotePubkey: string }> {
  const offer = decodeInvite(offerCode) as InviteOffer;
  const conn = new PeerConnection(offer.pubkey);
  const pc = conn.getPeerConnection();

  await pc.setRemoteDescription({ type: "offer", sdp: offer.sdp });
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  await waitForIceGathering(pc);

  const invite: InviteAnswer = {
    type: "answer",
    sdp: pc.localDescription!.sdp,
    pubkey: localPubkey,
  };

  return { connection: conn, inviteCode: encodeInvite(invite), remotePubkey: offer.pubkey };
}

export async function applyAnswer(
  connection: PeerConnection,
  answerCode: string
): Promise<string> {
  const answer = decodeInvite(answerCode) as InviteAnswer;
  const pc = connection.getPeerConnection();
  await pc.setRemoteDescription({ type: "answer", sdp: answer.sdp });
  connection.remotePubkey = answer.pubkey;
  return answer.pubkey;
}

async function waitForIceGathering(pc: RTCPeerConnection, timeoutMs = 10_000): Promise<void> {
  if (pc.iceGatheringState === "complete") return;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pc.removeEventListener("icegatheringstatechange", check);
      resolve();
    }, timeoutMs);

    const check = () => {
      if (pc.iceGatheringState === "complete") {
        clearTimeout(timer);
        pc.removeEventListener("icegatheringstatechange", check);
        resolve();
      }
    };
    pc.addEventListener("icegatheringstatechange", check);
  });
}
