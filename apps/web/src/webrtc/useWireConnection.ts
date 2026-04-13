import { useRef, useEffect } from "react";
import { useIdentity } from "../state/IdentityContext";
import { usePeers } from "../state/PeersContext";
import { usePosts } from "../state/PostsContext";
import { handleMessage, defaultHandlers, sendHello, sendObjectsHave } from "./handlers";
import { sendPeerList } from "./gossip";
import {
  sendIntroduceRequest,
  handleIntroduceRequest,
  handleIntroduceOffer,
  handleIntroduceAnswer,
} from "./introductions";
import { createOffer } from "./invite";
import type { PeerConnection } from "./connection";

// Shared across all hook instances — tracks in-flight introduction handshakes.
export const pendingIntroConns = new Map<string, PeerConnection>();

export function useWireConnection() {
  const { identity } = useIdentity();
  const { addPeer, removePeer, peers, knownPeerKeys } = usePeers();
  const { refresh } = usePosts();

  const identityRef = useRef(identity);
  const peersRef = useRef(peers);
  const knownPeerKeysRef = useRef(knownPeerKeys);
  const addPeerRef = useRef(addPeer);
  const removePeerRef = useRef(removePeer);
  const refreshRef = useRef(refresh);

  useEffect(() => { identityRef.current = identity; }, [identity]);
  useEffect(() => { peersRef.current = peers; }, [peers]);
  useEffect(() => { knownPeerKeysRef.current = knownPeerKeys; }, [knownPeerKeys]);
  useEffect(() => { addPeerRef.current = addPeer; }, [addPeer]);
  useEffect(() => { removePeerRef.current = removePeer; }, [removePeer]);
  useEffect(() => { refreshRef.current = refresh; }, [refresh]);

  // Self-referential ref so recursive introduce_offer wiring always uses the latest function.
  const wireConnectionRef = useRef<(conn: PeerConnection) => void>(() => {});

  async function autoIntroduce(conn: PeerConnection): Promise<void> {
    const id = identityRef.current;
    if (!id) return;
    const targets = knownPeerKeysRef.current.filter(
      (pk) => pk !== conn.remotePubkey && !peersRef.current.has(pk) && !pendingIntroConns.has(pk)
    );
    for (const targetPubkey of targets) {
      try {
        const { connection: introConn, inviteCode } = await createOffer(id.publicKey);
        wireConnectionRef.current(introConn);
        pendingIntroConns.set(targetPubkey, introConn);
        await sendIntroduceRequest(conn, id, targetPubkey, inviteCode);
      } catch (err) {
        console.warn("Auto-introduce failed for", targetPubkey.slice(0, 12), err);
        pendingIntroConns.delete(targetPubkey);
      }
    }
  }

  function wireConnection(conn: PeerConnection): void {
    conn.onMessage((data) => {
      const id = identityRef.current;
      if (!id) return;
      handleMessage(data, conn, id, {
        ...defaultHandlers,
        objects_have: async (env) => {
          await defaultHandlers.objects_have?.(env, conn, id);
          await refreshRef.current();
        },
        object_put: async (env) => {
          await defaultHandlers.object_put(env, conn, id);
          await refreshRef.current();
        },
        introduce_request: async (env) => {
          await handleIntroduceRequest(env, conn, id, (pk) =>
            peersRef.current.get(pk) ?? undefined
          );
        },
        introduce_offer: async (env) => {
          const result = await handleIntroduceOffer(env, conn, id);
          if (result) {
            wireConnectionRef.current(result.connection);
            addPeerRef.current(result.remotePubkey, result.connection);
          }
        },
        introduce_answer: async (env) => {
          await handleIntroduceAnswer(
            env,
            id,
            (pk) => peersRef.current.get(pk) ?? undefined,
            (pk) => pendingIntroConns.get(pk),
            (pk, c) => {
              addPeerRef.current(pk, c);
              pendingIntroConns.delete(pk);
            }
          );
        },
      });
    });

    conn.onStateChange((state) => {
      const id = identityRef.current;
      if (state === "connected" && id) {
        sendHello(conn, id);
        sendObjectsHave(conn, id);
        sendPeerList(conn, id);
        void autoIntroduce(conn);
      }
      if (state === "failed" || state === "closed") {
        removePeerRef.current(conn.remotePubkey);
        pendingIntroConns.delete(conn.remotePubkey);
      }
    });

    conn.onError(() => {
      console.warn("DataChannel error for peer", conn.remotePubkey);
      removePeerRef.current(conn.remotePubkey);
    });
  }

  wireConnectionRef.current = wireConnection;

  return { wireConnection };
}
