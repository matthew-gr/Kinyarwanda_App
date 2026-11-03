// The admin screens' data. Admins edit the server's copy of the course directly; learners'
// devices pick the changes up on their next sync. The database's rules decide who is an admin,
// so these calls fail for anyone else whatever the screens show.

import type { Item, ItemForm } from '../engine/types';
import { pullContent } from './content';
import { supabase } from './supabase';

export interface ReportView {
  id: string;
  /** Null for a report on a story. */
  item_id: string | null;
  form_id: string | null;
  story_id?: string | null;
  module: 'learn' | 'review' | 'stories';
  shown_text: string;
  message: string;
  created_at: string;
  resolved_at: string | null;
  resolution: string | null;
  item: { base: string; kind: Item['kind'] } | null;
}

export interface Clip {
  id: string;
  form_id: string;
  path: string;
  source: string;
  status: string;
  created_at: string;
}

export interface SampleVoice {
  provider: 'elevenlabs' | 'pindo';
  voice_id?: string;
  model_id?: string;
  /** Pindo's speech rate, 0.5 to 2. */
  speech_rate?: number;
  label: string;
  /** Write each word's stressed syllable in capitals for the voice. */
  stress?: boolean;
}

/** A readable message from anything thrown, including Supabase's error objects. */
export const errorText = (e: unknown) =>
  e instanceof Error
    ? e.message
    : typeof e === 'object' && e && 'message' in e
      ? String(e.message)
      : String(e);

function client() {
  if (!supabase) throw new Error('Accounts are not set up in this build.');
  return supabase;
}

/** True when the signed-in person is on the admins list. */
export async function isAdmin(): Promise<boolean> {
  if (!supabase) return false;
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) return false;
  const { data } = await supabase.from('admins').select('user_id').eq('user_id', userId);
  return (data ?? []).length > 0;
}

/** The server sends at most 1,000 rows per query, so longer lists are fetched a page at a time. */
async function allRows<T>(
  page: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: unknown }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await page(from, from + 999);
    if (error) throw error;
    rows.push(...((data ?? []) as T[]));
    if ((data ?? []).length < 1000) return rows;
  }
}

export function listItems(): Promise<Item[]> {
  return allRows<Item>((from, to) =>
    client()
      .from('items')
      .select('*')
      .order('kind', { ascending: false })
      .order('rank')
      .order('id')
      .range(from, to),
  );
}

/** Every form's item and audio, for the course list. */
export function listFormAudio(): Promise<
  Pick<ItemForm, 'id' | 'item_id' | 'audio_path' | 'retired'>[]
> {
  return allRows((from, to) =>
    client()
      .from('item_forms')
      .select('id, item_id, audio_path, retired')
      .order('id')
      .range(from, to),
  );
}

export async function loadItem(
  id: string,
): Promise<{ item: Item; forms: ItemForm[]; clips: Clip[] }> {
  const c = client();
  const [item, forms] = await Promise.all([
    c.from('items').select('*').eq('id', id).single(),
    c.from('item_forms').select('*').eq('item_id', id),
  ]);
  if (item.error) throw item.error;
  if (forms.error) throw forms.error;
  const formRows = (forms.data ?? []) as ItemForm[];
  const clips = await c
    .from('audio_clips')
    .select('*')
    .in(
      'form_id',
      formRows.map((f) => f.id),
    )
    .order('created_at', { ascending: false });
  if (clips.error) throw clips.error;
  return { item: item.data as Item, forms: formRows, clips: (clips.data ?? []) as Clip[] };
}

const ITEM_FIELDS = [
  'base',
  'en',
  'word_type',
  'noun_class',
  'pronunciation',
  'example',
  'breakdown',
  'rank',
  'tier',
  'status',
  'source',
  'retired',
] as const;

const FORM_FIELDS = [
  'text',
  'en',
  'is_base',
  'number',
  'person',
  'tense',
  'verb_level',
  'status',
  'source',
  'retired',
] as const;

const pick = <T extends object, K extends keyof T>(row: T, keys: readonly K[]) =>
  Object.fromEntries(keys.map((k) => [k, row[k]])) as Pick<T, K>;

/**
 * Saves an item and its forms: rows the server has are updated, new rows are added. Then this
 * device downloads the change like any other.
 */
