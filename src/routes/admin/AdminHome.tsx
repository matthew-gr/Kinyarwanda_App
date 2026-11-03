import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
  errorText,
  listFormAudio,
  listNumberAudio,
  listItems,
  listReports,
  makeAudio,
  type AudioBatch,
  makeNumberAudio,
  resolveReport,
  type ReportView,
} from '../../data/admin';
import type { Item, ItemForm } from '../../engine/types';
import { AdminShell, ErrorLine } from './AdminShell';

const STATUS_NAMES: Record<Item['status'], string> = {
  dev: 'Test set',
  ai_draft: 'AI draft',
  reviewed: 'Reviewed',
  approved: 'Approved',
};
const WHEN = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

type FormAudio = Pick<ItemForm, 'id' | 'item_id' | 'audio_path' | 'retired'>;
type NumberAudio = { id: string; audio_path: string | null; retired: boolean };

/** A run of Make missing audio or Remake all audio, as far as it has got. */
interface AudioRun {
  done: number;
  all: number;
  requests: number;
  failed: number;
  started: number;
  ended?: number;
  /** Why the run ended early: out of credit, or Stop pressed. */
  stopped?: string | null;
  /** Pindo bills each request as a minute, so the cost can be shown. */
  pindo: boolean;
  /** Batches said together that cut cleanly, and why the others didn't. */
  clean: number;
  notes: string[];
}

/** What Pindo charges for one request (a billed minute). */
const PINDO_PER_REQUEST = 0.12;

/** ", 41 requests to the voice (about $4.92)". */
function spent(run: AudioRun): string {
  if (!run.requests) return '';
  const cost = run.pindo ? ` (about ${(run.requests * PINDO_PER_REQUEST).toFixed(2)})` : '';
  return `, ${run.requests} requests to the voice${cost}`;
}

