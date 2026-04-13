import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { IdentityProvider } from "./state/IdentityContext";
import { PostsProvider } from "./state/PostsContext";
import { PeersProvider } from "./state/PeersContext";
import NavBar from "./components/NavBar";
import PeerNetwork from "./components/PeerNetwork";
import FeedPage from "./pages/FeedPage";
import ConnectPage from "./pages/ConnectPage";
import IdentityPage from "./pages/IdentityPage";
import DiagnosticsPage from "./pages/DiagnosticsPage";

export default function App() {
  return (
    <IdentityProvider>
      <PostsProvider>
        <PeersProvider>
          <BrowserRouter>
            <PeerNetwork />
            <div className="min-h-screen bg-slate-950 text-slate-100">
              <NavBar />
              <main className="mx-auto max-w-3xl px-4 py-8">
                <Routes>
                  <Route path="/" element={<Navigate to="/feed" replace />} />
                  <Route path="/feed" element={<FeedPage />} />
                  <Route path="/connect" element={<ConnectPage />} />
                  <Route path="/identity" element={<IdentityPage />} />
                  <Route path="/diagnostics" element={<DiagnosticsPage />} />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
        </PeersProvider>
      </PostsProvider>
    </IdentityProvider>
  );
}
