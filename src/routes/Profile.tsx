import { useEffect, useState, type FormEvent } from 'react';
import { SectionHeader } from '../components/SectionHeader';
import {
  getSyncStatus,
  onSyncStatus,
  sendSignInLink,
  signOut,
  syncNow,
  type SyncStatus,
} from '../data/sync';
import { waitInWords } from './cardText';

function useSyncStatus(): SyncStatus {
  const [status, setStatus] = useState(getSyncStatus);
  useEffect(() => onSyncStatus(setStatus), []);
  return status;
}

const answers = (n: number) => `${n} answer${n === 1 ? '' : 's'}`;

function statusLine(s: SyncStatus): string {
  switch (s.state) {
    case 'syncing':
      return 'Syncing…';
    case 'offline':
      return s.pending > 0
        ? `Offline. ${answers(s.pending)} saved on this device will upload when you are back online.`
        : 'Offline. Your answers save on this device and upload when you are back online.';
    case 'error':
      return `Could not sync: ${s.error ?? 'unknown error'}. It will try again.`;
    default:
      if (s.pending > 0) return `${answers(s.pending)} waiting to upload.`;
      if (s.lastSyncedAt) {
        const ago = Date.now() - Date.parse(s.lastSyncedAt);
        return ago < 60_000
          ? 'All progress saved. Synced just now.'
          : `All progress saved. Synced ${waitInWords(ago)} ago.`;
      }
      return 'All progress saved.';
  }
}

export function Profile() {
  const status = useSyncStatus();

  return (
    <div className="stack">
      <SectionHeader as="h1" size="large" title="Profile" subtitle="Your account and progress" />
      {status.state === 'unavailable' ? (
        <section className="panel">
          <p className="body">
            Accounts are not set up in this build. Progress stays on this device.
          </p>
        </section>
      ) : status.email ? (
        <SignedIn status={status} />
      ) : (
        <SignIn pending={status.pending} />
      )}
    </div>
  );
}

function SignIn({ pending }: { pending: number }) {
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const address = email.trim();
    if (!address) return;
    setBusy(true);
    setError(null);
    try {
      await sendSignInLink(address);
      setSentTo(address);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  if (sentTo) {
    return (
      <section className="panel" aria-labelledby="check-email">
        <h2 id="check-email" className="h2-bold">
          Check your email
        </h2>
        <p className="body" role="status">
          We sent a sign-in link to <strong>{sentTo}</strong>. Open it in this browser to finish
          signing in.
        </p>
        <button type="button" className="btn btn-missed" onClick={() => setSentTo(null)}>
          Use a different email
        </button>
      </section>
    );
  }

  return (
    <section className="panel" aria-labelledby="sign-in">
      <h2 id="sign-in" className="h2-bold">
        Save your progress
      </h2>
      <p className="body">
        Sign in to keep your words and reviews safe and use them on your other devices.
        {pending > 0 ? ` The ${answers(pending)} on this device come with you.` : ''}
      </p>
      <form className="form" onSubmit={(e) => void submit(e)}>
        <label className="field">
          <span className="body-bold">Email</span>
          <input
            className="field-input body"
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        {error ? (
          <p className="form-error body-small" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Sending…' : 'Email me a sign-in link'}
        </button>
      </form>
    </section>
  );
}

function SignedIn({ status }: { status: SyncStatus }) {
  const [unsent, setUnsent] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const leave = async (force: boolean) => {
    setBusy(true);
    try {
      const left = await signOut(force);
      setUnsent(left > 0 ? left : null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel" aria-labelledby="account">
      <h2 id="account" className="h2-bold">
        Signed in
      </h2>
      <p className="body">{status.email}</p>
      <p className="body" role="status" aria-live="polite">
        {statusLine(status)}
      </p>
      <button
        type="button"
        className="btn btn-missed"
        disabled={status.state === 'syncing'}
        onClick={() => void syncNow()}
      >
        Sync now
      </button>
      {unsent ? (
        <div className="form" role="alert">
          <p className="body">
            {answers(unsent)} could not be uploaded yet. Signing out now removes them from this
            device for good.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            onClick={() => setUnsent(null)}
          >
            Stay signed in
          </button>
          <button
            type="button"
            className="btn btn-missed"
            disabled={busy}
            onClick={() => void leave(true)}
          >
            Sign out anyway
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="btn btn-missed"
          disabled={busy}
          onClick={() => void leave(false)}
        >
          Sign out
        </button>
      )}
    </section>
  );
}