/** "45 s" or "3 min 10 s". */
function minutes(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${s % 60} s`;
}

export function AdminHome() {
  const [params] = useSearchParams();
  const tab = params.get('tab') === 'reports' ? 'reports' : 'content';
  return (
    <AdminShell title="Admin" back="/profile">
      <nav className="deck-switch" aria-label="Admin sections">
        {(['content', 'reports'] as const).map((t) => (
          <Link
            key={t}
            to={t === 'content' ? '/admin' : '/admin?tab=reports'}
            replace
            className="deck-switch-option body-bold"
            aria-current={t === tab ? 'page' : undefined}
          >
            {t === 'content' ? 'Course' : 'Reports'}
          </Link>
        ))}
      </nav>
      {tab === 'content' ? <Course /> : <Reports />}
    </AdminShell>
  );
}

function Course() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [forms, setForms] = useState<FormAudio[]>([]);
  const [numbers, setNumbers] = useState<NumberAudio[]>([]);
  const [kind, setKind] = useState<Item['kind']>('word');
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [making, setMaking] = useState<AudioRun | null>(null);
  const [finished, setFinished] = useState<AudioRun | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const stopRef = useRef(false);
  // A clock while audio is made, so the status line visibly moves between groups.
  useEffect(() => {
    if (!making) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [making]);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let alive = true;
    Promise.all([listItems(), listFormAudio(), listNumberAudio()]).then(
      ([i, f, n]) => {
        if (!alive) return;
        setItems(i);
        setForms(f);
        setNumbers(n);
      },
      (e: unknown) => alive && setError(errorText(e)),
    );
    return () => {
      alive = false;
    };
  }, [reload]);

  const live = forms.filter((f) => !f.retired);
  const silent = live.filter((f) => !f.audio_path);
  const liveNumbers = numbers.filter((n) => !n.retired);
  const silentNumbers = liveNumbers.filter((n) => !n.audio_path);
  const missing = silent.length + silentNumbers.length;
  const audioByItem = useMemo(() => {
    const m = new Map<string, { all: number; voiced: number }>();
    for (const f of live) {
      const c = m.get(f.item_id) ?? { all: 0, voiced: 0 };
      c.all++;
      if (f.audio_path) c.voiced++;
      m.set(f.item_id, c);
    }
    return m;
  }, [live]);

  const q = query.trim().toLowerCase();
  const shown = (items ?? []).filter(
    (i) =>
      i.kind === kind && (!q || i.base.toLowerCase().includes(q) || i.en.toLowerCase().includes(q)),
  );

  /** Voices the given forms and numbers; every earlier clip is kept in audio_clips. */
  const voice = async (formIds: string[], numberIds: string[]) => {
    setError(null);
    setFinished(null);
    stopRef.current = false;
    let run: AudioRun = {
      done: 0,
      all: formIds.length + numberIds.length,
      requests: 0,
      failed: 0,
      started: Date.now(),
      pindo: false,
      clean: 0,
      notes: [],
    };
    setMaking(run);
    setNow(run.started);
    const step = (offset: number) => (done: number, batch: AudioBatch) => {
      const notes = batch.notes ?? [];
      run = {
        ...run,
        done: offset + done,
        requests: run.requests + (batch.requests ?? 0),
        failed: run.failed + (batch.failed?.length ?? 0),
        pindo: run.pindo || batch.provider === 'pindo',
        clean: run.clean + notes.filter((n) => n.endsWith('cut cleanly')).length,
        notes: [...run.notes, ...notes.filter((n) => !n.endsWith('cut cleanly'))],
      };
      setMaking(run);
    };
    const stop = () => stopRef.current;
    try {
      // Out of credit on the forms means the numbers would be refused too.
      const why =
        (await makeAudio(formIds, step(0), stop)) ??
        (await makeNumberAudio(numberIds, step(formIds.length), stop));
      run = { ...run, stopped: why };
      setReload((r) => r + 1);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setFinished({ ...run, ended: Date.now() });
      setMaking(null);
    }
  };

  const makeMissing = () =>
    voice(
      silent.map((f) => f.id),
      silentNumbers.map((n) => n.id),
    );

  // After the spoken spelling changes, every clip can be made again with the new rules.
  const remakeAll = () => {
    const all = live.length + liveNumbers.length;
    if (!window.confirm(`Make all ${all} clips again with the current voice? This uses credits.`))
      return;
    void voice(
      live.map((f) => f.id),
      liveNumbers.map((n) => n.id),
    );
  };

  return (
    <>
      <section className="panel" aria-labelledby="audio-title">
        <h2 id="audio-title" className="h2-bold">
          Audio
        </h2>
        <p className="body">
          {live.length - silent.length} of {live.length} forms have audio.
        </p>
        <p className="body">
          {liveNumbers.length - silentNumbers.length} of {liveNumbers.length} drill numbers have
          audio.
        </p>
        <div className="admin-actions">
          <Link to="/admin/voices" className="btn btn-missed">
            Voice test
          </Link>
          <button
            type="button"
            className="btn btn-primary"
            disabled={missing === 0 || making !== null}
            onClick={() => void makeMissing()}
          >
            {making ? 'Making audio…' : 'Make missing audio'}
          </button>
          <button
            type="button"
            className="btn btn-missed"
            disabled={live.length + liveNumbers.length === 0 || making !== null}
            onClick={remakeAll}
          >
            Remake all audio
          </button>
        </div>
        {making ? (
          <>
            <p className="body-small" role="status">
              Working, {minutes(now - making.started)}: {making.done} of {making.all} clips done
              {spent(making)}
              {making.failed ? `, ${making.failed} couldn't be voiced` : ''}. Each group of 25 can
              take a minute or two; keep this page open.
            </p>
            <button
              type="button"
              className="btn btn-missed"
              disabled={stopRef.current}
              onClick={() => {
                stopRef.current = true;
                setNow(Date.now());
              }}
            >
              {stopRef.current ? 'Stopping after this group…' : 'Stop'}
            </button>
          </>
        ) : finished ? (
          <>
            <p className="body-small" role="status">
              {finished.stopped ? 'Stopped' : 'Finished'} after{' '}
              {minutes((finished.ended ?? finished.started) - finished.started)}: {finished.done} of{' '}
              {finished.all} clips{spent(finished)}.
              {finished.failed
                ? ` ${finished.failed} couldn't be voiced; Make missing audio tries them again.`
                : ''}
            </p>
            {finished.stopped && finished.stopped !== 'Stopped.' ? (
              <p className="body-small-bold" role="alert">
                The voice is out of credit, so nothing more was sent. Top up, then Make missing
                audio carries on. ({finished.stopped})
              </p>
            ) : null}
            {finished.clean + finished.notes.length > 0 ? (
              <details className="body-small">
                <summary>
                  {finished.clean} of {finished.clean + finished.notes.length} batches cut cleanly
                </summary>
                <ul lang="rw">
                  {finished.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </details>
            ) : null}
          </>
        ) : null}
        <ErrorLine error={error} />
      </section>

      <section className="panel" aria-labelledby="course-title">
        <h2 id="course-title" className="h2-bold">
          Course
        </h2>
        <div className="admin-filters">
          <label className="field">
            <span className="body-small-bold">Show</span>
            <select
              className="field-input field-select"
              value={kind}
              onChange={(e) => setKind(e.target.value as Item['kind'])}
            >
              <option value="word">Words</option>
              <option value="phrase">Phrases</option>
            </select>
          </label>
          <label className="field">
            <span className="body-small-bold">Search</span>
            <input
              className="field-input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        <Link to={`/admin/items/new?kind=${kind}`} className="btn btn-missed">
          Add a {kind}
        </Link>
        {items === null ? (
          <p className="body">Loading…</p>
        ) : (
          <ul className="admin-list">
            {shown.map((i) => {
              const a = audioByItem.get(i.id);
              return (
                <li key={i.id}>
                  <Link to={`/admin/items/${i.id}`} className="admin-row">
                    <span className="admin-rank body-small">{i.rank}</span>
                    <span className="admin-main">
                      <span className="body-bold" lang="rw">
                        {i.base}
                      </span>
                      <span className="body-small">{i.en}</span>
                    </span>
                    <span className="admin-meta body-small">
                      {i.retired ? 'Retired' : STATUS_NAMES[i.status]}
                      <br />
                      {a ? `Audio ${a.voiced} of ${a.all}` : 'No forms'}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}

function Reports() {
  const [reports, setReports] = useState<ReportView[] | null>(null);
  const [all, setAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let alive = true;
    listReports(all).then(
      (r) => alive && setReports(r),
      (e: unknown) => alive && setError(errorText(e)),
    );
    return () => {
      alive = false;
    };
  }, [all, reload]);

  return (
    <section className="panel" aria-labelledby="reports-title">
      <h2 id="reports-title" className="h2-bold">
        {all ? 'All reports' : 'Open reports'}
      </h2>
      <label className="admin-check body">
        <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} /> Show
        resolved reports too
      </label>
      <ErrorLine error={error} />
      {reports === null ? (
        <p className="body">Loading…</p>
      ) : reports.length === 0 ? (
        <p className="body">No reports. Learners send these from the cards.</p>
      ) : (
        <ul className="admin-list">
          {reports.map((r) => (
            <ReportCard key={r.id} report={r} onDone={() => setReload((n) => n + 1)} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ReportCard({ report, onDone }: { report: ReportView; onDone: () => void }) {
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const resolve = async () => {
    try {
      await resolveReport(report.id, note);
      onDone();
    } catch (e) {
      setError(errorText(e));
    }
  };
  return (
    <li className="admin-report">
      <p className="body-small">
        {WHEN.format(new Date(report.created_at))} ·{' '}
        {report.module === 'learn' ? 'Learn' : report.module === 'review' ? 'Review' : 'Stories'}
      </p>
      {report.item_id ? (
        <p className="body-bold">
          <Link to={`/admin/items/${report.item_id}`} lang="rw">
            {report.item?.base ?? 'Unknown item'}
          </Link>{' '}
          <span className="body-small">(showed {report.shown_text})</span>
        </p>
      ) : (
        <p className="body-small" lang="rw">
          Story: {report.shown_text}
        </p>
      )}
      <p className="body">{report.message}</p>
      {report.resolved_at ? (
        <p className="body-small">
          Resolved {WHEN.format(new Date(report.resolved_at))}
          {report.resolution ? `: ${report.resolution}` : ''}
        </p>
      ) : (
        <div className="admin-resolve">
          <label className="field">
            <span className="body-small-bold">What was done (optional)</span>
            <input
              className="field-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
            />
          </label>
          <button type="button" className="btn btn-missed" onClick={() => void resolve()}>
            Mark resolved
          </button>
        </div>
      )}
      <ErrorLine error={error} />
    </li>
  );
}
