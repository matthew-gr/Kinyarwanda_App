import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { AppBar } from '../components/AppBar';
import { Badge } from '../components/Badge';
import { cx } from '../components/cx';
import { Icon } from '../components/Icon';
import type { StoryRow } from '../data/db';
import { countWhilePlaying } from '../data/activity';
import { applyAudioSpeed, getAudioSpeed } from '../data/audioSpeed';
import { dollars, PINDO_REQUEST_USD } from '../data/costs';
import { getDebugMode } from '../data/debugMode';
import { SpeedButton } from './SpeedButton';
import { addMyWord, findMyWord } from '../data/myWords';
import { STORY_MODELS, storyModelLabel } from '../../supabase/functions/_shared/story';
import {
  addToLearn,
  findInCourse,
  finishReading,
  getStoryModel,
  learnStoryWord,
  loadStories,
  loadStory,
  newStory,
  newStoryCost,
  requestStoryAudio,
  saveFeedback,
  setStoryModel,
  storiesOpen,
  storiesStatus,
  storyNewWords,
  STORY_TAG,
  type StoriesStatus,
  type StoryNewWord,
  type WordInCourse,
} from '../data/stories';
import { dueRepeats, readCounts, tokens, type StoryFeedback } from '../engine/stories';
import { ReportLink } from './CardExtras';
import { WordForm } from './MyWords';
import { waitInWords } from './cardText';
import { playThen } from './drillTime';
import { useProgressVersion } from './useProgressVersion';
import { useAdmin } from './admin/useAdmin';

/** Hold a word this long to add it to Learn without opening its meaning. */
const LONG_PRESS_MS = 550;

function readingLine(s: StoryRow, now: number): string {
  if (s.retired) return 'Finished: read 5 times';
  if (s.reads === 0) return 'New';
  const due = s.next_due_at ? Date.parse(s.next_due_at) : null;
  if (due !== null && due <= now) return 'Ready to read again';
  return `Read ${s.reads} ${s.reads === 1 ? 'time' : 'times'} · back in ${waitInWords((due ?? now) - now)}`;
}

