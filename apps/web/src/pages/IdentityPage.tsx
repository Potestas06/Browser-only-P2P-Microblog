import { useEffect, useState } from "react";
import { useIdentity } from "../state/IdentityContext";
import { usePeers } from "../state/PeersContext";
import { getFollowList, saveFollowList, getBlockList, saveBlockList } from "@p2p/core";

export default function IdentityPage() {
  const { identity, setUsername } = useIdentity();
  const { knownPeerKeys } = usePeers();
  const [copied, setCopied] = useState(false);
  const [following, setFollowing] = useState<string[]>([]);
  const [blocked, setBlocked] = useState<string[]>([]);

  useEffect(() => {
    if (!identity) return;
    Promise.all([
      getFollowList(identity.publicKey),
      getBlockList(identity.publicKey),
    ]).then(([follows, blocks]) => {
      setFollowing(follows.following);
      setBlocked(blocks.blocked);
    });
  }, [identity]);

  if (!identity) {
    return <p className="text-slate-400">Generating identity…</p>;
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(identity!.publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function toggleFollow(pubkey: string) {
    const isFollowing = following.includes(pubkey);
    const updated = isFollowing
      ? following.filter((k) => k !== pubkey)
      : [...following, pubkey];
    setFollowing(updated);
    await saveFollowList({ ownerPubkey: identity!.publicKey, following: updated });
  }

  async function toggleBlock(pubkey: string) {
    const isBlocked = blocked.includes(pubkey);
    const updated = isBlocked
      ? blocked.filter((k) => k !== pubkey)
      : [...blocked, pubkey];
    setBlocked(updated);
    await saveBlockList({ ownerPubkey: identity!.publicKey, blocked: updated });
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Your Identity</h2>
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-4 space-y-4">
        <div>
          <p className="text-xs text-slate-500 mb-1">Public Key</p>
          <p className="font-mono text-xs text-slate-300 break-all">{identity.publicKey}</p>
          <button
            onClick={handleCopy}
            className="mt-2 rounded border border-slate-600 px-3 py-1 text-xs hover:bg-slate-800"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        {identity.username && (
          <div>
            <p className="text-xs text-slate-500 mb-1">Username</p>
            <p className="text-slate-200">{identity.username}</p>
          </div>
        )}
        <p className="text-xs text-slate-600">Identity is stored in your browser only.</p>
      </div>

      {knownPeerKeys.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-slate-300">Known Peers</h3>
          {knownPeerKeys
            .filter((k) => k !== identity.publicKey)
            .map((pubkey) => (
              <div
                key={pubkey}
                className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900 px-4 py-2"
              >
                <span className="font-mono text-xs text-slate-400">{pubkey.slice(0, 20)}…</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleFollow(pubkey)}
                    className={
                      "rounded px-3 py-1 text-xs " +
                      (following.includes(pubkey)
                        ? "bg-indigo-800 text-indigo-200 hover:bg-indigo-700"
                        : "border border-slate-600 hover:bg-slate-800")
                    }
                  >
                    {following.includes(pubkey) ? "Following" : "Follow"}
                  </button>
                  <button
                    onClick={() => toggleBlock(pubkey)}
                    className={
                      "rounded px-3 py-1 text-xs " +
                      (blocked.includes(pubkey)
                        ? "bg-red-900 text-red-200 hover:bg-red-800"
                        : "border border-slate-600 text-slate-400 hover:bg-slate-800")
                    }
                  >
                    {blocked.includes(pubkey) ? "Blocked" : "Block"}
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}


  useEffect(() => {
    if (!identity) return;
    getFollowList(identity.publicKey).then((list) => setFollowing(list.following));
  }, [identity]);

  if (!identity) {
    return <p className="text-slate-400">Generating identity…</p>;
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(identity!.publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function toggleFollow(pubkey: string) {
    const isFollowing = following.includes(pubkey);
    const updated = isFollowing
      ? following.filter((k) => k !== pubkey)
      : [...following, pubkey];
    setFollowing(updated);
    await saveFollowList({ ownerPubkey: identity!.publicKey, following: updated });
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Your Identity</h2>
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-4 space-y-4">
        <div>
          <p className="text-xs text-slate-500 mb-1">Public Key</p>
          <p className="font-mono text-xs text-slate-300 break-all">{identity.publicKey}</p>
          <button
            onClick={handleCopy}
            className="mt-2 rounded border border-slate-600 px-3 py-1 text-xs hover:bg-slate-800"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        {identity.username && (
          <div>
            <p className="text-xs text-slate-500 mb-1">Username</p>
            <p className="text-slate-200">{identity.username}</p>
          </div>
        )}
        <p className="text-xs text-slate-600">Identity is stored in your browser only.</p>
      </div>

      {knownPeerKeys.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-slate-300">Known Peers</h3>
          {knownPeerKeys
            .filter((k) => k !== identity.publicKey)
            .map((pubkey) => (
              <div
                key={pubkey}
                className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900 px-4 py-2"
              >
                <span className="font-mono text-xs text-slate-400">{pubkey.slice(0, 20)}…</span>
                <button
                  onClick={() => toggleFollow(pubkey)}
                  className={
                    "rounded px-3 py-1 text-xs " +
                    (following.includes(pubkey)
                      ? "bg-indigo-800 text-indigo-200 hover:bg-indigo-700"
                      : "border border-slate-600 hover:bg-slate-800")
                  }
                >
                  {following.includes(pubkey) ? "Following" : "Follow"}
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
