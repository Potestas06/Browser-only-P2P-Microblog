import { createContext, useContext, useState, type ReactNode } from "react";
import type { PeerConnection } from "../webrtc/connection";

interface PeersContextValue {
  peers: Map<string, PeerConnection>;
  addPeer: (pubkey: string, conn: PeerConnection) => void;
  removePeer: (pubkey: string) => void;
  knownPeerKeys: string[];
  addKnownPeer: (pubkey: string) => void;
}

const PeersContext = createContext<PeersContextValue | null>(null);

export function PeersProvider({ children }: { children: ReactNode }) {
  const [peers, setPeers] = useState<Map<string, PeerConnection>>(new Map());
  const [knownPeerKeys, setKnownPeerKeys] = useState<string[]>([]);

  function addPeer(pubkey: string, conn: PeerConnection) {
    setPeers((prev) => new Map(prev).set(pubkey, conn));
    addKnownPeer(pubkey);
  }

  function removePeer(pubkey: string) {
    setPeers((prev) => {
      const m = new Map(prev);
      m.delete(pubkey);
      return m;
    });
  }

  function addKnownPeer(pubkey: string) {
    setKnownPeerKeys((prev) => (prev.includes(pubkey) ? prev : [...prev, pubkey]));
  }

  return (
    <PeersContext.Provider value={{ peers, addPeer, removePeer, knownPeerKeys, addKnownPeer }}>
      {children}
    </PeersContext.Provider>
  );
}

export function usePeers() {
  const ctx = useContext(PeersContext);
  if (!ctx) throw new Error("usePeers must be used within PeersProvider");
  return ctx;
}
