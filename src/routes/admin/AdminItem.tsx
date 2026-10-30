import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { errorText, listItems, loadItem, makeAudio, saveItem, type Clip } from '../../data/admin';
import { checkItem, type ContentProblem } from '../../engine/contentCheck';
import { syllables } from '../../engine/pronunciation';
import type { ContentStatus, Gloss, Item, ItemForm } from '../../engine/types';
import { playAudio } from '../cardText';
import { AdminShell, ErrorLine } from './AdminShell';

const STATUSES: [ContentStatus, string][] = [
  ['ai_draft', 'AI draft'],
  ['reviewed', 'Reviewed'],
  ['approved', 'Approved'],
];
const PERSONS: [string, string][] = [
  ['', 'None'],
  ['1sg', 'I'],
  ['2sg', 'you'],
  ['3sg', 'he or she'],
  ['1pl', 'we'],
  ['2pl', 'you all'],
  ['3pl', 'they'],
];
/** Rows added here were typed in by an admin, not drafted by the AI. */
const EDITED: Item['source'] = 'admin:editor';

function blankItem(kind: Item['kind'], rank: number): Item {
  return {
    id: crypto.randomUUID(),
    kind,
    base: '',
    en: '',
    word_type: kind === 'phrase' ? 'other' : 'noun',
    noun_class: null,
    pronunciation: '',
    example: kind === 'word' ? { rw: '', en: '' } : null,
    breakdown: null,
    rank,
    tier: kind === 'phrase' ? Math.floor((rank - 1) / 25) + 1 : rank <= 100 ? 1 : 2,
    status: 'reviewed',
    source: EDITED,
    updated_at: '',
    retired: false,
  };
}

function blankForm(itemId: string, isBase: boolean): ItemForm {
  return {
    id: crypto.randomUUID(),
    item_id: itemId,
    text: '',
    en: '',
    is_base: isBase,
    number: null,
    person: null,
    tense: null,
    verb_level: null,
    audio_path: null,
    audio_source: null,
    source: EDITED,
    status: 'reviewed',
    updated_at: '',
    retired: false,
  };
}

/** "amakuru = news" lines, one gloss per line. */
const breakdownText = (b: Gloss[] | null) => (b ?? []).map((g) => `${g.rw} = ${g.en}`).join('\n');
const parseBreakdown = (text: string): Gloss[] | null => {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;
  return lines.map((l) => {
    const [rw = '', ...en] = l.split('=');
    return { rw: rw.trim(), en: en.join('=').trim() };
  });
};

