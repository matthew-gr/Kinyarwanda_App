// My words (decision 185): the learner's own list. Each word is a Kinyarwanda root and its English,
// with tags of the learner's choosing. Added words are learned in the My words deck, then move to
// Review. Words can be changed or removed at any time; removing one takes it out of Review too.

import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { AppBar } from '../components/AppBar';
import { cx } from '../components/cx';
import type { MyWordRow } from '../data/db';
import {
  addMyWord,
  EN_MAX,
  listMyWords,
  myWordStatuses,
  parseTags,
  removeMyWord,
  RW_MAX,
  tagsInUse,
  updateMyWord,
  type MyWordStatus,
} from '../data/myWords';
import { useProgressVersion } from './useProgressVersion';

const statusText = (s: MyWordStatus | undefined) =>
  !s || s.type === 'new'
    ? 'New: next in My words'
    : s.type === 'learning'
      ? `Learning · ${s.streak} of 3 in a row`
      : `In Review · stage ${s.stage}`;

export function MyWords() {
  const navigate = useNavigate();
  const version = useProgressVersion();
  const [words, setWords] = useState<MyWordRow[] | null>(null);
  const [statuses, setStatuses] = useState<Map<string, MyWordStatus>>(new Map());
  const [tag, setTag] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  const reload = async () => {
    const [w, s] = await Promise.all([listMyWords(), myWordStatuses()]);
    setWords(w);
    setStatuses(s);
  };

  useEffect(() => {
    let alive = true;
    void Promise.all([listMyWords(), myWordStatuses()]).then(([w, s]) => {
      if (!alive) return;
      setWords(w);
      setStatuses(s);
    });
    return () => {
      alive = false;
    };
  }, [version]);

  const tags = words ? tagsInUse(words) : [];
  const shown = (words ?? []).filter((w) => !tag || w.tags.includes(tag));
  const waiting = (words ?? []).filter((w) => statuses.get(w.id)?.type !== 'review').length;

  return (
    <main className="screen screen-mywords">
      <AppBar title="My words" onBack={() => navigate('/')} backLabel="Back to Home" />
      <div className="stack">
        <section className="panel" aria-labelledby="add-word">
          <h2 id="add-word" className="h3-bold">
            Add a word
          </h2>
          <p className="body-small">
            The Kinyarwanda root and what it means. It goes to Learn, then to Review once you know
            it.
          </p>
          <WordForm
            submitLabel="Add to my words"
            onSubmit={async (input) => {
              const row = await addMyWord(input);
              setNotice(`Added ${row.rw}. It’s next in My words.`);
              await reload();
            }}
          />
          <p className="body-small" role="status">
            {notice || ' '}
          </p>
        </section>

        {words && words.length > 0 ? (
          <button type="button" className="btn btn-primary" onClick={() => navigate('/learn/mine')}>
            {waiting > 0 ? `Learn my words (${waiting} to learn)` : 'Learn my words'}
          </button>
        ) : null}

        {tags.length > 0 ? (
          <div className="mywords-tags" role="group" aria-label="Show words tagged">
            <button
              type="button"
              className={cx('mywords-tag', tag === null && 'mywords-tag-on')}
              aria-pressed={tag === null}
              onClick={() => setTag(null)}
            >
              All
            </button>
            {tags.map((t) => (
              <button
                key={t}
                type="button"
                className={cx('mywords-tag', tag === t && 'mywords-tag-on')}
                aria-pressed={tag === t}
                onClick={() => setTag(tag === t ? null : t)}
              >
                {t}
              </button>
            ))}
          </div>
        ) : null}

        {words === null ? null : words.length === 0 ? (
          <p className="body">
            No words yet. Add them here, or hold a word in a story to add it from there.
          </p>
        ) : (
          <>
            <p className="body-small">
              {tag
                ? `${shown.length} tagged ${tag}, of ${words.length} words`
                : `${words.length} ${words.length === 1 ? 'word' : 'words'}`}
            </p>
            <ul className="mywords-list" aria-label="Your words">
              {shown.map((w) =>
                editing === w.id ? (
                  <li key={w.id} className="panel mywords-item">
                    <WordForm
                      initial={w}
                      submitLabel="Save"
                      onCancel={() => setEditing(null)}
                      onSubmit={async (input) => {
                        await updateMyWord(w.id, input);
                        setEditing(null);
                        await reload();
                      }}
                    />
                  </li>
                ) : (
                  <WordRow
                    key={w.id}
                    word={w}
                    status={statuses.get(w.id)}
                    onEdit={() => setEditing(w.id)}
                    onRemove={async () => {
                      await removeMyWord(w.id);
                      setNotice(`Removed ${w.rw}.`);
                      await reload();
                    }}
                  />
                ),
              )}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}

function WordRow({
  word,
  status,
  onEdit,
  onRemove,
}: {
  word: MyWordRow;
  status: MyWordStatus | undefined;
  onEdit: () => void;
  onRemove: () => Promise<void>;
}) {
  const [confirm, setConfirm] = useState(false);
  return (
    <li className="panel mywords-item">
      <p className="mywords-rw body-bold" lang="rw">
        {word.rw}
      </p>
      <p className="body">{word.en}</p>
      {word.tags.length > 0 ? (
        <p className="mywords-item-tags body-small">
          {word.tags.map((t) => (
            <span key={t} className="mywords-chip">
              {t}
            </span>
          ))}
        </p>
      ) : null}
      <p className="body-small mywords-status">{statusText(status)}</p>
      {confirm ? (
        <div className="admin-actions" role="group" aria-label={`Remove ${word.rw}?`}>
          <p className="body-small">Remove it from your list, Learn and Review?</p>
          <button type="button" className="btn btn-missed" onClick={() => setConfirm(false)}>
            Keep it
          </button>
          <button type="button" className="btn btn-primary" onClick={() => void onRemove()}>
            Remove
          </button>
        </div>
      ) : (
        <div className="admin-actions">
          <button
            type="button"
            className="btn btn-missed"
            onClick={onEdit}
            aria-label={`Edit ${word.rw}`}
          >
            Edit
          </button>
          <button
            type="button"
            className="btn btn-missed"
            onClick={() => setConfirm(true)}
            aria-label={`Remove ${word.rw}`}
          >
            Remove
          </button>
        </div>
      )}
    </li>
  );
}

export function WordForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: { rw: string; en: string; tags: readonly string[] };
  submitLabel: string;
  onSubmit: (input: { rw: string; en: string; tags: string[] }) => Promise<void>;
  onCancel?: () => void;
}) {
  const [rw, setRw] = useState(initial?.rw ?? '');
  const [en, setEn] = useState(initial?.en ?? '');
  const [tags, setTags] = useState(initial?.tags.join(', ') ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSubmit({ rw, en, tags: parseTags(tags) });
      if (!initial) {
        setRw('');
        setEn('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="form" onSubmit={(e) => void submit(e)}>
      <label className="field">
        <span className="body-small-bold">Kinyarwanda</span>
        <input
          className="field-input"
          lang="rw"
          autoCapitalize="none"
          autoComplete="off"
          maxLength={RW_MAX}
          value={rw}
          onChange={(e) => setRw(e.target.value)}
          placeholder="For example: isoko"
        />
      </label>
      <label className="field">
        <span className="body-small-bold">English</span>
        <input
          className="field-input"
          autoComplete="off"
          maxLength={EN_MAX}
          value={en}
          onChange={(e) => setEn(e.target.value)}
          placeholder="For example: market"
        />
      </label>
      <label className="field">
        <span className="body-small-bold">Tags (optional, separated by commas)</span>
        <input
          className="field-input"
          autoCapitalize="none"
          autoComplete="off"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="For example: food, market"
        />
      </label>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="admin-actions">
        {onCancel ? (
          <button type="button" className="btn btn-missed" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
