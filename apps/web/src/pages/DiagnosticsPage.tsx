import { useEffect, useState } from "react";
import { listPeers, listObjects } from "@p2p/core";
import { usePeers } from "../state/PeersContext";

interface ConnectionStat {
  pubkey: string;
  state: RTCPeerConnectionState;
}

export default function DiagnosticsPage() {
  const { peers, knownPeerKeys } = usePeers();
  const [objectCount, setObjectCount] = useState(0);
  const [storedPeerCount, setStoredPeerCount] = useState(0);
  const [connStats, setConnStats] = useState<ConnectionStat[]>([]);

  useEffect(() => {
    (async () => {
      const [objs, peerList] = await Promise.all([listObjects(), listPeers()]);
      setObjectCount(objs.length);
      setStoredPeerCount(peerList.length);
    })();

    const stats: ConnectionStat[] = [];
    for (const [pubkey, conn] of peers) {
      stats.push({ pubkey, state: conn.connectionState });
    }
    setConnStats(stats);
  }, [peers.size]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Diagnostics</h2>
      <dl className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
          <dt className="text-xs text-slate-500">Active Connections</dt>
          <dd className="mt-1 text-2xl font-semibold text-green-400">{peers.size}</dd>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
          <dt className="text-xs text-slate-500">Known Peers (DB)</dt>
          <dd className="mt-1 text-2xl font-semibold">{storedPeerCount}</dd>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
          <dt className="text-xs text-slate-500">Stored Objects</dt>
          <dd className="mt-1 text-2xl font-semibold">{objectCount}</dd>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
          <dt className="text-xs text-slate-500">Seen Peer Keys</dt>
          <dd className="mt-1 text-2xl font-semibold">{knownPeerKeys.length}</dd>
        </div>
      </dl>

      {connStats.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-slate-300">Connection Details</h3>
          {connStats.map(({ pubkey, state }) => (
            <div
              key={pubkey}
              className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900 px-4 py-2"
            >
              <span className="font-mono text-xs text-slate-400">{pubkey.slice(0, 20)}…</span>
              <span
                className={
                  "text-xs font-medium " +
                  (state === "connected" ? "text-green-400" : "text-yellow-400")
                }
              >
                {state}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