export async function saveItem(
  item: Item,
  forms: ItemForm[],
  existingFormIds: ReadonlySet<string>,
  isNew: boolean,
): Promise<void> {
  const c = client();
  const itemRow = pick(item, ITEM_FIELDS);
  const saved = isNew
    ? await c.from('items').insert({ id: item.id, kind: item.kind, ...itemRow })
    : await c.from('items').update(itemRow).eq('id', item.id);
  if (saved.error) throw saved.error;

  for (const f of forms) {
    const row = pick(f, FORM_FIELDS);
    const res = existingFormIds.has(f.id)
      ? await c.from('item_forms').update(row).eq('id', f.id)
      : await c.from('item_forms').insert({ id: f.id, item_id: item.id, ...row });
    if (res.error) throw res.error;
  }
  await pullContent(undefined, true);
}

export async function listReports(includeResolved: boolean): Promise<ReportView[]> {
  let q = client()
    .from('reports')
    .select('*, item:items(base, kind)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (!includeResolved) q = q.is('resolved_at', null);
  const { data, error } = await q;
  if (error) throw error;
  return data as ReportView[];
}

export async function resolveReport(id: string, resolution: string): Promise<void> {
  const c = client();
  const { data: session } = await c.auth.getSession();
  const { error } = await c
    .from('reports')
    .update({
      resolved_at: new Date().toISOString(),
      resolved_by: session.session?.user.id ?? null,
      resolution: resolution.trim() || null,
    })
    .eq('id', id);
  if (error) throw error;
}

async function callAudio<T>(body: object): Promise<T> {
  const { data, error } = await client().functions.invoke('generate-audio', { body });
  if (error) {
    // The function's own message is more useful than the generic HTTP one.
    const ctx = (error as { context?: Response }).context;
    const detail = ctx ? ((await ctx.json().catch(() => null)) as { error?: string } | null) : null;
    throw new Error(detail?.error ?? error.message);
  }
  return data as T;
}

/** What one call to the audio function did: its requests to the voice, and what failed. */
export interface AudioBatch {
  requests?: number;
  failed?: { id: string; error: string }[];
  /** How each batch of items said together went. */
  notes?: string[];
  /** Set when the voice ran out of credit; nothing more is sent. */
  stopped?: string;
  provider?: string;
}

/**
 * Sends ids to the audio function 25 at a time. Ends early, with the reason, when the voice
 * runs out of credit or `stop` says so; either way the clips made so far are kept.
 */
async function voiceInGroups(
  action: 'forms' | 'numbers',
  ids: string[],
  onProgress?: (done: number, batch: AudioBatch) => void,
  stop?: () => boolean,
): Promise<string | null> {
  let why: string | null = null;
  for (let i = 0; i < ids.length; i += 25) {
    if (stop?.()) {
      why = 'Stopped.';
      break;
    }
    const slice = ids.slice(i, i + 25);
    const batch = await callAudio<AudioBatch>(
      action === 'forms' ? { action, form_ids: slice } : { action, number_ids: slice },
    );
    onProgress?.(Math.min(ids.length, i + 25), batch ?? {});
    if (batch?.stopped) {
      why = batch.stopped;
      break;
    }
  }
  await pullContent(undefined, true);
  return why;
}

/** Voices forms with the chosen voice, a few per call so no call runs too long. */
export const makeAudio = (
  formIds: string[],
  onProgress?: (done: number, batch: AudioBatch) => void,
  stop?: () => boolean,
) => voiceInGroups('forms', formIds, onProgress, stop);

/** Every drill number's audio, for the audio count. */
export function listNumberAudio(): Promise<
  { id: string; audio_path: string | null; retired: boolean }[]
> {
  return allRows((from, to) =>
    client().from('number_phrases').select('id, audio_path, retired').order('id').range(from, to),
  );
}

/** Voices the drills' numbers, like makeAudio does for course forms. */
export const makeNumberAudio = (
  ids: string[],
  onProgress?: (done: number, batch: AudioBatch) => void,
  stop?: () => boolean,
) => voiceInGroups('numbers', ids, onProgress, stop);

export function listVoices() {
  return callAudio<{
    voices: { voice_id: string; name: string; labels: Record<string, string> }[];
  }>({ action: 'voices' });
}

export function makeSample(voice: SampleVoice, items: { key: string; text: string }[]) {
  return callAudio<{
    label: string;
    clips: { key: string; url: string }[];
    failed?: { key: string; error: string }[];
    /** Requests the voice was sent; for a batched voice, 1 means the batch cut cleanly. */
    requests?: number;
    /** For a batched voice, how each batch went. */
    notes?: string[];
    /** Set when the voice ran out of credit. */
    stopped?: string;
  }>({
    action: 'sample',
    voice,
    items,
  });
}
