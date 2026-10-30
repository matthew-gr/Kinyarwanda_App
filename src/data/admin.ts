// The admin screens' data. Admins edit the server's copy of the course directly; learners'
// devices pick the changes up on their next sync. The database's rules decide who is an admin,
// so these calls fail for anyone else whatever the screens show.

import type { Item, ItemForm } from '../engine/types';
import { pullContent } from './content';
import { supabase } from './supabase';

export interface ReportView {
  id: string;
  item_id: string;
  form_id: string | null;
  module: 'learn' | 'review';
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
  provider: 'elevenlabs' | 'http';
  voice_id?: string;
  model_id?: string;
  label: string;
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

export async function listItems(): Promise<Item[]> {
  const { data, error } = await client()
    .from('items')
    .select('*')
    .order('kind', { ascending: false })
    .order('rank');
  if (error) throw error;
  return data as Item[];
}

/** Every form's item and audio, for the course list. */
export async function listFormAudio(): Promise<
  Pick<ItemForm, 'id' | 'item_id' | 'audio_path' | 'retired'>[]
> {
  const { data, error } = await client()
    .from('item_forms')
    .select('id, item_id, audio_path, retired')
    .limit(10000);
  if (error) throw error;
  return data as Pick<ItemForm, 'id' | 'item_id' | 'audio_path' | 'retired'>[];
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

/** Voices forms with the chosen voice, a few per call so no call runs too long. */
export async function makeAudio(
  formIds: string[],
  onProgress?: (done: number) => void,
): Promise<void> {
  for (let i = 0; i < formIds.length; i += 25) {
    await callAudio({ action: 'forms', form_ids: formIds.slice(i, i + 25) });
    onProgress?.(Math.min(formIds.length, i + 25));
  }
  await pullContent(undefined, true);
}

export function listVoices() {
  return callAudio<{
    voices: { voice_id: string; name: string; labels: Record<string, string> }[];
  }>({ action: 'voices' });
}

export function makeSample(voice: SampleVoice, items: { key: string; text: string }[]) {
  return callAudio<{ label: string; clips: { key: string; url: string }[] }>({
    action: 'sample',
    voice,
    items,
  });
}
