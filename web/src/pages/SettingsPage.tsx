import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '../lib/api-client';
import { useAuth } from '../lib/auth-context';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { inputClass } from '../lib/ui';

// Same source of truth as the backend's Timezone value object (Intl's IANA
// database), so the dropdown can never offer a value the server would
// reject. "UTC" isn't always enumerated by Intl.supportedValuesOf — added
// explicitly since it's the platform default (see timezone.vo.ts).
const TIMEZONES = Array.from(new Set(['UTC', ...Intl.supportedValuesOf('timeZone')])).sort();

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
    apiFetch<UserPreferences>(`/users/${user.sub}/preferences`)
      .then((prefs) => {
        setPreferences(prefs);
        setTimezoneInput(prefs.timezone);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load preferences.'));
    apiFetch<Record<string, boolean>>('/feature-flags')
      .then(setFeatureFlags)
      .catch(() => {});
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
    return <p className={error ? 'text-sm text-red-400' : 'text-sm text-slate-500'}>{error ?? 'Loading…'}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold tracking-tight text-white">Settings</h1>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-white">Timezone</h2>
        <div className="flex gap-2">
          <select
            value={timezoneInput}
            onChange={(e) => setTimezoneInput(e.target.value)}
            className={`w-64 ${inputClass}`}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz} className="bg-slate-900">
                {tz}
              </option>
            ))}
          </select>
          <Button onClick={saveTimezone} disabled={status === 'saving'}>
            Save
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-white">Notification channels</h2>
        <div className="flex flex-col gap-3">
          {preferences.notificationPreferences.map((pref) => (
            <label key={pref.channel} className="flex items-center gap-3 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={pref.enabled}
                onChange={(e) => toggleChannel(pref.channel, e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-400"
              />
              {pref.channel}
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-white">Platform feature flags</h2>
        {Object.keys(featureFlags).length === 0 ? (
          <p className="text-sm text-slate-500">No flags set yet.</p>
        ) : (
          <ul className="flex flex-col gap-1.5 text-sm text-slate-300">
            {Object.entries(featureFlags).map(([flag, enabled]) => (
              <li key={flag} className="font-mono text-xs">
                {flag}: <span className={enabled ? 'text-emerald-400' : 'text-slate-500'}>{enabled ? 'on' : 'off'}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
