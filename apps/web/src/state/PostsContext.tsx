import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { listObjects, putObject } from "@p2p/core";
import type { SignedObject } from "@p2p/core";

interface PostsContextValue {
  posts: SignedObject[];
  addPost: (post: SignedObject) => Promise<void>;
  refresh: () => Promise<void>;
}

const PostsContext = createContext<PostsContextValue | null>(null);

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<SignedObject[]>([]);

  async function refresh() {
    const all = await listObjects();
    setPosts(all);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function addPost(post: SignedObject) {
    await putObject(post);
    await refresh();
  }

  return (
    <PostsContext.Provider value={{ posts, addPost, refresh }}>
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  const ctx = useContext(PostsContext);
  if (!ctx) throw new Error("usePosts must be used within PostsProvider");
  return ctx;
}
