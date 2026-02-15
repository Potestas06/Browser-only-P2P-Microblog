import { useState } from "react";
import { useIdentity } from "../state/IdentityContext";
import { usePeers } from "../state/PeersContext";
import { createOffer, createAnswer, applyAnswer } from "../webrtc/invite";
import type { PeerConnection } from "../webrtc/connection";

export default function ConnectPage() {
  const { identity } = useIdentity();
  const { addPeer } = usePeers();

  const [step, setStep] = useState<"choose" | "offer" | "answer">("choose");
  const [offerCode, setOfferCode] = useState("");
  const [answerCode, setAnswerCode] = useState("");
  const [pendingConn, setPendingConn] = useState<PeerConnection | null>(null);
  const [pasted, setPasted] = useState("");
  const [status, setStatus] = useState("");

  if (!identity) return <p className="text-slate-400">Loading…</p>;

  async function handleCreateOffer() {
    const { connection, inviteCode } = await createOffer(identity!.publicKey);
    setOfferCode(inviteCode);
    setPendingConn(connection);
    setStep("offer");
  }

  async function handleApplyAnswer() {
    if (!pendingConn || !pasted) return;
    try {
      const remotePubkey = await applyAnswer(pendingConn, pasted);
      addPeer(remotePubkey, pendingConn);
      setStatus("Connected to " + remotePubkey.slice(0, 12) + "…");
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
      setAnswerCode(inviteCode);
      addPeer(remotePubkey, connection);
      setStatus("Connected to " + remotePubkey.slice(0, 12) + "…");
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
              placeholder="Paste answer code…"
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
            <p className="text-sm text-slate-400 mb-2">Paste the offerer's invite code:</p>
            <textarea
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              rows={4}
              className="w-full rounded border border-slate-700 bg-slate-900 p-2 font-mono text-xs"
              placeholder="Paste offer code…"
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
