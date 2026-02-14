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
  return JSON.parse(fromBase64(code));
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
