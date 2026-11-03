// The way in while the app is invite only: sign in, or join with an invitation. Nothing else
// opens until the signed-in account is a member.

import { useEffect, useState, type ReactNode } from 'react';
import {
  checkAccess,
  forgetAccess,
  INVITE_ONLY,
  inviteFromUrl,
  type Access,
} from '../data/invites';
import { supabase } from '../data/supabase';
import { EmailSignIn } from './EmailSignIn';

export function AccessGate({ children }: { children: ReactNode }) {
  // A build without accounts has nothing to check, so it opens.
  const [access, setAccess] = useState<Access | null>(
    INVITE_ONLY && supabase ? null : { state: 'member' },
  );

  useEffect(() => {
    if (!INVITE_ONLY || !supabase) return;
    let alive = true;
    const check = () =>
      void checkAccess().then((a) => {
        if (alive) setAccess(a);
      });
    check();
    const { data } = supabase.auth.onAuthStateChange(() => check());
    window.addEventListener('online', check);
    return () => {
      alive = false;
      data.subscription.unsubscribe();
      window.removeEventListener('online', check);
    };
  }, []);

  if (!access) return null;
  if (access.state === 'member') return <>{children}</>;
  return (
    <main className="screen screen-welcome">
      <header className="welcome-head">
        <h1 className="h1-bold">Kinyarwanda</h1>
        <p className="body">Learn the words, hear them and use them.</p>
      </header>
      {access.state === 'signed-out' ? (
        <WayIn />
      ) : access.state === 'offline' ? (
        <section className="panel" role="status">
          <h2 className="h2-bold">Almost there</h2>
          <p className="body">
            Connect to the internet once so we can check your invitation. After that the app works
            offline.
          </p>
        </section>
      ) : (
        <section className="panel" role="alert">
          <h2 className="h2-bold">You need an invitation</h2>
          <p className="body">
            {access.email ?? 'This account'} isn&rsquo;t on the invitation list yet. Ask someone who
            uses the app to invite you, then sign in again.
          </p>
          <button
            type="button"
            className="btn btn-missed"
            onClick={() => {
              forgetAccess();
              void supabase?.auth.signOut();
            }}
          >
            Sign out
          </button>
        </section>
      )}
    </main>
  );
}

function WayIn() {
  const fromLink = inviteFromUrl();
  const [joining, setJoining] = useState(fromLink !== '');
  return (
    <>
      <p className="body welcome-note">
        The app is invite only while we test it.{' '}
        {joining ? 'Enter your invite code and email.' : 'Sign in with your email.'}
      </p>
      {joining ? (
        <EmailSignIn
          key="join"
          title="Join with an invitation"
          intro="We'll email you a link and a code to sign in. Use the email the invitation was sent to."
          inviteCode={fromLink}
          submitLabel="Join"
        />
      ) : (
        <EmailSignIn
          key="sign-in"
          title="Sign in"
          intro="We'll email you a link and a code. No password needed."
        />
      )}
      <button type="button" className="btn btn-missed" onClick={() => setJoining((j) => !j)}>
        {joining ? 'I already have an account' : 'I have an invitation'}
      </button>
    </>
  );
}
