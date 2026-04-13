import { useEffect, useRef } from "react";
import { useIdentity } from "../state/IdentityContext";
import { usePeers } from "../state/PeersContext";
import { createOffer, createAnswer, applyAnswer } from "../webrtc/invite";
import { useWireConnection, pendingIntroConns } from "../webrtc/useWireConnection";
import type { PeerConnection } from "../webrtc/connection";

type SignalingMsg =
  | { type: "offer"; fromPubkey: string; targetPubkey: string; inviteCode: string }
  | { type: "answer"; fromPubkey: string; targetPubkey: string; inviteCode: string };

/**
 * Always-mounted component that manages automatic peer reconnection.
 *
 * Same-browser reconnection (tabs/windows on the same device):
 *   Uses BroadcastChannel as a local signaling bus. When a known peer is not
 *   connected, an offer is broadcast. Any window running as that peer answers
 *   automatically — no user action needed.
 *
 * Cross-device reconnection:
 *   Once any single peer is reconnected (via manual invite or BroadcastChannel),
 *   autoIntroduce() fires over that connection and asks the broker to relay offers
 *   to every other known peer, cascading reconnections across the whole network.
 */
export default function PeerNetwork() {
  const { identity } = useIdentity();
  const { peers, knownPeerKeys, addPeer } = usePeers();
  const { wireConnection } = useWireConnection();

  const identityRef = useRef(identity);
  const peersRef = useRef(peers);
  const addPeerRef = useRef(addPeer);
  const wireConnectionRef = useRef(wireConnection);

  useEffect(() => { identityRef.current = identity; }, [identity]);
  useEffect(() => { peersRef.current = peers; }, [peers]);
  useEffect(() => { addPeerRef.current = addPeer; }, [addPeer]);
  useEffect(() => { wireConnectionRef.current = wireConnection; }, [wireConnection]);

  // outgoing offers keyed by targetPubkey
  const pendingOutgoing = useRef(new Map<string, { conn: PeerConnection; inviteCode: string }>());
  // pubkeys we have already answered (prevents double-answering on collision)
  const answered = useRef(new Set<string>());

  const channelRef = useRef<BroadcastChannel | null>(null);

  // Set up the BroadcastChannel listener once.
  useEffect(() => {
    const channel = new BroadcastChannel("p2p-signaling");
    channelRef.current = channel;

    channel.onmessage = async (event: MessageEvent<SignalingMsg>) => {
      const msg = event.data;
      const identity = identityRef.current;
      if (!identity) return;

      if (msg.type === "offer" && msg.targetPubkey === identity.publicKey) {
        if (peersRef.current.has(msg.fromPubkey)) return;
        if (answered.current.has(msg.fromPubkey)) return;

        // Collision: both sides sent an offer simultaneously.
        // Tiebreaker: lower pubkey (lexicographic) stays as offerer.
        if (pendingOutgoing.current.has(msg.fromPubkey)) {
          if (identity.publicKey < msg.fromPubkey) {
            return; // we are the offerer — wait for our answer
          }
          // they are the offerer — cancel ours and answer theirs
          pendingOutgoing.current.get(msg.fromPubkey)!.conn.close();
          pendingOutgoing.current.delete(msg.fromPubkey);
        }

        answered.current.add(msg.fromPubkey);
        try {
          const { connection, inviteCode, remotePubkey } = await createAnswer(
            identity.publicKey,
            msg.inviteCode
          );
          wireConnectionRef.current(connection);
          addPeerRef.current(remotePubkey, connection);
          channel.postMessage({
            type: "answer",
            fromPubkey: identity.publicKey,
            targetPubkey: msg.fromPubkey,
            inviteCode,
          } as SignalingMsg);
        } catch (err) {
          console.warn("Local signaling: answer failed for", msg.fromPubkey.slice(0, 12), err);
          answered.current.delete(msg.fromPubkey);
        }
      }

      if (msg.type === "answer" && msg.targetPubkey === identity.publicKey) {
        const pending = pendingOutgoing.current.get(msg.fromPubkey);
        if (!pending) return;
        if (peersRef.current.has(msg.fromPubkey)) {
          pending.conn.close();
          pendingOutgoing.current.delete(msg.fromPubkey);
          return;
        }
        try {
          const remotePubkey = await applyAnswer(pending.conn, msg.inviteCode);
          addPeerRef.current(remotePubkey, pending.conn);
        } catch (err) {
          console.warn("Local signaling: apply answer failed for", msg.fromPubkey.slice(0, 12), err);
        }
        pendingOutgoing.current.delete(msg.fromPubkey);
      }
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, []);

  // Whenever known peers or active connections change, broadcast offers for any
  // known peer that is not yet connected and not already being introduced.
  useEffect(() => {
    const channel = channelRef.current;
    if (!identity || !channel) return;

    const unconnected = knownPeerKeys.filter(
      (pk) =>
        !peers.has(pk) &&
        !pendingOutgoing.current.has(pk) &&
        !pendingIntroConns.has(pk)
    );

    for (const targetPubkey of unconnected) {
      createOffer(identity.publicKey)
        .then(({ connection, inviteCode }) => {
          if (!channelRef.current) {
            connection.close();
            return;
          }
          wireConnectionRef.current(connection);
          pendingOutgoing.current.set(targetPubkey, { conn: connection, inviteCode });
          channelRef.current.postMessage({
            type: "offer",
            fromPubkey: identity.publicKey,
            targetPubkey,
            inviteCode,
          } as SignalingMsg);
        })
        .catch(() => {});
    }
  }, [identity, knownPeerKeys, peers]);

  return null;
}
