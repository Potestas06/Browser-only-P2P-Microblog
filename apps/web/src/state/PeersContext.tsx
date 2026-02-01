import { createContext, useContext, type ReactNode } from "react";

const PeersContext = createContext<null>(null);

export function PeersProvider({ children }: { children: ReactNode }) {
  return <PeersContext.Provider value={null}>{children}</PeersContext.Provider>;
}

export function usePeers() {
  return useContext(PeersContext);
}
