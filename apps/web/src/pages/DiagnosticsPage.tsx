import { useEffect, useState } from "react";
import { listPeers, listObjects } from "@p2p/core";
import { usePeers } from "../state/PeersContext";

export default function DiagnosticsPage() {
  const { peers, knownPeerKeys } = usePeers();
  const [objectCount, setObjectCount] = useState(0);
  const [storedPeerCount, setStoredPeerCount] = useState(0);

  useEffect(() => {
    (async () => {
      const objs = await listObjects();
      setObjectCount(objs.length);
      const peerList = await listPeers();
      setStoredPeerCount(peerList.length);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Diagnostics</h2>
      <dl className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
          <dt className="text-xs text-slate-500">Active Connections</dt>
          <dd className="mt-1 text-2xl font-semibold text-green-400">{peers.size}</dd>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
          <dt className="text-xs text-slate-500">Known Peers</dt>
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
    </div>
  );
}
