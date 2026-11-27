// Debug mode: every memory hint and word family in one list (decision 216; feedback of 27
// November), to look them over or have them checked.

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { AppBar } from '../components/AppBar';
import { db } from '../data/db';
import { FAMILIES, HINTS } from '../data/hints';
import { useDebugMode } from './useDebugMode';

const LANGS = [
  ['en', 'English'],
  ['sw', 'Swahili'],
  ['de', 'German'],
  ['fr', 'French'],
] as const;

export function HintList() {
  const navigate = useNavigate();
  const debug = useDebugMode();
  const [meaning, setMeaning] = useState<Map<string, string>>(new Map());
  const [query, setQuery] = useState('');

  useEffect(() => {
    let alive = true;
    void db.items.toArray().then((items) => {
      if (alive)
        setMeaning(new Map(items.filter((i) => i.kind === 'word').map((i) => [i.base, i.en])));
    });
    return () => {
      alive = false;
    };
  }, []);

  const q = query.trim().toLowerCase();
  const matches = (...texts: (string | undefined)[]) =>
    !q || texts.some((t) => t?.toLowerCase().includes(q));
  const words = useMemo(
    () => Object.keys(HINTS).sort((a, b) => a.localeCompare(b, 'rw', { sensitivity: 'base' })),
    [],
  );
  const shownWords = words.filter((w) =>
    matches(w, meaning.get(w), ...LANGS.map(([k]) => HINTS[w]![k])),
  );
  const shownFamilies = FAMILIES.filter((f) =>
    matches(...f.words, f.note, ...f.words.map((w) => meaning.get(w))),
  );

  return (
    <main className="screen screen-learn">
      <AppBar
        title="Memory hints"
        onBack={() => navigate('/profile')}
        backLabel="Back to Profile"
      />
      {!debug ? (
        <p className="body">Turn on debug mode in Profile, Settings, to see this list.</p>
      ) : (
        <section className="stack hint-list">
          <p className="body-small">
            AI drafts, not yet checked by a native speaker: {words.length} words with hints and{' '}
            {FAMILIES.length} word families (src/data/hints.ts).
          </p>
          <input
            className="field-input body"
            type="search"
            aria-label="Search hints and families"
            placeholder="Search a word, meaning or hint"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <h2 className="h3-bold">Hints ({shownWords.length})</h2>
          <dl className="hint-list-words">
            {shownWords.map((w) => (
              <div key={w}>
                <dt>
                  <span lang="rw" className="body-bold">
                    {w}
                  </span>
                  <span className="body-small"> {meaning.get(w) ?? '(not in the course)'}</span>
                </dt>
                {LANGS.map(([k, name]) =>
                  HINTS[w]![k] ? (
                    <dd key={k} className="body-small">
                      {name}: {HINTS[w]![k]}
                    </dd>
                  ) : null,
                )}
              </div>
            ))}
          </dl>
          <h2 className="h3-bold">Word families ({shownFamilies.length})</h2>
          <ul className="hint-list-families body-small">
            {shownFamilies.map((f) => (
              <li key={f.words.join(' ')}>
                {f.words.map((w, i) => (
                  <span key={w}>
                    {i > 0 ? ' · ' : ''}
                    <span lang="rw" className="body-small-bold">
                      {w}
                    </span>{' '}
                    ({meaning.get(w) ?? '?'})
                  </span>
                ))}
                {f.note ? <span className="hint-list-note"> — {f.note}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
