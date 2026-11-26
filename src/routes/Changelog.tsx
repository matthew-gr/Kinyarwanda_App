// What's new: each version of the app and what changed in it (src/data/changelog.ts).

import { useNavigate } from 'react-router';
import { AppBar } from '../components/AppBar';
import { CHANGELOG } from '../data/changelog';
import { APP_VERSION } from '../data/feedback';

const day = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export function Changelog() {
  const navigate = useNavigate();
  return (
    <main className="screen screen-changelog">
      <AppBar title="What’s new" onBack={() => navigate('/profile')} backLabel="Back to Profile" />
      <div className="stack">
        <p className="body-small">You have version {APP_VERSION}.</p>
        {CHANGELOG.map((r) => (
          <section className="panel" key={r.version} aria-labelledby={`v-${r.version}`}>
            <h2 id={`v-${r.version}`} className="h2-bold">
              Version {r.version}
            </h2>
            {r.date ? <p className="body-small">{day(r.date)}</p> : null}
            <ul className="changelog-list body">
              {r.changes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