/** The Stories screen: a new story, repeats that are due, and the learner's stories. */
export function Stories() {
  const navigate = useNavigate();
  const version = useProgressVersion();
  const [status, setStatus] = useState<StoriesStatus | null>(null);
  const [stories, setStories] = useState<StoryRow[]>([]);
  const [writing, setWriting] = useState(false);
  const [problem, setProblem] = useState<'signed-out' | string | null>(null);
  const [model, setModel] = useState(getStoryModel);
  const now = Date.now();

  useEffect(() => {
    let alive = true;
    void Promise.all([storiesStatus(), loadStories()]).then(([st, list]) => {
      if (!alive) return;
      setStatus(st);
      setStories(list);
    });
    return () => {
      alive = false;
    };
  }, [version]);

  const write = async () => {
    // Debug mode asks first, with what it would cost (decision 204).
    if (getDebugMode()) {
      const cost = await newStoryCost(model);
      const name = storyModelLabel(`ai:${model}`) ?? model;
      if (
        cost &&
        !window.confirm(
          `Writing a story asks Claude (${name}). Estimated cost: about ${dollars(cost.once)}, or ${dollars(cost.twice)} if it has to write it twice. Write it?`,
        )
      )
        return;
    }
    setWriting(true);
    setProblem(null);
    const out = await newStory(model);
    setWriting(false);
    if (out.type === 'story') navigate(`/stories/${out.story.id}`);
    else setProblem(out.type === 'signed-out' ? 'signed-out' : out.message);
  };

  const due = dueRepeats(stories, now);

  return (
    <main className="screen screen-learn screen-stories">
      <AppBar title="Stories" onBack={() => navigate('/')} backLabel="Back to Home" />
      {!status ? null : !storiesOpen(status) ? (
        <section className="learn-done">
          <h2 className="h2-bold">Stories open at {status.needed} words</h2>
          <p className="body">
            Short stories are written from the words you know, so they wait until you know enough of
            them. {status.wordsLearned} of {status.needed} words learned so far.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/learn/words')}
          >
            Go to Learn
          </button>
        </section>
      ) : (
        <>
          <section className="panel story-new">
            <h2 className="h2-bold">A new story</h2>
            <p className="body">
              Written for you by AI, mostly from words you know. Tap any word for its meaning.
            </p>
            <label className="field">
              <span className="body-bold">Written by (while we compare them)</span>
              <select
                className="field-input field-select body"
                value={model}
                disabled={writing}
                onChange={(e) => {
                  setModel(e.target.value);
                  setStoryModel(e.target.value);
                }}
              >
                {STORY_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="btn btn-primary"
              disabled={writing}
              onClick={() => void write()}
            >
              {writing ? 'Writing your story…' : 'Read a new story'}
            </button>
            <p className="body-small story-note" role="status">
              {writing
                ? 'This takes about half a minute.'
                : problem === 'signed-out'
                  ? 'Sign in on Profile to get stories. They are written on the server and kept with your account.'
                  : (problem ?? ' ')}
            </p>
            {problem === 'signed-out' ? (
              <button type="button" className="btn btn-missed" onClick={() => navigate('/profile')}>
                Go to Profile
              </button>
            ) : null}
          </section>

          {due.length > 0 ? (
            <section aria-labelledby="stories-due">
              <h2 id="stories-due" className="h3-bold story-list-title">
                Ready to read again
              </h2>
              <StoryList stories={due} now={now} />
            </section>
          ) : null}

          {stories.length > 0 ? (
            <section aria-labelledby="stories-all">
              <h2 id="stories-all" className="h3-bold story-list-title">
                Your stories
              </h2>
              <StoryList stories={stories} now={now} />
            </section>
          ) : null}
        </>
      )}
    </main>
  );
}

function StoryList({ stories, now }: { stories: StoryRow[]; now: number }) {
  const navigate = useNavigate();
  return (
    <ul className="story-list">
      {stories.map((s) => (
        <li key={s.id}>
          <button type="button" className="story-row" onClick={() => navigate(`/stories/${s.id}`)}>
            <span className="story-row-title" lang="rw">
              {s.title}
            </span>
            <span className="body-small story-row-meta">
              {s.title_en} · {readingLine(s, now)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Where the line-by-line English choice is kept. */
const ENGLISH_KEY = 'kinyarwanda.story-english';

/**
 * The whole story in one take, which older Pindo stories have instead of a clip per sentence.
 * New stories get a clip per sentence (decision 195); when a story has those, they are used,
 * because a sentence's place in the whole take can only be guessed from its length.
 */
const wholeTake = (s: StoryRow) =>
  s.sentences.some((x) => x.audio_path) ? null : (s.audio_path ?? null);

/** Where sentence `i` starts and ends in the whole take, as shares of it, judged by length. */
function sentenceSpan(s: StoryRow, i: number): [number, number] {
  const total = s.sentences.reduce((n, x) => n + x.rw.length, 0) || 1;
  const before = s.sentences.slice(0, i).reduce((n, x) => n + x.rw.length, 0);
  return [before / total, (before + (s.sentences[i]?.rw.length ?? 0)) / total];
}

/** Which sentence is being read, judged by how far through the take the voice is. */
function sentenceAt(s: StoryRow, fraction: number): number {
  const total = s.sentences.reduce((n, x) => n + x.rw.length, 0);
  let seen = 0;
  for (let i = 0; i < s.sentences.length; i++) {
    seen += s.sentences[i]!.rw.length;
    if (fraction * total < seen) return i;
  }
  return s.sentences.length - 1;
}

/** One story: sentences to read and hear, words to tap, questions, and feedback. */
export function StoryReader() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const admin = useAdmin();
  // In debug mode an admin chooses a free or a paid call to Pindo (decision 211).
  const [pindoChoice, setPindoChoice] = useState<((c: PindoCall | null) => void) | null>(null);
  const askPindo = () =>
    new Promise<PindoCall | null>((resolve) =>
      setPindoChoice(() => (c: PindoCall | null) => {
        setPindoChoice(null);
        resolve(c);
      }),
    );
  const [story, setStory] = useState<StoryRow | null | undefined>(undefined);
  const [english, setEnglish] = useState(false);
  const [playing, setPlaying] = useState<number | null>(null);
  const [word, setWord] = useState<{
    word: string;
    course: WordInCourse | null;
    /** On the learner's own list already. */
    mine: boolean;
  } | null>(null);
  /** The word being added to My words, in the panel's form. */
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState('');
  /** Bumped when a word is added, so the story's new-word list is read again. */
  const [added, setAdded] = useState(0);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let alive = true;
    void loadStory(id).then((s) => {
      if (alive) setStory(s ?? null);
    });
    return () => {
      alive = false;
      stopRef.current?.();
    };
  }, [id]);

  /** Read each line's English after it when playing the story; remembered on this device. */
  const [withEnglish, setWithEnglish] = useState(() => {
    try {
      return localStorage.getItem(ENGLISH_KEY) === '1';
    } catch {
      return false;
    }
  });
  /** The story's audio is being made, after its first Play (decision 197). */
  const [voicing, setVoicing] = useState(false);
  /** Play the story once its audio arrives. */
  const playWhenReady = useRef(false);

  const play = useCallback(
    (from: number, onwards: boolean) => {
      if (!story) return;
      stopRef.current?.();
      const whole = wholeTake(story);
      const last = story.sentences.length - 1;
      const next = (i: number) => {
        if (onwards && i < last) go(i + 1);
        else setPlaying(null);
      };
      // Reading line by line in both languages: each line's English after it (learner
      // feedback, 27 November), in the phone's own English voice, which costs nothing.
      const after = (i: number) => {
        if (onwards && withEnglish) sayEnglish(i, () => next(i));
        else next(i);
      };
      const go = (i: number) => {
        const path = story.sentences[i]?.audio_path;
        if (!path) {
          // No clip of its own (an older Pindo story): play its part of the whole take, or
          // all of it from here when nothing comes between the lines.
          if (whole) playPart(whole, i, onwards && !withEnglish, () => after(i));
          else next(i);
          return;
        }
        setPlaying(i);
        stopRef.current = playThen(path, () => after(i));
      };
      const sayEnglish = (i: number, then: () => void) => {
        const text = story.sentences[i]?.en;
        if (!text || typeof speechSynthesis === 'undefined') return then();
        let cancelled = false;
        const line = new SpeechSynthesisUtterance(text);
        line.lang = 'en-GB';
        line.rate = getAudioSpeed();
        line.onend = () => {
          if (!cancelled) then();
        };
        line.onerror = line.onend;
        stopRef.current = () => {
          cancelled = true;
          speechSynthesis.cancel();
        };
        setPlaying(i);
        speechSynthesis.speak(line);
      };
      /** The whole take from `i`'s share of it, to the end or just that sentence. */
      const playPart = (path: string, i: number, toEnd: boolean, onDone: () => void) => {
        const [startAt, endAt] = sentenceSpan(story, i);
        const audio = new Audio(path);
        countWhilePlaying(audio);
        applyAudioSpeed(audio);
        let stopped = false;
        let finished = false;
        const finish = () => {
          if (finished || stopped) return;
          finished = true;
          onDone();
        };
        stopRef.current = () => {
          stopped = true;
          audio.pause();
        };
        setPlaying(i);
        audio.addEventListener('loadedmetadata', () => {
          if (startAt > 0) audio.currentTime = startAt * audio.duration;
        });
        audio.addEventListener('timeupdate', () => {
          if (!(audio.duration > 0) || finished) return;
          const at = audio.currentTime / audio.duration;
          if (!toEnd && at >= endAt) {
            audio.pause();
            finish();
          } else setPlaying(sentenceAt(story, at));
        });
        audio.addEventListener('ended', () => {
          if (toEnd) setPlaying(null);
          else finish();
        });
        const fail = () => {
          if (!stopped) setPlaying(null);
        };
        audio.addEventListener('error', fail);
        audio.play().catch(fail);
      };
      go(from);
    },
    [story, withEnglish],
  );

  // Audio made on the first Play: start it as soon as the story has it.
  useEffect(() => {
    if (!playWhenReady.current || !story?.audio_path) return;
    playWhenReady.current = false;
    play(0, true);
  }, [story, play]);

  /** Plays the story, first asking for its audio if it has none yet. */
  const playStory = async () => {
    if (!story) return;
    if (story.audio_path || story.sentences.some((s) => s.audio_path)) {
      play(0, true);
      return;
    }
    let free = false;
    if (getDebugMode()) {
      if (admin) {
        const call = await askPindo();
        if (!call) return;
        free = call === 'free';
      } else if (
        !window.confirm(
          `Making this story's audio sends one request to Pindo. Cost: about ${dollars(PINDO_REQUEST_USD)}. Make it?`,
        )
      )
        return;
    }
    setVoicing(true);
    setNotice('');
    const got = await requestStoryAudio(story.id, { free });
    setVoicing(false);
    if ('message' in got) {
      setNotice(got.message);
      return;
    }
    playWhenReady.current = true;
    setStory(got.story);
  };

  const show = async (w: string) => {
    setNotice('');
    setAdding(false);
    const [course, mine] = await Promise.all([findInCourse(w), findMyWord(w)]);
    setWord({ word: w, course, mine: mine !== null });
  };

  const add = async (itemId: string, w: string) => {
    const ok = await addToLearn(itemId);
    setNotice(ok ? `Added ${w} to Learn, as the next new word.` : `${w} is already in Learn.`);
    setAdded((n) => n + 1);
  };

  const meaningOf = (w: string) =>
    story?.glossary.find((g) => g.word.toLowerCase() === w)?.en ?? null;

  /** Holding a word: a course word goes next in Learn; any other onto My words. */
  const hold = async (w: string) => {
    const course = await findInCourse(w);
    if (course?.learned) return setNotice(`You already know ${w}.`);
    if (course) return add(course.item.id, w);
    const en = meaningOf(w);
    if (!en) return show(w);
    const out = await learnStoryWord({ word: w, en, itemId: null });
    setNotice(
      out === 'mine' ? `Added ${w} to My words, to learn next.` : `${w} is already on your list.`,
    );
    setAdded((n) => n + 1);
  };

  if (story === undefined) return null;
  if (story === null) {
    return (
      <main className="screen screen-learn">
        <AppBar title="Stories" onBack={() => navigate('/stories')} backLabel="Back to Stories" />
        <p className="body">This story isn’t on this device.</p>
      </main>
    );
  }

  const meaning = word
    ? (story.glossary.find((g) => g.word.toLowerCase() === word.word)?.en ??
      (word.course ? word.course.form.en : null))
    : null;

  return (
    <main className="screen screen-learn screen-stories">
      {pindoChoice ? <PindoChoice onChoose={pindoChoice} /> : null}
      <AppBar title="Stories" onBack={() => navigate('/stories')} backLabel="Back to Stories" />
      <header className="story-head">
        <h2 className="h2-bold" lang="rw">
          {story.title}
        </h2>
        <p className="body-small story-head-en">{story.title_en}</p>
        <p className="story-tags">
          <Badge>
            {story.status === 'approved' ? '✓ Checked by a native speaker' : 'AI story'}
          </Badge>
          <span className="body-small">About {story.coverage}% words you know</span>
          {storyModelLabel(story.source) ? (
            <span className="body-small">Written by {storyModelLabel(story.source)}</span>
          ) : null}
        </p>
      </header>

      <div className="story-tools">
        <button
          type="button"
          className="btn btn-missed story-tool"
          disabled={voicing}
          onClick={() =>
            playing === null ? void playStory() : (stopRef.current?.(), setPlaying(null))
          }
        >
          {playing !== null ? 'Stop' : voicing ? 'Making audio…' : 'Play the story'}
        </button>
        <button
          type="button"
          className="btn btn-missed story-tool"
          aria-pressed={english}
          onClick={() => setEnglish((e) => !e)}
        >
          {english ? 'Hide English' : 'Show English'}
        </button>
        <SpeedButton className="btn btn-missed story-tool story-tool-speed" short />
      </div>
      <label className="story-english-toggle body-small" htmlFor="story-english">
        <input
          id="story-english"
          type="checkbox"
          checked={withEnglish}
          onChange={(e) => {
            setWithEnglish(e.target.checked);
            try {
              if (e.target.checked) localStorage.setItem(ENGLISH_KEY, '1');
              else localStorage.removeItem(ENGLISH_KEY);
            } catch {
              // Storage can be blocked; the choice holds until the story is closed.
            }
          }}
        />
        Play the story with each line in English after it
      </label>

      <ol className="story-text panel">
        {story.sentences.map((s, i) => (
          <li key={i} className={cx('story-sentence', playing === i && 'story-sentence-playing')}>
            <p className="story-rw" lang="rw">
              {tokens(s.rw).map((t, j) =>
                t.word ? (
                  <WordButton
                    key={j}
                    text={t.text}
                    onTap={() => void show(t.word!)}
                    onHold={() => void hold(t.word!)}
                  />
                ) : (
                  <span key={j}>{t.text}</span>
                ),
              )}
              {s.audio_path || story.audio_path ? (
                <button
                  type="button"
                  className="kn-reset-btn story-replay"
                  onClick={() => play(i, false)}
                  aria-label={`Play sentence ${i + 1}`}
                >
                  <Icon name="speaker" size={20} />
                </button>
              ) : null}
            </p>
            {english ? <p className="body-small story-en">{s.en}</p> : null}
          </li>
        ))}
      </ol>

      <p className="body-small story-notice" role="status">
        {notice || ' '}
      </p>

      {word ? (
        <section className="panel story-word" aria-label={`Meaning of ${word.word}`}>
          <p className="story-word-text" lang="rw">
            {word.word}
          </p>
          <p className="body">{meaning ?? 'No meaning given for this word.'}</p>
          {word.course && !word.course.learned ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void add(word.course!.item.id, word.word)}
            >
              Add to Learn
            </button>
          ) : word.course ? (
            <p className="body-small">You’ve learned this word.</p>
          ) : word.mine ? (
            <p className="body-small">It’s on your list in My words.</p>
          ) : adding ? (
            <WordForm
              initial={{ rw: word.word, en: meaning ?? '', tags: [STORY_TAG] }}
              submitLabel="Add to my words"
              onCancel={() => setAdding(false)}
              onLearnCourseWord={async (item) => {
                await add(item.id, item.base);
                setAdding(false);
              }}
              onSubmit={async (input) => {
                const row = await addMyWord(input);
                setAdding(false);
                setWord({ ...word, mine: true });
                setNotice(`Added ${row.rw} to My words, to learn next.`);
                setAdded((n) => n + 1);
              }}
            />
          ) : (
            <>
              <p className="body-small">
                Not in the course. Add it to your own words; you can change it to its root first.
              </p>
              <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
                Add to my words
              </button>
            </>
          )}
          {adding ? null : (
            <button type="button" className="btn btn-missed" onClick={() => setWord(null)}>
              Close
            </button>
          )}
        </section>
      ) : null}

      <NewWords key={story.id} story={story} version={added} onNotice={setNotice} />

      <Questions story={story} />
      <Finish story={story} onChange={setStory} />

      <ReportLink
        report={{
          item_id: null,
          form_id: null,
          story_id: story.id,
          module: 'stories',
          shown_text: `${story.title}: ${story.sentences.map((s) => s.rw).join(' ')}`.slice(0, 500),
        }}
        intro="This story was written by AI and is not yet checked by a native speaker. What looks wrong?"
        placeholder="For example: the second sentence has the wrong verb ending"
      />
    </main>
  );
}

/**
 * The story's words the learner hasn't learned (decision 187), each with a way to learn it:
 * course words go next in Learn, others onto My words. Learn all does every one at once.
 */
function NewWords({
  story,
  version,
  onNotice,
}: {
  story: StoryRow;
  version: number;
  onNotice: (text: string) => void;
}) {
  // Read once per story: a reading or feedback change saves a new copy of it, but its words
  // stay the same, so the list need not reload then.
  const [glossary] = useState(story.glossary);
  const [words, setWords] = useState<StoryNewWord[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);

  useEffect(() => {
    let alive = true;
    void storyNewWords(glossary).then((w) => {
      if (alive) setWords(w);
    });
    return () => {
      alive = false;
    };
  }, [glossary, version, done]);

  if (!words || words.length === 0) return null;
  const open = words.filter((w) => !w.queued && !w.mine);

  const learn = async (list: StoryNewWord[]) => {
    setBusy(true);
    try {
      let toLearn = 0;
      let toMine = 0;
      for (const w of list) {
        const out = await learnStoryWord(w);
        if (out === 'learn') toLearn++;
        else if (out === 'mine') toMine++;
      }
      const parts = [toLearn ? `${toLearn} to Learn` : '', toMine ? `${toMine} to My words` : ''];
      const said = parts.filter(Boolean).join(' and ');
      onNotice(said ? `Added ${said}.` : 'Those are already added.');
      setDone((n) => n + 1);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel" aria-labelledby="story-new-words">
      <h3 id="story-new-words" className="h3-bold">
        New words in this story
      </h3>
      <p className="body-small">
        Course words go next in Learn. Others go to My words with the story’s meaning, tagged “
        {STORY_TAG}”.
      </p>
      <ul className="story-new-words">
        {words.map((w) => (
          <li key={w.word} className="story-new-word">
            <span>
              <span className="body-bold" lang="rw">
                {w.word}
              </span>
              <span className="body-small"> · {w.en}</span>
            </span>
            {w.queued ? (
              <span className="body-small">In Learn</span>
            ) : w.mine ? (
              <span className="body-small">In My words</span>
            ) : (
              <button
                type="button"
                className="btn btn-missed"
                disabled={busy}
                aria-label={`Learn ${w.word}`}
                onClick={() => void learn([w])}
              >
                {w.itemId ? 'Learn' : 'Add'}
              </button>
            )}
          </li>
        ))}
      </ul>
      {open.length > 1 ? (
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy}
          onClick={() => void learn(open)}
        >
          Learn all {open.length}
        </button>
      ) : null}
    </section>
  );
}

/** A word in a story: tap for its meaning, hold to add it to Learn or My words. */
function WordButton({
  text,
  onTap,
  onHold,
}: {
  text: string;
  onTap: () => void;
  onHold: () => void;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const held = useRef(false);
  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  return (
    <button
      type="button"
      className="kn-reset-btn story-word-btn"
      onPointerDown={() => {
        held.current = false;
        cancel();
        timer.current = setTimeout(() => {
          held.current = true;
          onHold();
        }, LONG_PRESS_MS);
      }}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onContextMenu={(e) => e.preventDefault()}
      onClick={() => {
        if (held.current) {
          held.current = false;
          return;
        }
        onTap();
      }}
    >
      {text}
    </button>
  );
}

function Questions({ story }: { story: StoryRow }) {
  const [picked, setPicked] = useState<Record<number, number>>({});
  if (story.questions.length === 0) return null;
  return (
    <section className="panel story-questions" aria-labelledby="story-questions">
      <h3 id="story-questions" className="h3-bold">
        Did you follow it?
      </h3>
      {story.questions.map((q, i) => {
        const choice = picked[i];
        return (
          <fieldset key={i} className="story-question">
            <legend className="body-bold">{q.question}</legend>
            <div className="story-options">
              {q.options.map((o, j) => (
                <button
                  key={j}
                  type="button"
                  className={cx(
                    'kn-reset-btn recall-option',
                    choice !== undefined && j === q.answer && 'recall-option-right',
                    choice === j && j !== q.answer && 'recall-option-wrong',
                  )}
                  disabled={choice !== undefined}
                  onClick={() => setPicked((p) => ({ ...p, [i]: j }))}
                >
                  {o}
                </button>
              ))}
            </div>
            {choice !== undefined ? (
              <p className="body-small" role="status">
                {choice === q.answer ? '✓ Right' : `✗ It was “${q.options[q.answer]}”`}
              </p>
            ) : null}
          </fieldset>
        );
      })}
    </section>
  );
}

const FEEDBACK: { value: StoryFeedback; label: string }[] = [
  { value: 'too_hard', label: 'Too hard' },
  { value: 'just_right', label: 'Just right' },
  { value: 'too_easy', label: 'Too easy' },
];

/** Finishing a read, then how hard it was, which the next story takes into account. */
function Finish({ story, onChange }: { story: StoryRow; onChange: (s: StoryRow) => void }) {
  const [finished, setFinished] = useState(false);
  const [feedback, setFeedback] = useState<StoryFeedback | null>(null);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const counts = readCounts(story, Date.now());

  const finish = async () => {
    onChange(await finishReading(story.id, Date.now()));
    setFinished(true);
  };

  const send = async () => {
    if (!feedback) return;
    onChange(await saveFeedback(story.id, feedback, note));
    setSaved(true);
  };

  if (!finished && counts) {
    return (
      <div className="learn-actions">
        <button type="button" className="btn btn-primary" onClick={() => void finish()}>
          I’ve read it
        </button>
      </div>
    );
  }

  return (
    <section className="panel story-finish" role="status">
      <p className="body-bold">
        {story.retired
          ? 'That was its last time. This story is finished.'
          : story.next_due_at
            ? `It comes back in ${waitInWords(Date.parse(story.next_due_at) - Date.now())}.`
            : ''}
      </p>
      {saved ? (
        <p className="body">Thanks. The next story will take that into account.</p>
      ) : (
        <>
          <p className="body">How was it?</p>
          <div className="story-feedback" role="group" aria-label="How was it?">
            {FEEDBACK.map((f) => (
              <button
                key={f.value}
                type="button"
                className={cx('btn btn-missed', feedback === f.value && 'story-feedback-on')}
                aria-pressed={feedback === f.value}
                onClick={() => setFeedback(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <label className="field">
            <span className="body-small-bold">Anything to add? (optional)</span>
            <input
              className="field-input"
              maxLength={140}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="For example: too many new verbs"
            />
          </label>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!feedback}
            onClick={() => void send()}
          >
            Send
          </button>
        </>
      )}
    </section>
  );
}

type PindoCall = 'free' | 'paid';

/**
 * Debug mode, for an admin: the cost of a Pindo request, and whether to make it as a free call
 * to Pindo's public endpoint (capped per day, meant for trying things out) or a paid one
 * (decision 211; learner feedback of 27 November).
 */
function PindoChoice({ onChoose }: { onChoose: (c: PindoCall | null) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = dialog.current;
    if (d && !d.open) d.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="freeze-dialog"
      aria-labelledby="pindo-choice"
      onCancel={() => onChoose(null)}
    >
      <div className="form">
        <h2 id="pindo-choice" className="h3-bold">
          Make the story’s audio?
        </h2>
        <p className="body">
          This sends one request to Pindo. A paid call costs about {dollars(PINDO_REQUEST_USD)}. A
          free call uses Pindo’s public endpoint instead: it costs nothing, but it is limited each
          day and meant for trying things out.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => onChoose('free')}>
          Free call
        </button>
        <button type="button" className="btn btn-missed" onClick={() => onChoose('paid')}>
          Paid call ({dollars(PINDO_REQUEST_USD)})
        </button>
        <button type="button" className="report-link body-small" onClick={() => onChoose(null)}>
          Cancel
        </button>
      </div>
    </dialog>
  );
}
