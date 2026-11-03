import { useEffect, useState } from 'react';
import {
  canPromptInstall,
  isIosSafari,
  offlineAudio,
  onInstallChange,
  promptInstall,
  saveAllAudio,
  type OfflineAudio,
} from '../data/offline';
import {
  disableReminders,
  enableReminders,
  isInstalled,
  loadReminders,
  reminderSupport,
  setReminderHour,
  type ReminderSettings,
} from '../data/reminders';

const HOURS = Array.from({ length: 24 }, (_, h) => h);
const hourLabel = (h: number) =>
  new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).format(new Date(2026, 0, 1, h));

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** Profile's "On this phone": install the app, review reminders, and audio for offline use. */
export function PhonePanel({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="panel" aria-labelledby="phone-title">
      <h2 id="phone-title" className="h2-bold">
        On this phone
      </h2>
      <p className="body">
        Once the app has opened here, it keeps working offline. Your answers upload when
        you&rsquo;re back online.
      </p>
      <Install />
      {signedIn ? <Reminders /> : null}
      <Audio />
    </section>
  );
}

function Install() {
  const [, setVersion] = useState(0);
  useEffect(() => onInstallChange(() => setVersion((v) => v + 1)), []);
  if (isInstalled()) return null;
  if (canPromptInstall()) {
    return (
      <div className="stack">
        <p className="body">Install the app to open it from your home screen and use it offline.</p>
        <button type="button" className="btn btn-primary" onClick={() => void promptInstall()}>
          Install the app
        </button>
      </div>
    );
  }
  if (isIosSafari()) {
    return (
      <p className="body">
        To install the app, tap Share at the bottom of Safari, then{' '}
        <strong>Add to Home Screen</strong>. It then opens like an app, works offline and can send
        reminders.
      </p>
    );
  }
  return null;
}

function Reminders() {
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const support = reminderSupport();

  useEffect(() => {
    let alive = true;
    void loadReminders().then((s) => alive && setSettings(s));
    return () => {
      alive = false;
    };
  }, []);

  if (!settings) return null;

  const run = async (f: () => Promise<void>, next: ReminderSettings) => {
    setBusy(true);
    setError(null);
    try {
      await f();
      setSettings(next);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack">
      <h3 className="h3-bold">Review reminders</h3>
      {support === 'install-first' ? (
        <p className="body">
          On iPhone and iPad, reminders work once the app is on your Home Screen (iOS 16.4 or
          later). Add it, open it from there, and turn them on here.
        </p>
      ) : support === 'unsupported' ? (
        <p className="body">This browser can&rsquo;t show reminders.</p>
      ) : support === 'blocked' ? (
        <p className="body">
          Notifications are blocked for this app. Allow them in your browser or phone settings to
          get reminders.
        </p>
      ) : (
        <>
          <p className="body">
            {settings.enabled
              ? `One reminder a day at ${hourLabel(settings.hour)}, when reviews are waiting.`
              : 'Get one reminder a day, only when reviews are waiting.'}
          </p>
          <label className="field">
            <span className="body-bold">Remind me at</span>
            <select
              className="field-input field-select body"
              value={settings.hour}
              disabled={busy}
              onChange={(e) => {
                const hour = Number(e.target.value);
                if (settings.enabled)
                  void run(() => setReminderHour(hour), { enabled: true, hour });
                else setSettings({ ...settings, hour });
              }}
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {hourLabel(h)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className={settings.enabled ? 'btn btn-missed' : 'btn btn-primary'}
            disabled={busy}
            onClick={() =>
              settings.enabled
                ? void run(disableReminders, { ...settings, enabled: false })
                : void run(() => enableReminders(settings.hour), { ...settings, enabled: true })
            }
          >
            {settings.enabled ? 'Turn reminders off' : 'Turn reminders on'}
          </button>
        </>
      )}
      {error ? (
        <p className="form-error body-small" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Audio() {
  const [state, setState] = useState<OfflineAudio | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    void offlineAudio().then((a) => alive && setState(a));
    return () => {
      alive = false;
    };
  }, []);

  if (!state || state.total === 0) return null;
  const all = state.saved >= state.total;
  return (
    <div className="stack">
      <h3 className="h3-bold">Audio offline</h3>
      <p className="body" role="status">
        {all
          ? `All ${state.total} clips are saved on this phone.`
          : `${state.saved} of ${state.total} clips are saved on this phone. Clips save as you play them; save them all to hear every card offline.`}
      </p>
      {all ? null : (
        <button
          type="button"
          className="btn btn-missed"
          disabled={saving}
          onClick={() => {
            setSaving(true);
            void saveAllAudio((saved, total) => setState({ saved, total })).finally(() =>
              setSaving(false),
            );
          }}
        >
          {saving ? `Saving… ${state.saved} of ${state.total}` : 'Save all audio'}
        </button>
      )}
    </div>
  );
}
