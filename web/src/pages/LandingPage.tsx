import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';

const features = [
  {
    title: 'AI decides',
    body: 'An LLM reasons over live context against an agent’s rules and returns execute, skip, or blocked — with a rationale, always.',
  },
  {
    title: 'Policy gates',
    body: 'A spend limit and allowed-action list, enforced independently of the AI. It never gets the final word on its own.',
  },
  {
    title: 'KeeperHub executes',
    body: 'A cleared decision becomes a real, signed, on-chain transaction — simulated first, broadcast only if it’ll actually succeed.',
  },
];

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/agents" replace />;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
        <span className="text-sm font-semibold tracking-tight text-white">KeeperHub</span>
        <nav className="flex items-center gap-2">
          <Link
            to="/login"
            className="rounded-md px-4 py-2 text-sm font-medium text-slate-300 hover:text-white"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-950 hover:bg-slate-200"
          >
            Sign up
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col items-center px-6 pt-20 pb-24 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Real transactions, real chain — not a simulation
        </div>

        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Let AI decide.
          <br />
          Never let it be the only thing that can move your funds.
        </h1>

        <p className="mt-6 max-w-xl text-base text-slate-400">
          Autonomous agents that reason over real context and execute real on-chain transactions
          through KeeperHub — gated by spend and action policies the AI itself never controls.
        </p>

        <div className="mt-10 flex items-center gap-3">
          <Link
            to="/register"
            className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-200"
          >
            Get started
          </Link>
          <Link
            to="/login"
            className="rounded-md border border-slate-700 px-6 py-3 text-sm font-semibold text-white hover:border-slate-500"
          >
            Log in
          </Link>
        </div>

        <div className="mt-24 grid w-full gap-6 text-left sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border border-slate-800 bg-slate-900/40 p-5"
            >
              <div className="mb-2 text-sm font-semibold text-white">{feature.title}</div>
              <p className="text-sm leading-relaxed text-slate-400">{feature.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
