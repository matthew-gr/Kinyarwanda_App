import { useEffect, useState, type FormEvent } from 'react';
import { INVITES_PER_MEMBER } from '../../supabase/functions/_shared/invite';
import { Link } from 'react-router';
import { AchievementCard } from '../components/AchievementCard';
import { SectionHeader } from '../components/SectionHeader';
import { StatRow } from '../components/StatRow';
import { loadProgressStats, type ProgressStats } from '../data/progressStats';
import { setDailyGoal } from '../data/repo';
import {
  getSyncStatus,
  onSyncStatus,
  signOut,
  requestSync,
  syncNow,
  type SyncStatus,
} from '../data/sync';
import { createInvite, listInvites, type InviteRow, type NewInvite } from '../data/invites';
import { useAdmin } from './admin/useAdmin';
import { EmailSignIn } from './EmailSignIn';
import { PhonePanel } from './PhonePanel';
import { waitInWords } from './cardText';
import { useProgressVersion } from './useProgressVersion';

const GOALS = [5, 10, 15, 20, 30];
const TONES = ['orange', 'green', 'blue'] as const;
const EARNED = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const days = (n: number) => `${n} day${n === 1 ? '' : 's'}`;

function Progress() {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [reload, setReload] = useState(0);
  const version = useProgressVersion();

  useEffect(() => {
    let alive = true;
    void loadProgressStats(Date.now()).then((s) => {
      if (alive) setStats(s);
    });
    return () => {
      alive = false;
    };
  }, [version, reload]);

  if (!stats) return null;

  const changeGoal = async (goal: number) => {
    await setDailyGoal(goal);
    requestSync();
    setReload((r) => r + 1);
  };

  return (
    <>
      <StatRow
        label="Day streak"
        value={
          stats.streak.practicedToday || stats.streak.current === 0
            ? days(stats.streak.current)
            : `${days(stats.streak.current)}, practise today to keep it`
        }
        icon="fire"
        strong
      />
      <StatRow label="Words learned" value={stats.wordsLearned} strong />
      <StatRow label="Phrases learned" value={stats.phrasesLearned} strong />
      <StatRow label="Best streak" value={days(stats.streak.best)} strong />
      <StatRow label="Level" value={`Verb level ${stats.verbLevel}`} badge />

      <section className="badge-row" aria-label="Badges">
        <SectionHeader title="Badges" subtitle="For words learned" />
        <div className="kn-carousel" role="list">
          {stats.badges.map((b, i) => (
            <div key={b.words} role="listitem">
              <AchievementCard
                value={b.words.toLocaleString()}
                title={`${b.words.toLocaleString()} words`}
                lines={
                  b.earnedAt === null
                    ? [`${(b.words - stats.wordsLearned).toLocaleString()} to go`, 'Not earned yet']
                    : ['Earned', EARNED.format(new Date(b.earnedAt))]
                }
                icon={b.earnedAt === null ? undefined : 'confetti'}
                tone={TONES[i % TONES.length]}
                muted={b.earnedAt === null}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="panel" aria-labelledby="settings-title">
        <h2 id="settings-title" className="h2-bold">
          Settings
        </h2>
        <label className="field">
          <span className="body-bold">Daily goal: new items to learn each day</span>
          <select
            className="field-input field-select body"
            value={stats.dailyGoal}
            onChange={(e) => void changeGoal(Number(e.target.value))}
          >
            {(GOALS.includes(stats.dailyGoal)
              ? GOALS
              : [...GOALS, stats.dailyGoal].sort((a, b) => a - b)
            ).map((g) => (
              <option key={g} value={g}>
                {g} a day
              </option>
            ))}
          </select>
        </label>
        <p className="body-small">
          The goal is shown on Home. It never stops you learning more or reviewing.
        </p>
      </section>
    </>
  );
}

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
      <SectionHeader as="h1" size="large" title="Profile" subtitle="Your progress and account" />
      <Progress />
      <PhonePanel signedIn={!!status.email} />
      {status.state === 'unavailable' ? (
        <section className="panel">
          <p className="body">
            Accounts are not set up in this build. Progress stays on this device.
          </p>
        </section>
      ) : status.email ? (
        <SignedIn status={status} />
      ) : (
        <EmailSignIn
          title="Save your progress"
          intro={`Sign in to keep your words and reviews safe and use them on your other devices.${
            status.pending > 0
              ? ` The ${answers(status.pending)} on this device come with you.`
              : ''
          }`}
        />
      )}
      {status.email ? <Invites email={status.email} /> : null}
      <AdminLink email={status.email} />
    </div>
  );
}

/** Shown only to admins. */
function AdminLink({ email }: { email: string | null }) {
  const admin = useAdmin(email);
  if (!email || !admin) return null;
  return (
    <section className="panel" aria-labelledby="admin-title">
      <h2 id="admin-title" className="h2-bold">
        Admin
      </h2>
      <p className="body">Edit the course, make audio and read mistake reports.</p>
      <Link to="/admin" className="btn btn-missed">
        Open admin
      </Link>
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

/** Inviting others while the app is invite only: 2 each, any number for admins. */
function Invites({ email }: { email: string }) {
  const admin = useAdmin(email);
  const [invites, setInvites] = useState<InviteRow[] | null>(null);
  const [to, setTo] = useState('');
  const [made, setMade] = useState<NewInvite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    listInvites().then(
      (list) => alive && setInvites(list),
      () => alive && setInvites([]),
    );
    return () => {
      alive = false;
    };
  }, [made]);

  const left = admin ? null : Math.max(0, INVITES_PER_MEMBER - (invites?.length ?? 0));

  const invite = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setMade(await createInvite(to));
      setTo('');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  if (invites === null) return null;
  return (
    <section className="panel" aria-labelledby="invite-title">
      <h2 id="invite-title" className="h2-bold">
        Invite friends
      </h2>
      <p className="body">
        The app is invite only while we test it.{' '}
        {left === null
          ? 'As an admin you can invite as many people as you like.'
          : left > 0
            ? `You can invite ${left} more ${left === 1 ? 'person' : 'people'}.`
            : `You've used your ${INVITES_PER_MEMBER} invitations.`}
      </p>
      {made ? (
        <div className="stack" role="status">
          <p className="body">
            {made.emailed ? 'Invitation sent. ' : ''}Their invite code is{' '}
            <strong>{made.code}</strong>, or they can open this link:
          </p>
          <p className="body-small invite-link">{made.link}</p>
          <button
            type="button"
            className="btn btn-missed"
            onClick={() => void navigator.clipboard?.writeText(made.link)}
          >
            Copy link
          </button>
        </div>
      ) : null}
      {left === null || left > 0 ? (
        <form className="form" onSubmit={(e) => void invite(e)}>
          <label className="field">
            <span className="body-bold">Their email (optional)</span>
            <input
              className="field-input body"
              type="email"
              name="invite-email"
              autoComplete="off"
              inputMode="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <p className="body-small">
            With an email, we send the invitation and only that address can use it. Without one, you
            get a code to share yourself.
          </p>
          {error ? (
            <p className="form-error body-small" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Making invitation…' : to.trim() ? 'Send invitation' : 'Make an invite code'}
          </button>
        </form>
      ) : null}
      {invites.length > 0 ? (
        <ul className="invite-list body-small">
          {invites.map((i) => (
            <li key={i.code}>
              <strong>{i.code}</strong>
              {i.email ? ` · ${i.email}` : ''} ·{' '}
              {i.used_at ? 'Joined' : Date.parse(i.expires_at) < Date.now() ? 'Ran out' : 'Waiting'}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
