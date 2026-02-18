import { NavLink } from "react-router-dom";
import { usePeers } from "../state/PeersContext";

const links = [
  { to: "/feed", label: "Feed" },
  { to: "/connect", label: "Connect" },
  { to: "/identity", label: "Identity" },
  { to: "/diagnostics", label: "Diagnostics" },
];

export default function NavBar() {
  const { peers } = usePeers();
  const peerCount = peers.size;

  return (
    <header className="border-b border-slate-800 bg-slate-900">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-300">P2P Microblog</span>
          {peerCount > 0 && (
            <span className="rounded-full bg-green-700 px-2 py-0.5 text-xs text-green-100">
              {peerCount} peer{peerCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <nav className="flex gap-4">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                "text-sm transition-colors " +
                (isActive ? "text-white font-medium" : "text-slate-400 hover:text-slate-200")
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
