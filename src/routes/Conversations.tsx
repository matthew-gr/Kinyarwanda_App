// Conversations (decision 215): short exchanges level by level. The app speaks; the learner
// picks, builds or types the reply that fits their role card.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { AppBar } from '../components/AppBar';
import { cx } from '../components/cx';
import { Icon } from '../components/Icon';
import { SessionHeader } from '../components/SessionHeader';
import {
  loadConversationProgress,
  loadLineAudio,
  saveLevelResult,
  type ConversationProgress,
} from '../data/conversations';
import {
  accepts,
  choices,
  dealRole,
  levelTurns,
  LEVELS,
  normalize,
  PASS_SHARE,
  roleText,
  tiles,
  type Level,
  type Role,
  type Turn,
} from '../engine/conversation';
import { createAppRng } from '../engine/random';
import { playAudio } from './cardText';

interface Said {
  turn: Turn;
  reply: string;
  right: boolean;
}

type Phase =
  | { type: 'levels' }
  | { type: 'role'; level: Level; role: Role }
  | { type: 'talk'; level: Level; role: Role; turns: Turn[]; said: Said[] }
  | { type: 'done'; level: Level; said: Said[]; passed: boolean };

const MODE_TEXT = {
  choose: 'Pick the reply',
  build: 'Build the reply from words',
  type: 'Type the reply',
} as const;

const isOpen = (n: number, p: ConversationProgress) =>
  n === 1 || (p.best[n - 1] ?? 0) >= PASS_SHARE;

