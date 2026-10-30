import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
  errorText,
  listFormAudio,
  listNumberAudio,
  listItems,
  listReports,
  makeAudio,
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
  const [making, setMaking] = useState<string | null>(null);
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

  const makeMissing = async () => {
    setError(null);
    try {
      await makeAudio(
        silent.map((f) => f.id),
        (done) => setMaking(`${done} of ${missing}`),
      );
      await makeNumberAudio(
        silentNumbers.map((n) => n.id),
        (done) => setMaking(`${silent.length + done} of ${missing}`),
      );
      setReload((r) => r + 1);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setMaking(null);
    }
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
            {making ? `Making audio: ${making}` : 'Make missing audio'}
          </button>
        </div>
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
        {report.module === 'learn' ? 'Learn' : 'Review'}
      </p>
      <p className="body-bold">
        <Link to={`/admin/items/${report.item_id}`} lang="rw">
          {report.item?.base ?? 'Unknown item'}
        </Link>{' '}
        <span className="body-small">(showed {report.shown_text})</span>
      </p>
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
