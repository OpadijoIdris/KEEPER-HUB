// Shared Tailwind class strings — not motion components, just consistent
// styling for the plain form elements each page composes differently.

export const inputClass =
  'rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400';

export const labelClass = 'flex flex-col gap-1.5 text-sm text-slate-300';

export const statusTone: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30',
  confirmed: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30',
  execute: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30',
  authorized: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30',
  submitted: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30',
  pending: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30',
  paused: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30',
  draft: 'bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/30',
  skip: 'bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/30',
  failed: 'bg-red-500/10 text-red-400 ring-1 ring-red-500/30',
  rejected: 'bg-red-500/10 text-red-400 ring-1 ring-red-500/30',
  blocked: 'bg-red-500/10 text-red-400 ring-1 ring-red-500/30',
  retired: 'bg-red-500/10 text-red-400 ring-1 ring-red-500/30',
  critical: 'bg-red-500/10 text-red-400 ring-1 ring-red-500/30',
  warning: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30',
  info: 'bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/30',
};

export function toneFor(status: string): string {
  return statusTone[status] ?? statusTone.info;
}
