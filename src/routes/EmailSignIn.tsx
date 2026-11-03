import { useState, type FormEvent, type ReactNode } from 'react';
import { redeemInvite } from '../data/invites';
import { sendSignInLink, signInWithCode } from '../data/sync';

const message = (err: unknown) => (err instanceof Error ? err.message : String(err));

/**
 * Signing in by email: the email, then the link or the code from the email. With `inviteCode`
 * set (even to ''), it asks for an invite code too and joins with it before the email goes.
 */
export function EmailSignIn({
  title,
  intro,
  inviteCode,
  submitLabel = 'Email me a sign-in link',
}: {
  title: string;
  intro: ReactNode;
  inviteCode?: string;
  submitLabel?: string;
}) {
  const [email, setEmail] = useState('');
  const [invite, setInvite] = useState(inviteCode ?? '');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState('');
  const withInvite = inviteCode !== undefined;

  const submitCode = async (e: FormEvent) => {
    e.preventDefault();
    if (!sentTo || !code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await signInWithCode(sentTo, code.trim());
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const address = email.trim();
    if (!address) return;
    setBusy(true);
    setError(null);
    try {
      if (withInvite) await redeemInvite(invite, address);
      await sendSignInLink(address);
      setSentTo(address);
    } catch (err) {
      setError(message(err));
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
          signing in, or type the code from the email here.
        </p>
        <form className="form" onSubmit={(e) => void submitCode(e)}>
          <label className="field">
            <span className="body-bold">Code from the email</span>
            <input
              className="field-input body"
              name="code"
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="[0-9]*"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </label>
          {error ? (
            <p className="form-error body-small" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in with code'}
          </button>
        </form>
        <button
          type="button"
          className="btn btn-missed"
          onClick={() => {
            setSentTo(null);
            setCode('');
            setError(null);
          }}
        >
          Use a different email
        </button>
      </section>
    );
  }

  const titleId = withInvite ? 'join' : 'sign-in';
  return (
    <section className="panel" aria-labelledby={titleId}>
      <h2 id={titleId} className="h2-bold">
        {title}
      </h2>
      <p className="body">{intro}</p>
      <form className="form" onSubmit={(e) => void submit(e)}>
        {withInvite ? (
          <label className="field">
            <span className="body-bold">Invite code</span>
            <input
              className="field-input body"
              name="invite"
              autoComplete="off"
              autoCapitalize="characters"
              placeholder="ABCD-2345"
              required
              value={invite}
              onChange={(e) => setInvite(e.target.value)}
            />
          </label>
        ) : null}
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
          {busy ? 'Sending…' : submitLabel}
        </button>
      </form>
    </section>
  );
}
