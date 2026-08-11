import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { PageTransition } from './ui/PageTransition';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
  }`;

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold tracking-tight text-white">KeeperHub</span>
            <nav className="flex gap-1">
              <NavLink to="/settings" className={navLinkClass}>
                Settings
              </NavLink>
              <NavLink to="/agents" className={navLinkClass}>
                Agents
              </NavLink>
              <NavLink to="/wallet" className={navLinkClass}>
                Wallet
              </NavLink>
              <NavLink to="/executions" className={navLinkClass}>
                Executions
              </NavLink>
              {user?.role === 'admin' && (
                <NavLink to="/audit-log" className={navLinkClass}>
                  Audit log
                </NavLink>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {user && (
              <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-400">
                {user.role}
              </span>
            )}
            <button
              onClick={logout}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-white"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <PageTransition key={location.pathname}>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  );
}
