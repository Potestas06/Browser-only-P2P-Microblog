import { useIdentity } from "../state/IdentityContext";

export default function IdentityPage() {
  const { identity } = useIdentity();

  if (!identity) {
    return <p className="text-slate-400">Generating identity…</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Your Identity</h2>
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-4 space-y-4">
        <div>
          <p className="text-xs text-slate-500 mb-1">Public Key</p>
          <p className="font-mono text-xs text-slate-300 break-all">{identity.publicKey}</p>
        </div>
        {identity.username && (
          <div>
            <p className="text-xs text-slate-500 mb-1">Username</p>
            <p className="text-slate-200">{identity.username}</p>
          </div>
        )}
        <p className="text-xs text-slate-600">Identity is stored in your browser only.</p>
      </div>
    </div>
  );
}
