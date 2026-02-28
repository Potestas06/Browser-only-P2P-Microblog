import type { SignedObject, Post, Reply } from "@p2p/core";

interface Props {
  post: SignedObject;
  parentPost?: SignedObject;
}

export default function PostCard({ post, parentPost }: Props) {
  const payload = post.payload as Post | Reply;

  return (
    <article className="rounded-lg border border-slate-700 bg-slate-900 p-4 space-y-2">
      {parentPost && (
        <div className="rounded border border-slate-800 bg-slate-950 p-2 text-xs text-slate-400">
          <span className="font-mono">
            {(parentPost.payload as Post).authorPubkey.slice(0, 12)}…
          </span>
          <span className="ml-2">{(parentPost.payload as Post).content}</span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-indigo-400">
          {payload.authorPubkey.slice(0, 16)}…
        </span>
        <span className="text-xs text-slate-500">
          {new Date(payload.timestamp).toLocaleString()}
        </span>
      </div>
      <p className="text-sm text-slate-200">{payload.content}</p>
    </article>
  );
}
