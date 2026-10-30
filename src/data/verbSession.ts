// Runs the Verb Builder: asks the engines what to show, and saves after every round and answer,
// so a reload lands on the same round. Progress stays on this device; the level reached syncs
// through the profile.

import { systemClock, type Clock } from '../engine/clock';
import { createAppRng, type Rng } from '../engine/random';
import {
  applyVerbAnswer,
  createVerbProgress,
  dismissIntro,
  followProfileLevel,
  needsIntro,
  type VerbProgress,
} from '../engine/verbLevels';
import {
  levelProgress,
  nextRound,
  type RoundResult,
  type Slot,
  type Verb,
  type VerbForm,
  type VerbRound,
} from '../engine/verbs';
import { db, type KinyaDb, type VerbStateRow } from './db';
import { getProfile, setVerbLevel } from './repo';
import { progressChanged } from './signals';
import { bundledVerbForms, bundledVerbs } from './verbSeed';

export type VerbView =
  | { type: 'intro'; level: number }
  | {
      type: 'round';
      level: number;
      round: VerbRound;
      form: VerbForm;
      verb: Verb;
      guided: boolean;
      mastered: number;
      total: number;
    }
  | { type: 'empty' };

export interface VerbAnswer {
  result: RoundResult;
  /** The level just unlocked, if any. */
  unlocked: number | null;
  /** True the first time levels 1 to 3 are all done. */
  finished: boolean;
}

export class VerbSession {
  private progress: VerbProgress;
  private busy = false;
  readonly verbs: Verb[];
  readonly forms: VerbForm[];
  private readonly formsById: Map<string, VerbForm>;
  /** Course audio for words the Verb Builder also uses, by spelling. */
  private readonly audio: Map<string, string>;
  private readonly rng: Rng;
  private readonly clock: Clock;
  private readonly d: KinyaDb;

  private constructor(
    progress: VerbProgress,
    audio: Map<string, string>,
    deps: { rng: Rng; clock: Clock; db: KinyaDb },
  ) {
    this.progress = progress;
    this.verbs = bundledVerbs;
    this.forms = bundledVerbForms;
    this.formsById = new Map(this.forms.map((f) => [f.id, f]));
    this.audio = audio;
    this.rng = deps.rng;
    this.clock = deps.clock;
    this.d = deps.db;
  }

  static async open(deps: { rng?: Rng; clock?: Clock; db?: KinyaDb } = {}): Promise<VerbSession> {
    const d = deps.db ?? db;
    const [row, profile, voiced] = await Promise.all([
      d.verb_state.get('main'),
      getProfile(d),
      d.item_forms.filter((f) => !!f.audio_path).toArray(),
    ]);
    const stored: VerbProgress = row ?? createVerbProgress(profile.verb_level);
    const progress = followProfileLevel(stored, profile.verb_level);
    const audio = new Map(voiced.map((f) => [f.text, f.audio_path!]));
    const session = new VerbSession(progress, audio, {
      rng: deps.rng ?? createAppRng(),
      clock: deps.clock ?? systemClock,
      db: d,
    });
    if (progress !== stored || !row) await session.save();
    await session.advance();
    return session;
  }

  get level(): number {
    return this.progress.state.level;
  }

  audioFor(word: string): string | null {
    return this.audio.get(word) ?? null;
  }

  view(): VerbView {
    const p = this.progress;
    if (needsIntro(p)) return { type: 'intro', level: p.state.level };
    const round = p.state.current;
    const form = round ? this.formsById.get(round.formId) : undefined;
    const verb = form ? this.verbs.find((v) => v.id === form.verb_id) : undefined;
    if (!round || !form || !verb) return { type: 'empty' };
    const { mastered, total } = levelProgress(p.state, this.verbs, this.forms);
    return {
      type: 'round',
      level: p.state.level,
      round,
      form,
      verb,
      guided: p.guided_left > 0,
      mastered,
      total,
    };
  }

  /** Leaves the opening screen for the guided rounds. */
  async startPractice(): Promise<void> {
    if (this.busy || !needsIntro(this.progress)) return;
    this.busy = true;
    try {
      this.progress = dismissIntro(this.progress);
      await this.advance();
    } finally {
      this.busy = false;
    }
  }

  /** Grades the round on screen. Returns null when the answer was ignored. */
  async answer(
    roundId: string,
    choices: Partial<Record<Slot, string>>,
  ): Promise<VerbAnswer | null> {
    if (this.busy) return null;
    this.busy = true;
    try {
      const out = applyVerbAnswer(
        this.progress,
        { roundId, choices },
        this.verbs,
        this.forms,
        this.clock.now(),
      );
      if (!out.result) return null;
      this.progress = out.progress;
      await this.save();
      if (out.unlocked) {
        await setVerbLevel(out.unlocked, this.d);
        // Learn, Review and Home read the level; this tells them it changed.
        progressChanged.emit();
      }
      return { result: out.result, unlocked: out.unlocked, finished: out.finished };
    } finally {
      this.busy = false;
    }
  }

  /** Puts the next round on screen, after the learner has seen the last answer. */
  async next(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    try {
      await this.advance();
    } finally {
      this.busy = false;
    }
  }

  private async advance(): Promise<void> {
    if (needsIntro(this.progress)) return;
    const { state } = nextRound(this.progress.state, this.verbs, this.forms, this.rng);
    if (state === this.progress.state) return;
    this.progress = { ...this.progress, state };
    await this.save();
  }

  private async save(): Promise<void> {
    const row: VerbStateRow = {
      id: 'main',
      ...this.progress,
      updated_at: new Date(this.clock.now()).toISOString(),
    };
    await this.d.verb_state.put(row);
  }
}