export function AdminItem() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [item, setItem] = useState<Item | null>(null);
  const [forms, setForms] = useState<ItemForm[]>([]);
  const [saved, setSaved] = useState<{ ids: Set<string>; texts: Map<string, string> }>({
    ids: new Set(),
    texts: new Map(),
  });
  const [clips, setClips] = useState<Clip[]>([]);
  const [breakdown, setBreakdown] = useState('');
  const [problems, setProblems] = useState<ContentProblem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (isNew) {
        const kind = params.get('kind') === 'phrase' ? 'phrase' : 'word';
        const all = await listItems();
        const rank = Math.max(0, ...all.filter((i) => i.kind === kind).map((i) => i.rank)) + 1;
        const fresh = blankItem(kind, rank);
        if (!alive) return;
        setItem(fresh);
        setForms([blankForm(fresh.id, true)]);
        setBreakdown('');
        return;
      }
      const data = await loadItem(id!);
      if (!alive) return;
      setItem(data.item);
      setForms(data.forms.sort((a, b) => Number(b.is_base) - Number(a.is_base)));
      setSaved({
        ids: new Set(data.forms.map((f) => f.id)),
        texts: new Map(data.forms.map((f) => [f.id, f.text])),
      });
      setClips(data.clips);
      setBreakdown(breakdownText(data.item.breakdown));
    };
    load().catch((e: unknown) => alive && setError(errorText(e)));
    return () => {
      alive = false;
    };
  }, [id, isNew, params, reload]);

  if (!item) {
    return (
      <AdminShell title="Edit" back="/admin">
        <ErrorLine error={error} />
      </AdminShell>
    );
  }

  const patch = (p: Partial<Item>) => setItem({ ...item, ...p });
  const patchForm = (formId: string, p: Partial<ItemForm>) =>
    setForms(forms.map((f) => (f.id === formId ? { ...f, ...p } : f)));
  const setBase = (formId: string) =>
    setForms(forms.map((f) => ({ ...f, is_base: f.id === formId })));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatus(null);
    const next: Item = { ...item, breakdown: parseBreakdown(breakdown) };
    const found = checkItem(next, forms);
    setProblems(found);
    if (found.length > 0) return;
    setBusy(true);
    try {
      await saveItem(next, forms, saved.ids, isNew);
      setStatus('Saved. Learners get the change on their next sync.');
      if (isNew) navigate(`/admin/items/${next.id}`, { replace: true });
      else setReload((r) => r + 1);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const voice = async (formIds: string[]) => {
    setError(null);
    setBusy(true);
    try {
      await makeAudio(formIds, (done) => setStatus(`Made audio for ${done} of ${formIds.length}.`));
      setReload((r) => r + 1);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const savedForms = forms.filter((f) => saved.ids.has(f.id) && !f.retired);
  const isWord = item.kind === 'word';

  return (
    <AdminShell title={isNew ? `New ${item.kind}` : item.base} back="/admin">
      <form className="stack" onSubmit={(e) => void save(e)}>
        <section className="panel form" aria-labelledby="item-title">
          <h2 id="item-title" className="h2-bold">
            {isWord ? 'Word' : 'Phrase'}
          </h2>
          <p className="body-small">Source: {item.source}</p>
          <TextField
            label="Kinyarwanda"
            lang="rw"
            value={item.base}
            onChange={(base) => patch({ base })}
          />
          <TextField label="Meaning" value={item.en} onChange={(en) => patch({ en })} />
          <div className="admin-pair">
            <TextField
              label="Pronunciation guide"
              value={item.pronunciation}
              onChange={(pronunciation) => patch({ pronunciation })}
            />
            <button
              type="button"
              className="btn btn-missed"
              onClick={() => patch({ pronunciation: syllables(item.base) })}
            >
              From spelling
            </button>
          </div>
          {isWord ? (
            <>
              <label className="field">
                <span className="body-small-bold">Word type</span>
                <select
                  className="field-input field-select"
                  value={item.word_type}
                  onChange={(e) => patch({ word_type: e.target.value as Item['word_type'] })}
                >
                  <option value="noun">Noun</option>
                  <option value="verb">Verb</option>
                  <option value="other">Other</option>
                </select>
              </label>
              {item.word_type === 'noun' ? (
                <TextField
                  label="Noun class, such as 1/2"
                  value={item.noun_class ?? ''}
                  onChange={(v) => patch({ noun_class: v.trim() || null })}
                />
              ) : null}
              <TextField
                label="Example sentence"
                lang="rw"
                value={item.example?.rw ?? ''}
                onChange={(rw) => patch({ example: { rw, en: item.example?.en ?? '' } })}
              />
              <TextField
                label="Example in English"
                value={item.example?.en ?? ''}
                onChange={(en) => patch({ example: { rw: item.example?.rw ?? '', en } })}
              />
            </>
          ) : (
            <label className="field">
              <span className="body-small-bold">Word by word, one per line: amakuru = news</span>
              <textarea
                className="field-input"
                rows={4}
                value={breakdown}
                onChange={(e) => setBreakdown(e.target.value)}
              />
            </label>
          )}
          <div className="admin-pair">
            <NumberField
              label="Rank"
              value={item.rank}
              onChange={(rank) => patch({ rank: rank ?? 0 })}
            />
            <NumberField
              label="Tier"
              value={item.tier}
              onChange={(tier) => patch({ tier: tier ?? 0 })}
            />
          </div>
          <StatusField value={item.status} onChange={(s) => patch({ status: s })} />
          <label className="admin-check body">
            <input
              type="checkbox"
              checked={item.retired}
              onChange={(e) => patch({ retired: e.target.checked })}
            />{' '}
            Retired: take it out of the course
          </label>
        </section>

        <section className="panel" aria-labelledby="forms-title">
          <h2 id="forms-title" className="h2-bold">
            Forms
          </h2>
          <p className="body-small">
            The first form is shown when the {item.kind} is introduced. Verbs need a present-tense
            form for every person.
          </p>
          {forms.map((f, n) => (
            <FormEditor
              key={f.id}
              n={n + 1}
              form={f}
              isVerb={item.word_type === 'verb'}
              isNoun={item.word_type === 'noun'}
              textChanged={saved.texts.has(f.id) && saved.texts.get(f.id) !== f.text}
              clips={clips.filter((c) => c.form_id === f.id)}
              canVoice={saved.ids.has(f.id) && !busy}
              onChange={(p) => patchForm(f.id, p)}
              onBase={() => setBase(f.id)}
              onVoice={() => void voice([f.id])}
            />
          ))}
          <button
            type="button"
            className="btn btn-missed"
            onClick={() => setForms([...forms, blankForm(item.id, forms.length === 0)])}
          >
            Add a form
          </button>
          {savedForms.length > 0 ? (
            <button
              type="button"
              className="btn btn-missed"
              disabled={busy}
              onClick={() => void voice(savedForms.map((f) => f.id))}
            >
              Make audio for every form
            </button>
          ) : null}
        </section>

        {problems.length > 0 ? (
          <section className="panel" role="alert" aria-labelledby="problems-title">
            <h2 id="problems-title" className="h3-bold">
              Fix these before saving
            </h2>
            <ul className="body">
              {problems.map((p, i) => (
                <li key={i}>{p.message}</li>
              ))}
            </ul>
          </section>
        ) : null}
        <ErrorLine error={error} />
        {status ? (
          <p className="body" role="status">
            {status}
          </p>
        ) : null}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Working…' : 'Save'}
        </button>
      </form>
    </AdminShell>
  );
}

function FormEditor({
  n,
  form,
  isVerb,
  isNoun,
  textChanged,
  clips,
  canVoice,
  onChange,
  onBase,
  onVoice,
}: {
  n: number;
  form: ItemForm;
  isVerb: boolean;
  isNoun: boolean;
  textChanged: boolean;
  clips: Clip[];
  canVoice: boolean;
  onChange: (p: Partial<ItemForm>) => void;
  onBase: () => void;
  onVoice: () => void;
}) {
  const audio = form.audio_path;
  return (
    <fieldset className="admin-form">
      <legend className="body-bold">
        Form {n}
        {form.retired ? ' (retired)' : ''}
      </legend>
      <TextField
        label="Kinyarwanda"
        lang="rw"
        value={form.text}
        onChange={(text) => onChange({ text })}
      />
      <TextField label="Meaning of this form" value={form.en} onChange={(en) => onChange({ en })} />
      <label className="admin-check body">
        <input type="radio" name="base-form" checked={form.is_base} onChange={onBase} /> First form
      </label>
      {isNoun ? (
        <label className="field">
          <span className="body-small-bold">Number</span>
          <select
            className="field-input field-select"
            value={form.number ?? ''}
            onChange={(e) => onChange({ number: (e.target.value || null) as ItemForm['number'] })}
          >
            <option value="">None</option>
            <option value="singular">Singular</option>
            <option value="plural">Plural</option>
          </select>
        </label>
      ) : null}
      {isVerb ? (
        <div className="admin-pair">
          <label className="field">
            <span className="body-small-bold">Who</span>
            <select
              className="field-input field-select"
              value={form.person ?? ''}
              onChange={(e) => onChange({ person: e.target.value || null })}
            >
              {PERSONS.map(([v, name]) => (
                <option key={v} value={v}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <TextField
            label="Tense"
            value={form.tense ?? ''}
            onChange={(v) => onChange({ tense: v.trim() || null })}
          />
          <NumberField
            label="Verb level"
            value={form.verb_level}
            onChange={(verb_level) => onChange({ verb_level })}
          />
        </div>
      ) : null}
      <StatusField value={form.status} onChange={(status) => onChange({ status })} />
      <label className="admin-check body">
        <input
          type="checkbox"
          checked={form.retired}
          onChange={(e) => onChange({ retired: e.target.checked })}
        />{' '}
        Retired
      </label>
      <div className="admin-audio">
        {audio ? (
          <button type="button" className="btn btn-missed" onClick={() => playAudio(audio)}>
            Play audio
          </button>
        ) : (
          <p className="body-small">No audio yet.</p>
        )}
        <button type="button" className="btn btn-missed" disabled={!canVoice} onClick={onVoice}>
          {audio ? 'Make again' : 'Make audio'}
        </button>
      </div>
      {form.audio_source ? <p className="body-small">Voice: {form.audio_source}</p> : null}
      {textChanged && audio ? (
        <p className="body-small-bold">
          The audio says the old text. Save, then make the audio again.
        </p>
      ) : null}
      {clips.length > 1 ? (
        <details className="body-small">
          <summary>Earlier clips ({clips.length - 1})</summary>
          <ul>
            {clips.slice(1).map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className="report-link body-small"
                  onClick={() => playAudio(c.path)}
                >
                  Play
                </button>{' '}
                {c.source}, {new Date(c.created_at).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </fieldset>
  );
}

function TextField({
  label,
  value,
  onChange,
  lang,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  lang?: string;
}) {
  return (
    <label className="field">
      <span className="body-small-bold">{label}</span>
      <input
        className="field-input"
        lang={lang}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  /** Null when the field is cleared. */
  onChange: (v: number | null) => void;
}) {
  return (
    <label className="field">
      <span className="body-small-bold">{label}</span>
      <input
        className="field-input"
        type="number"
        inputMode="numeric"
        min={1}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      />
    </label>
  );
}

function StatusField({
  value,
  onChange,
}: {
  value: ContentStatus;
  onChange: (s: ContentStatus) => void;
}) {
  return (
    <label className="field">
      <span className="body-small-bold">Status</span>
      <select
        className="field-input field-select"
        value={value}
        onChange={(e) => onChange(e.target.value as ContentStatus)}
      >
        {STATUSES.map(([v, name]) => (
          <option key={v} value={v}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}
