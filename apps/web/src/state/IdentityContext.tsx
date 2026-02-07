import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { generateKeyPair } from "@p2p/core";
import { loadIdentity, saveIdentity, type IdentityRecord } from "@p2p/core";

interface IdentityContextValue {
  identity: IdentityRecord | null;
  setUsername: (name: string) => Promise<void>;
}

const IdentityContext = createContext<IdentityContextValue | null>(null);

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<IdentityRecord | null>(null);

  useEffect(() => {
    (async () => {
      let stored = await loadIdentity();
      if (!stored) {
        const kp = await generateKeyPair();
        stored = { id: "local", publicKey: kp.publicKey, secretKey: kp.secretKey, username: "" };
        await saveIdentity(stored);
      }
      setIdentity(stored);
    })();
  }, []);

  async function setUsername(name: string) {
    if (!identity) return;
    const updated = { ...identity, username: name };
    await saveIdentity(updated);
    setIdentity(updated);
  }

  return (
    <IdentityContext.Provider value={{ identity, setUsername }}>
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity() {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error("useIdentity must be used within IdentityProvider");
  return ctx;
}
