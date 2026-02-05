import { NavLink } from "react-router-dom";

const links = [
  { to: "/feed", label: "Feed" },
  { to: "/connect", label: "Connect" },
  { to: "/identity", label: "Identity" },
  { to: "/diagnostics", label: "Diagnostics" },
];

export default function NavBar() {
  return (
    <header className="border-b border-slate-800 bg-slate-900">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold text-slate-300">P2P Microblog</span>
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
