import { createContext, useContext, type ReactNode } from "react";

const IdentityContext = createContext<null>(null);

export function IdentityProvider({ children }: { children: ReactNode }) {
  return <IdentityContext.Provider value={null}>{children}</IdentityContext.Provider>;
}

export function useIdentity() {
  return useContext(IdentityContext);
}
