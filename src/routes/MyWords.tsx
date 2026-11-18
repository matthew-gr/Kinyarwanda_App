// My words (decision 185): the learner's own list. Each word is a Kinyarwanda root and its English,
// with tags of the learner's choosing, and can carry an emoji, a picture or GIF, and a recording
// (decision 188). Added words are learned in the My words deck, then move to Review. Words can be
// changed or removed at any time; removing one takes it out of Review too. A word the course
// already has is turned away, with a way to learn the course's one next instead (decision 189).

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { AppBar } from '../components/AppBar';
import { cx } from '../components/cx';
import { Icon } from '../components/Icon';
import type { MyWordRow } from '../data/db';
import { mediaUrls, pictureFromFile } from '../data/myWordMedia';
import {
  addMyWord,
  courseMatches,
  EN_MAX,
  InCourseError,
  listMyWords,
  myWordStatuses,
  parseTags,
  removeMyWord,
  RW_MAX,
  tagsInUse,
  updateMyWord,
  type MyWordInput,
  type MyWordStatus,
} from '../data/myWords';
import { addToLearn } from '../data/stories';
import type { Item } from '../engine/types';
import { Recorder } from './Recorder';
import { useProgressVersion } from './useProgressVersion';

const statusText = (s: MyWordStatus | undefined) =>
  !s || s.type === 'new'
    ? 'New: next in My words'
    : s.type === 'learning'
      ? `Learning · ${s.streak} of 3 in a row`
      : `In Review · stage ${s.stage}`;

interface ListData {
  words: MyWordRow[];
  statuses: Map<string, MyWordStatus>;
  urls: Map<string, string>;
  /** Words the course has too: added before the check, or since. */
  inCourse: Map<string, Item>;
}

async function loadList(): Promise<ListData> {
  const [words, statuses] = await Promise.all([listMyWords(), myWordStatuses()]);
  const [urls, inCourse] = await Promise.all([
    mediaUrls(words.flatMap((w) => [w.picture_path, w.audio_path])),
    courseMatches(words),
  ]);
  return { words, statuses, urls, inCourse };
}

