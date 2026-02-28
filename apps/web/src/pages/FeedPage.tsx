import { useState } from "react";
import { useIdentity } from "../state/IdentityContext";
import { usePosts } from "../state/PostsContext";
import { canonicalize, objectId, sign } from "@p2p/core";
import type { Post, SignedObject } from "@p2p/core";
import PostCard from "../components/PostCard";

export default function FeedPage() {
  const { identity } = useIdentity();
  const { posts, addPost } = usePosts();
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  async function handlePost() {
    if (!identity || !content.trim() || posting) return;
    setPosting(true);
    try {
      const payload: Post = {
        type: "post",
        authorPubkey: identity.publicKey,
        content: content.trim(),
        timestamp: Date.now(),
      };
      const id = await objectId(payload);
      const signable = canonicalize(payload);
      const signature = await sign(signable, identity.secretKey);
      const signed: SignedObject = { objectId: id, payload, signature };
      await addPost(signed);
      setContent("");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none resize-none"
          placeholder="What's on your mind?"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handlePost();
          }}
        />
        <div className="mt-2 flex justify-end">
          <button
            onClick={handlePost}
            disabled={!content.trim() || posting}
            className="rounded bg-indigo-600 px-4 py-1.5 text-sm hover:bg-indigo-500 disabled:opacity-40"
          >
            Post
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {posts.map((p) => (
          <PostCard key={p.objectId} post={p} />
        ))}
      </div>
    </div>
  );
}
