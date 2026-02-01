import { createContext, useContext, type ReactNode } from "react";

const PostsContext = createContext<null>(null);

export function PostsProvider({ children }: { children: ReactNode }) {
  return <PostsContext.Provider value={null}>{children}</PostsContext.Provider>;
}

export function usePosts() {
  return useContext(PostsContext);
}
