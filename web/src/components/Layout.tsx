import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-1.5 rounded-md text-sm font-medium ${
    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
  }`;

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-900">KeeperHub</span>
            <nav className="flex gap-1">
              <NavLink to="/settings" className={navLinkClass}>
                Settings
              </NavLink>
              {user?.role === 'admin' && (
                <NavLink to="/audit-log" className={navLinkClass}>
                  Audit log
                </NavLink>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            {user && <span>{user.role}</span>}
            <button
              onClick={logout}
              className="rounded-md px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