export function MyWords() {
  const navigate = useNavigate();
  const version = useProgressVersion();
  const [data, setData] = useState<ListData | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  const reload = async () => setData(await loadList());

  useEffect(() => {
    let alive = true;
    void loadList().then((d) => {
      if (alive) setData(d);
    });
    return () => {
      alive = false;
    };
  }, [version]);

  const words = data?.words ?? null;
  const tags = words ? tagsInUse(words) : [];
  const shown = (words ?? []).filter((w) => !tag || w.tags.includes(tag));
  const waiting = (words ?? []).filter((w) => data?.statuses.get(w.id)?.type !== 'review').length;

  const learnCourseWord = async (item: Item) => {
    const added = await addToLearn(item.id);
    setNotice(
      added
        ? `${item.base} is next in Learn, from the course.`
        : `${item.base} is already in Learn or Review.`,
    );
  };

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
            onLearnCourseWord={learnCourseWord}
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

        {words === null || !data ? null : words.length === 0 ? (
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
                      initial={{
                        rw: w.rw,
                        en: w.en,
                        tags: w.tags,
                        emoji: w.emoji ?? '',
                        pictureUrl: (w.picture_path && data.urls.get(w.picture_path)) || null,
                        audioUrl: (w.audio_path && data.urls.get(w.audio_path)) || null,
                      }}
                      submitLabel="Save"
                      onCancel={() => setEditing(null)}
                      onLearnCourseWord={learnCourseWord}
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
                    status={data.statuses.get(w.id)}
                    pictureUrl={(w.picture_path && data.urls.get(w.picture_path)) || null}
                    audioUrl={(w.audio_path && data.urls.get(w.audio_path)) || null}
                    inCourse={data.inCourse.get(w.id) ?? null}
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
  pictureUrl,
  audioUrl,
  inCourse,
  onEdit,
  onRemove,
}: {
  word: MyWordRow;
  status: MyWordStatus | undefined;
  pictureUrl: string | null;
  audioUrl: string | null;
  inCourse: Item | null;
  onEdit: () => void;
  onRemove: () => Promise<void>;
}) {
  const [confirm, setConfirm] = useState(false);
  return (
    <li className="panel mywords-item">
      <div className="mywords-head">
        {pictureUrl ? (
          <img className="mywords-thumb" src={pictureUrl} alt="" />
        ) : word.emoji ? (
          <span className="mywords-thumb mywords-thumb-emoji" aria-hidden="true">
            {word.emoji}
          </span>
        ) : null}
        <div className="mywords-words">
          <p className="mywords-rw body-bold" lang="rw">
            {word.rw}
          </p>
          <p className="body">{word.en}</p>
        </div>
        {audioUrl ? (
          <button
            type="button"
            className="kn-reset-btn mywords-play"
            aria-label={`Play ${word.rw}`}
            onClick={() => void new Audio(audioUrl).play().catch(() => undefined)}
          >
            <Icon name="speaker" size={24} />
          </button>
        ) : null}
      </div>
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
      {inCourse ? (
        <p className="body-small mywords-dup">
          The course has this word too: {inCourse.base} ({inCourse.en}). You can remove this copy.
        </p>
      ) : null}
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

export interface WordFormInitial {
  rw: string;
  en: string;
  tags: readonly string[];
  emoji?: string;
  pictureUrl?: string | null;
  audioUrl?: string | null;
}

export function WordForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  onLearnCourseWord,
}: {
  initial?: WordFormInitial;
  submitLabel: string;
  onSubmit: (input: MyWordInput) => Promise<void>;
  onCancel?: () => void;
  /** Offered when the word is already in the course: learn that one instead. */
  onLearnCourseWord?: (item: Item) => Promise<void>;
}) {
  const [rw, setRw] = useState(initial?.rw ?? '');
  const [en, setEn] = useState(initial?.en ?? '');
  const [tags, setTags] = useState(initial?.tags.join(', ') ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '');
  /** A new file, null to remove the old one, or undefined to keep it. */
  const [picture, setPicture] = useState<Blob | null | undefined>(undefined);
  const [audio, setAudio] = useState<Blob | null | undefined>(undefined);
  const [previews, setPreviews] = useState<{ picture?: string; audio?: string }>({});
  const [error, setError] = useState('');
  const [inCourse, setInCourse] = useState<Item | null>(null);
  const [busy, setBusy] = useState(false);

  // Previews of new files are let go when the form closes.
  const made = useRef<string[]>([]);
  const preview = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    made.current.push(url);
    return url;
  };
  useEffect(() => {
    const urls = made.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const pictureUrl =
    picture === undefined ? (initial?.pictureUrl ?? null) : picture ? previews.picture : null;
  const audioUrl =
    audio === undefined ? (initial?.audioUrl ?? null) : audio ? previews.audio : null;

  const choosePicture = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    try {
      const blob = await pictureFromFile(file);
      setPicture(blob);
      setPreviews((p) => ({ ...p, picture: preview(blob) }));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const reset = () => {
    setRw('');
    setEn('');
    setEmoji('');
    setPicture(undefined);
    setAudio(undefined);
    setPreviews({});
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setInCourse(null);
    try {
      await onSubmit({
        rw,
        en,
        tags: parseTags(tags),
        emoji: emoji.trim() || null,
        ...(picture !== undefined ? { picture } : {}),
        ...(audio !== undefined ? { audio } : {}),
      });
      if (!initial) reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      if (err instanceof InCourseError) setInCourse(err.item);
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
          placeholder="For example: inkongoro"
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
          placeholder="For example: milk pot"
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

      <fieldset className="mywords-media">
        <legend className="body-small-bold">Picture (optional): an emoji, a photo or a GIF</legend>
        <label className="field">
          <span className="body-small">Emoji, for example 🥛</span>
          <input
            className="field-input mywords-emoji-input"
            autoComplete="off"
            maxLength={16}
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
          />
        </label>
        {pictureUrl ? (
          <img className="mywords-preview" src={pictureUrl} alt="The picture for this word" />
        ) : null}
        <div className="admin-actions">
          <label className="btn btn-missed mywords-file">
            {pictureUrl ? 'Change picture' : 'Add a photo or GIF'}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                void choosePicture(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </label>
          {pictureUrl ? (
            <button type="button" className="btn btn-missed" onClick={() => setPicture(null)}>
              Remove picture
            </button>
          ) : null}
        </div>
      </fieldset>

      <fieldset className="mywords-media">
        <legend className="body-small-bold">Recording (optional)</legend>
        <p className="body-small">
          Ask a native speaker to say the word, up to 10 seconds. It plays on the word’s card.
        </p>
        <Recorder
          url={audioUrl ?? null}
          onChange={(blob) => {
            setAudio(blob);
            setPreviews((p) => ({ ...p, audio: blob ? preview(blob) : undefined }));
          }}
        />
      </fieldset>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      {inCourse && onLearnCourseWord ? (
        <button
          type="button"
          className="btn btn-missed"
          onClick={() => {
            void onLearnCourseWord(inCourse).then(() => {
              setInCourse(null);
              setError('');
              if (!initial) reset();
            });
          }}
        >
          Learn {inCourse.base} next instead
        </button>
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
