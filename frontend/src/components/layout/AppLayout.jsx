import { BookOpen, BrainCircuit, FileText, LayoutDashboard, LogOut, UserCircle2 } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const navigation = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    to: "/documents",
    label: "Documents",
    icon: FileText,
  },
  {
    to: "/flashcards",
    label: "Flashcards",
    icon: BrainCircuit,
  },
  {
    to: "/profile",
    label: "Profile",
    icon: UserCircle2,
  },
];

const linkClassName = ({ isActive }) =>
  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
    isActive
      ? "bg-slate-950 text-white"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
  }`;

const AppLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen overflow-x-clip bg-[radial-gradient(circle_at_top,rgba(255,147,36,0.14),transparent_32%),linear-gradient(180deg,#fffef8_0%,#f8fafc_52%,#eef2ff_100%)] text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-4 px-3 py-3 sm:gap-6 sm:px-4 sm:py-4 lg:flex-row lg:px-6">
        <aside className="w-full shrink-0 rounded-4xl border border-white/70 bg-white/80 p-4 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.35)] backdrop-blur sm:p-5 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-72">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-orange-500">
                Study OS
              </p>
              <h1 className="text-lg font-semibold tracking-tight">AI Learning Assistant</h1>
            </div>
          </div>

          <div className="mt-8 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink key={item.to} to={item.to} className={linkClassName}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </div>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Signed in as
            </p>
            <p className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
              {user?.username || "Learner"}
            </p>
            <p className="mt-1 break-all text-sm text-slate-600">{user?.email}</p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>

          <p className="mt-6 text-xs leading-5 text-slate-500">
            Current route: <span className="font-semibold text-slate-700">{location.pathname}</span>
          </p>
        </aside>

        <main className="min-w-0 flex-1 rounded-4xl border border-white/70 bg-white/60 p-4 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.28)] backdrop-blur sm:p-5 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;