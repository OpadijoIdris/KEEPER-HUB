import { Fragment, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api-client';

interface AuditEntry {
  id: string;
  correlationId: string;
  occurredAt: string;
  eventType: string;
  subject: { type: string; id: string };
  actor: { type: string; id: string };
  severity: string;
  payload: Record<string, unknown>;
}

interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

const PAGE_SIZE = 20;

const severityClass: Record<string, string> = {
  info: 'text-slate-500',
  warning: 'text-amber-600',
  critical: 'text-red-600',
};

export function AuditLogPage() {
  const [result, setResult] = useState<PaginatedResult<AuditEntry> | null>(null);
  const [eventType, setEventType] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (eventType) params.set('eventType', eventType);
    if (subjectId) params.set('subjectId', subjectId);

    apiFetch<PaginatedResult<AuditEntry>>(`/audit-log?${params.toString()}`).then(setResult);
  }, [eventType, subjectId, page]);

  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-slate-900">Audit log</h1>

      <div className="flex gap-2">
        <input
          value={eventType}
          onChange={(e) => {
            setPage(1);
            setEventType(e.target.value);
          }}
          placeholder="Filter by event type"
          className="w-56 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          value={subjectId}
          onChange={(e) => {
            setPage(1);
            setSubjectId(e.target.value);
          }}
          placeholder="Filter by subject id"
          className="w-72 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {!result ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : result.items.length === 0 ? (
        <p className="text-sm text-slate-500">No matching audit entries.</p>
      ) : (
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4 font-medium">Occurred</th>
              <th className="py-2 pr-4 font-medium">Event type</th>
              <th className="py-2 pr-4 font-medium">Subject</th>
              <th className="py-2 pr-4 font-medium">Actor</th>
              <th className="py-2 pr-4 font-medium">Severity</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((entry) => (
              <Fragment key={entry.id}>
                <tr
                  onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                  className="cursor-pointer border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="py-2 pr-4 text-slate-500">
                    {new Date(entry.occurredAt).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4 font-mono text-xs">{entry.eventType}</td>
                  <td className="py-2 pr-4">
                    {entry.subject.type}:{entry.subject.id.slice(0, 8)}
                  </td>
                  <td className="py-2 pr-4">{entry.actor.type}</td>
                  <td className={`py-2 pr-4 font-medium ${severityClass[entry.severity] ?? ''}`}>
                    {entry.severity}
                  </td>
                </tr>
                {expanded === entry.id && (
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <td colSpan={5} className="px-4 py-3">
                      <pre className="overflow-x-auto text-xs text-slate-600">
                        {JSON.stringify(entry.payload, null, 2)}
                      </pre>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}

      {result && (
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-40"
          >
            Prev
          </button>
          <span>
            Page {result.page} of {totalPages} ({result.total} total)
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
