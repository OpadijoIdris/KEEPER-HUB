import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '../lib/api-client';
import { useAuth } from '../lib/auth-context';

interface NotificationPreference {
  channel: 'email' | 'webhook' | 'in_app';
  enabled: boolean;
}

interface UserPreferences {
  userId: string;
  timezone: string;
  notificationPreferences: NotificationPreference[];
}

export function SettingsPage() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({});
  const [timezoneInput, setTimezoneInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    apiFetch<UserPreferences>(`/users/${user.sub}/preferences`).then((prefs) => {
      setPreferences(prefs);
      setTimezoneInput(prefs.timezone);
    });
    apiFetch<Record<string, boolean>>('/feature-flags').then(setFeatureFlags);
  }, [user]);

  async function saveTimezone() {
    if (!user) return;
    setStatus('saving');
    setError(null);
    try {
      const updated = await apiFetch<UserPreferences>(`/users/${user.sub}/preferences`, {
        method: 'PATCH',
        body: { timezone: timezoneInput },
      });
      setPreferences(updated);
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setError(err instanceof ApiError ? err.message : 'Failed to save.');
    }
  }

  async function toggleChannel(channel: NotificationPreference['channel'], enabled: boolean) {
    if (!user || !preferences) return;

    // Optimistic update: without this, the checkbox is fully server-driven
    // and setStatus('saving') below forces a re-render before the PATCH
    // resolves, snapping a controlled checkbox back to its pre-click value
    // for the duration of the request — visible as a "flicker back" on any
    // slower connection, and exactly what caught this in browser testing.
    const previous = preferences;
    setPreferences({
      ...preferences,
      notificationPreferences: preferences.notificationPreferences.map((pref) =>
        pref.channel === channel ? { ...pref, enabled } : pref,
      ),
    });
    setStatus('saving');
    setError(null);
    try {
      const updated = await apiFetch<UserPreferences>(`/users/${user.sub}/preferences`, {
        method: 'PATCH',
        body: { notificationChannel: { channel, enabled } },
      });
      setPreferences(updated);
      setStatus('idle');
    } catch (err) {
      setPreferences(previous);
      setStatus('error');
      setError(err instanceof ApiError ? err.message : 'Failed to save.');
    }
  }

  if (!preferences) {
    return <p className="text-slate-500">Loading…</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Timezone</h2>
        <div className="flex gap-2">
          <input
            value={timezoneInput}
            onChange={(e) => setTimezoneInput(e.target.value)}
            placeholder="e.g. Europe/London"
            className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            onClick={saveTimezone}
            disabled={status === 'saving'}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Notification channels</h2>
        <div className="flex flex-col gap-2">
          {preferences.notificationPreferences.map((pref) => (
            <label key={pref.channel} className="flex items-center gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={pref.enabled}
                onChange={(e) => toggleChannel(pref.channel, e.target.checked)}
                className="h-4 w-4"
              />
              {pref.channel}
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Platform feature flags</h2>
        {Object.keys(featureFlags).length === 0 ? (
          <p className="text-sm text-slate-500">No flags set yet.</p>
        ) : (
          <ul className="text-sm text-slate-700">
            {Object.entries(featureFlags).map(([flag, enabled]) => (
              <li key={flag}>
                {flag}: {enabled ? 'on' : 'off'}
              </li>
            ))}
          </ul>
        )}
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
