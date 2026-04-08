import { useState, useRef, useEffect } from "react";
import { useIdentity } from "../state/IdentityContext";
import { usePeers } from "../state/PeersContext";
import { usePosts } from "../state/PostsContext";
import { createOffer, createAnswer, applyAnswer } from "../webrtc/invite";
import { sendHello, sendObjectsHave, handleMessage, defaultHandlers } from "../webrtc/handlers";
import { sendPeerList } from "../webrtc/gossip";
import {
  handleIntroduceRequest,
  handleIntroduceOffer,
  handleIntroduceAnswer,
} from "../webrtc/introductions";
import type { PeerConnection } from "../webrtc/connection";

const pendingIntroConns = new Map<string, PeerConnection>();

export default function ConnectPage() {
  const { identity } = useIdentity();
  const { addPeer, removePeer, peers } = usePeers();
  const { refresh } = usePosts();
  const peersRef = useRef(peers);
  useEffect(() => { peersRef.current = peers; }, [peers]);

  const [step, setStep] = useState<"choose" | "offer" | "answer">("choose");
  const [offerCode, setOfferCode] = useState("");
  const [answerCode, setAnswerCode] = useState("");
  const [pendingConn, setPendingConn] = useState<PeerConnection | null>(null);
  const [pasted, setPasted] = useState("");
  const [status, setStatus] = useState("");

  if (!identity) return <p className="text-slate-400">Loading...</p>;

  function wireConnection(conn: PeerConnection) {
    conn.onMessage((data) => {
      handleMessage(data, conn, identity!, {
        ...defaultHandlers,
        objects_have: async (env) => {
          await defaultHandlers.objects_have?.(env, conn, identity!);
          await refresh();
        },
        object_put: async (env) => {
          await defaultHandlers.object_put(env, conn, identity!);
          await refresh();
        },
        introduce_request: async (env) => {
          await handleIntroduceRequest(env, conn, identity!, (pk) =>
            peersRef.current.get(pk) ?? undefined
          );
        },
        introduce_offer: async (env) => {
          const result = await handleIntroduceOffer(env, conn, identity!);
          if (result) {
            wireConnection(result.connection);
            addPeer(result.remotePubkey, result.connection);
          }
        },
        introduce_answer: async (env) => {
          await handleIntroduceAnswer(
            env,
            identity!,
            (pk) => peersRef.current.get(pk) ?? undefined,
            (pk) => pendingIntroConns.get(pk),
            (pk, c) => {
              addPeer(pk, c);
              pendingIntroConns.delete(pk);
            }
          );
        },
      });
    });
    conn.onStateChange((state) => {
      if (state === "connected") {
        sendHello(conn, identity!);
        sendObjectsHave(conn, identity!);
        sendPeerList(conn, identity!);
      }
      if (state === "failed" || state === "closed") {
        removePeer(conn.remotePubkey);
        pendingIntroConns.delete(conn.remotePubkey);
      }
    });
    conn.onError(() => {
      console.warn("DataChannel error for peer", conn.remotePubkey);
      removePeer(conn.remotePubkey);
    });
  }

  async function handleCreateOffer() {
    const { connection, inviteCode } = await createOffer(identity!.publicKey);
    wireConnection(connection);
    setOfferCode(inviteCode);
    setPendingConn(connection);
    setStep("offer");
  }

  async function handleApplyAnswer() {
    if (!pendingConn || !pasted) return;
    try {
      const remotePubkey = await applyAnswer(pendingConn, pasted);
      addPeer(remotePubkey, pendingConn);
      setStatus("Connected to " + remotePubkey.slice(0, 12) + "...");
    } catch {
      setStatus("Failed to apply answer. Check the code.");
    }
  }

  async function handleAnswer() {
    if (!pasted) return;
    try {
      const { connection, inviteCode, remotePubkey } = await createAnswer(
        identity!.publicKey,
        pasted
      );
      wireConnection(connection);
      setAnswerCode(inviteCode);
      addPeer(remotePubkey, connection);
      setStatus("Connected to " + remotePubkey.slice(0, 12) + "...");
    } catch {
      setStatus("Failed to parse offer. Check the code.");
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Connect to a Peer</h2>

      {step === "choose" && (
        <div className="flex gap-4">
          <button
            onClick={handleCreateOffer}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm hover:bg-indigo-500"
          >
            Create Invite (Offerer)
          </button>
          <button
            onClick={() => setStep("answer")}
            className="rounded-md border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800"
          >
            Accept Invite (Answerer)
          </button>
        </div>
      )}

      {step === "offer" && (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-400 mb-2">Share this invite code with your peer:</p>
            <textarea
              readOnly
              value={offerCode}
              rows={4}
              className="w-full rounded border border-slate-700 bg-slate-900 p-2 font-mono text-xs text-slate-300"
            />
            <button
              onClick={() => navigator.clipboard.writeText(offerCode)}
              className="mt-2 rounded border border-slate-600 px-3 py-1 text-xs hover:bg-slate-800"
            >
              Copy
            </button>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-2">Paste their answer code here:</p>
            <textarea
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              rows={4}
              className="w-full rounded border border-slate-700 bg-slate-900 p-2 font-mono text-xs"
              placeholder="Paste answer code..."
            />
            <button
              onClick={handleApplyAnswer}
              className="mt-2 rounded bg-indigo-600 px-3 py-1 text-sm hover:bg-indigo-500"
            >
              Connect
            </button>
          </div>
        </div>
      )}

      {step === "answer" && (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-400 mb-2">Paste the offerer invite code:</p>
            <textarea
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              rows={4}
              className="w-full rounded border border-slate-700 bg-slate-900 p-2 font-mono text-xs"
              placeholder="Paste offer code..."
            />
            <button
              onClick={handleAnswer}
              className="mt-2 rounded bg-indigo-600 px-3 py-1 text-sm hover:bg-indigo-500"
            >
              Generate Answer
            </button>
          </div>
          {answerCode && (
            <div>
              <p className="text-sm text-slate-400 mb-2">Share this answer code with the offerer:</p>
              <textarea
                readOnly
                value={answerCode}
                rows={4}
                className="w-full rounded border border-slate-700 bg-slate-900 p-2 font-mono text-xs text-slate-300"
              />
              <button
                onClick={() => navigator.clipboard.writeText(answerCode)}
                className="mt-2 rounded border border-slate-600 px-3 py-1 text-xs hover:bg-slate-800"
              >
                Copy
              </button>
            </div>
          )}
        </div>
      )}

      {status && <p className="text-sm text-green-400">{status}</p>}
    </div>
  );
}