export function Conversations() {
  const navigate = useNavigate();
  const rng = useMemo(() => createAppRng(), []);
  const [progress, setProgress] = useState(loadConversationProgress);
  const [audio, setAudio] = useState<Map<string, string>>(new Map());
  const [phase, setPhase] = useState<Phase>({ type: 'levels' });

  useEffect(() => {
    let alive = true;
    void loadLineAudio().then((a) => alive && setAudio(a));
    return () => {
      alive = false;
    };
  }, []);

  const begin = (level: Level) => setPhase({ type: 'role', level, role: dealRole(rng) });

  return (
    <main className="screen screen-learn screen-drill">
      <AppBar
        title="Conversations"
        onBack={() => (phase.type === 'levels' ? navigate('/') : setPhase({ type: 'levels' }))}
        backLabel={phase.type === 'levels' ? 'Back to Home' : 'Back to the levels'}
      />
      {phase.type === 'levels' ? (
        <section className="drill-start panel">
          <h2 className="h2-bold">Talk it through</h2>
          <p className="body">
            Short conversations, each level building on the one before. Each time you get a role: a
            name, a home town, a job. Reply as that person. Pass a level with{' '}
            {Math.round(PASS_SHARE * 100)}% right first time to open the next.
          </p>
          <ol className="drill-levels">
            {LEVELS.map((l) => {
              const open = isOpen(l.number, progress);
              const best = progress.best[l.number];
              return (
                <li key={l.number}>
                  <button
                    type="button"
                    className="drill-level"
                    disabled={!open}
                    onClick={() => begin(l)}
                  >
                    <span className="drill-level-name">
                      {l.number}. {l.title}
                    </span>
                    <span className="body-small drill-level-meta">
                      {!open
                        ? `Opens when level ${l.number - 1} is passed`
                        : `${MODE_TEXT[l.mode]}${
                            best !== undefined
                              ? ` · best ${Math.round(best * 100)}%${best >= PASS_SHARE ? ' ✓' : ''}`
                              : ''
                          }`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      ) : phase.type === 'role' ? (
        <section className="drill-start panel">
          <h2 className="h2-bold">
            Level {phase.level.number}: {phase.level.title}
          </h2>
          <p className="body">{phase.level.goal}</p>
          <p className="body role-card">{roleText(phase.role)}</p>
          <p className="body-small">{MODE_TEXT[phase.level.mode]}.</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              setPhase({
                type: 'talk',
                level: phase.level,
                role: phase.role,
                turns: levelTurns(phase.level, phase.role),
                said: [],
              })
            }
          >
            Start
          </button>
        </section>
      ) : phase.type === 'talk' ? (
        <Talk
          key={phase.said.length}
          phase={phase}
          audio={audio}
          onSaid={(s) => {
            const said = [...phase.said, s];
            if (said.length < phase.turns.length) {
              setPhase({ ...phase, said });
              return;
            }
            const share = said.filter((x) => x.right).length / said.length;
            setProgress(saveLevelResult(phase.level.number, share));
            setPhase({ type: 'done', level: phase.level, said, passed: share >= PASS_SHARE });
          }}
        />
      ) : (
        <section className="learn-done drill-results" role="status">
          <h2 className="h2-bold">{phase.passed ? 'Level passed' : 'Level done'}</h2>
          <p className="body">
            {phase.said.filter((s) => s.right).length} of {phase.said.length} replies right first
            time.
            {phase.passed
              ? phase.level.number < LEVELS.length
                ? ` Level ${phase.level.number + 1} is open.`
                : ' That was the last level.'
              : ` ${Math.round(PASS_SHARE * 100)}% passes the level.`}
          </p>
          {phase.said.some((s) => !s.right) ? (
            <>
              <p className="body">Replies to practise:</p>
              <ul className="pair-compare body">
                {phase.said
                  .filter((s) => !s.right)
                  .map((s) => (
                    <li key={s.turn.them + s.turn.replies[0]}>
                      <span lang="rw">{s.turn.them}</span> →{' '}
                      <span lang="rw" className="body-bold">
                        {s.turn.replies[0]}
                      </span>{' '}
                      ({s.turn.replyEn})
                    </li>
                  ))}
              </ul>
            </>
          ) : null}
          {phase.passed && phase.level.number < LEVELS.length ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => begin(LEVELS[phase.level.number]!)}
            >
              Next level
            </button>
          ) : null}
          <button
            type="button"
            className={phase.passed ? 'btn btn-missed' : 'btn btn-primary'}
            onClick={() => begin(phase.level)}
          >
            Play it again
          </button>
          <button
            type="button"
            className="btn btn-missed"
            onClick={() => setPhase({ type: 'levels' })}
          >
            All levels
          </button>
        </section>
      )}
    </main>
  );
}

function Talk({
  phase,
  audio,
  onSaid,
}: {
  phase: Extract<Phase, { type: 'talk' }>;
  audio: Map<string, string>;
  onSaid: (s: Said) => void;
}) {
  const rng = useMemo(() => createAppRng(), []);
  const turn = phase.turns[phase.said.length]!;
  const mode = phase.level.mode;
  const [english, setEnglish] = useState(false);
  const [result, setResult] = useState<Said | null>(null);
  const [typed, setTyped] = useState('');
  const options = useMemo(() => choices(turn, rng), [turn, rng]);
  const allTiles = useMemo(() => tiles(turn, rng).map((text, i) => ({ text, i })), [turn, rng]);
  const [built, setBuilt] = useState<number[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const clip = audio.get(normalize(turn.them));

  useEffect(() => {
    if (clip) playAudio(clip);
    input.current?.focus();
  }, [clip]);

  const check = (reply: string) => {
    if (result) return;
    setResult({ turn, reply, right: accepts(turn, reply) });
  };
  const builtText = built.map((i) => allTiles[i]!.text).join(' ');

  return (
    <>
      <SessionHeader
        level={`${phase.said.length + 1} of ${phase.turns.length}`}
        meta={`Level ${phase.level.number}`}
        progress={phase.said.length / phase.turns.length}
        progressLabel="Replies"
      />
      <p className="body-small role-card">{roleText(phase.role)}</p>
      <div className="chat" aria-label="The conversation">
        {phase.said.map((s, i) => (
          <div key={i} className="chat-pair">
            <p className="chat-them body" lang="rw">
              {s.turn.them}
            </p>
            <p className="chat-me body" lang="rw">
              {s.right ? s.reply : s.turn.replies[0]}
            </p>
          </div>
        ))}
        <div className="chat-them chat-now">
          <p className="body-bold" lang="rw">
            {turn.them}
            {clip ? (
              <button
                type="button"
                className="kn-reset-btn verb-speak"
                onClick={() => playAudio(clip)}
                aria-label="Play it again"
              >
                <Icon name="speaker" size={20} />
              </button>
            ) : null}
          </p>
          {english ? (
            <p className="body-small">{turn.themEn}</p>
          ) : (
            <button
              type="button"
              className="report-link body-small"
              onClick={() => setEnglish(true)}
            >
              Show English
            </button>
          )}
        </div>
      </div>

      {mode !== 'choose' ? <p className="body-small chat-cue">Say: {turn.replyEn}</p> : null}

      {mode === 'choose' ? (
        <div className="recall-options chat-choices" role="group" aria-label="Replies">
          {options.map((o) => {
            const right = result !== null && o === turn.replies[0];
            const wrong = result?.reply === o && !result.right;
            return (
              <button
                key={o}
                type="button"
                lang="rw"
                className={cx(
                  'kn-reset-btn recall-option',
                  right && 'recall-option-right',
                  wrong && 'recall-option-wrong',
                )}
                disabled={result !== null}
                onClick={() => check(o)}
              >
                {o}
              </button>
            );
          })}
        </div>
      ) : mode === 'build' ? (
        <div className="chat-build">
          <p className="chat-built body-bold" lang="rw" aria-label="Your reply">
            {built.length > 0 ? (
              built.map((i) => (
                <button
                  key={i}
                  type="button"
                  className="kn-reset-btn chat-tile"
                  disabled={result !== null}
                  onClick={() => setBuilt(built.filter((b) => b !== i))}
                >
                  {allTiles[i]!.text}
                </button>
              ))
            ) : (
              <span className="body-small">Tap the words in order.</span>
            )}
          </p>
          <div className="chat-tiles" role="group" aria-label="Words">
            {allTiles.map((t) =>
              built.includes(t.i) ? null : (
                <button
                  key={t.i}
                  type="button"
                  lang="rw"
                  className="kn-reset-btn chat-tile"
                  disabled={result !== null}
                  onClick={() => setBuilt([...built, t.i])}
                >
                  {t.text}
                </button>
              ),
            )}
          </div>
          {result ? null : (
            <button
              type="button"
              className="btn btn-primary"
              disabled={built.length === 0}
              onClick={() => check(builtText)}
            >
              Check
            </button>
          )}
        </div>
      ) : (
        <form
          className="chat-type"
          onSubmit={(e) => {
            e.preventDefault();
            if (typed.trim()) check(typed);
          }}
        >
          <input
            ref={input}
            className="field-input body"
            lang="rw"
            aria-label="Your reply"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            value={typed}
            disabled={result !== null}
            onChange={(e) => setTyped(e.target.value)}
          />
          {result ? null : (
            <button type="submit" className="btn btn-primary" disabled={!typed.trim()}>
              Check
            </button>
          )}
        </form>
      )}

      <p className="body-small recall-status" role="status">
        {result === null
          ? ' '
          : result.right
            ? 'Right.'
            : `A reply that fits: ${turn.replies[0]} (${turn.replyEn})`}
      </p>
      {result ? (
        <button type="button" className="btn btn-primary" onClick={() => onSaid(result)}>
          {phase.said.length + 1 === phase.turns.length ? 'See how it went' : 'Next'}
        </button>
      ) : null}
    </>
  );
}
