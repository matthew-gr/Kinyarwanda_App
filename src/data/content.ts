// The course on this device. The app ships with a snapshot so it works offline from the first
// launch; edits made in the admin screens download from Supabase afterwards. A row replaces the
// stored one only when it is newer, so the bundled snapshot never undoes a downloaded edit.

import { learnConfigFor, reconcileOrder, type Deck } from '../engine/learn';
import type { Item, ItemForm, NumberPhrase } from '../engine/types';
import { db, type KinyaDb } from './db';
import { progressChanged } from './signals';
import { supabase } from './supabase';
import bundled from './seed/content.json';
import bundledNumberSeed from './seed/numbers.json';

const PULL_BATCH = 1000;
/** Course changes are rare, so a sync checks for them at most this often unless asked. */
const CHECK_EVERY_MS = 5 * 60_000;
const DECKS: Deck[] = ['words', 'phrases'];

export const bundledItems = bundled.items as Item[];
export const bundledForms = bundled.item_forms as ItemForm[];
export const bundledNumbers = bundledNumberSeed.number_phrases as NumberPhrase[];

const isNewer = (incoming: { updated_at: string }, stored?: { updated_at?: string }) =>
  !stored?.updated_at || Date.parse(incoming.updated_at) > Date.parse(stored.updated_at);

/**
 * Stores newer rows, removes retired ones, and moves saved decks and Review onto the new
 * course. Returns true when anything changed.
 */
export async function applyContent(
  items: readonly Item[],
  forms: readonly ItemForm[],
  d: KinyaDb = db,
): Promise<boolean> {
  return d.transaction(
    'rw',
    [d.items, d.item_forms, d.learn_state, d.review_items, d.review_session],
    async () => {
      const storedItems = await d.items.bulkGet(items.map((i) => i.id));
      const storedForms = await d.item_forms.bulkGet(forms.map((f) => f.id));
      const newItems = items.filter((r, i) => isNewer(r, storedItems[i]));
      const newForms = forms.filter((r, i) => isNewer(r, storedForms[i]));
      if (newItems.length === 0 && newForms.length === 0) return false;

      await d.items.bulkPut(newItems.filter((r) => !r.retired));
      await d.items.bulkDelete(newItems.filter((r) => r.retired).map((r) => r.id));
      await d.item_forms.bulkPut(newForms.filter((r) => !r.retired));
      await d.item_forms.bulkDelete(newForms.filter((r) => r.retired).map((r) => r.id));

      // Forms of a retired item go with it.
      const gone = newItems.filter((r) => r.retired).map((r) => r.id);
      if (gone.length > 0) await d.item_forms.where('item_id').anyOf(gone).delete();

      if (newItems.length > 0) await reconcile(d);
      return true;
    },
  );
}

/** Saved decks follow the course; Review drops items that left it. */
async function reconcile(d: KinyaDb): Promise<void> {
  const all = await d.items.toArray();
  const live = new Set(all.map((i) => i.id));
  for (const deck of DECKS) {
    const row = await d.learn_state.get(deck);
    if (!row) continue;
    const kind = deck === 'words' ? 'word' : 'phrase';
    const items = all.filter((i) => i.kind === kind);
    const state = reconcileOrder({ ...row.state, config: learnConfigFor(deck) }, items);
    if (state !== row.state) {
      await d.learn_state.put({ ...row, state, updated_at: new Date().toISOString() });
    }
  }
  const orphans = (await d.review_items.toArray()).filter((r) => !live.has(r.item_id));
  await d.review_items.bulkDelete(orphans.map((r) => r.item_id));
  const session = await d.review_session.get('current');
  if (session?.card && !live.has(session.card.item_id)) {
    await d.review_session.put({ ...session, card: null });
  }
}

/** Stores newer numbers and removes retired ones. Returns true when anything changed. */
export async function applyNumbers(
  rows: readonly NumberPhrase[],
  d: KinyaDb = db,
): Promise<boolean> {
  return d.transaction('rw', d.number_phrases, async () => {
    const stored = await d.number_phrases.bulkGet(rows.map((r) => r.id));
    const fresh = rows.filter((r, i) => isNewer(r, stored[i]));
    if (fresh.length === 0) return false;
    await d.number_phrases.bulkPut(fresh.filter((r) => !r.retired));
    await d.number_phrases.bulkDelete(fresh.filter((r) => r.retired).map((r) => r.id));
    return true;
  });
}

const newestStamp = (rows: readonly { updated_at: string }[], from = '') =>
  rows
    .map((r) => new Date(r.updated_at).toISOString())
    .reduce((max, t) => (t > max ? t : max), from);

/** Loads the bundled snapshot. Cheap when the device already has it. */
export async function ensureSeeded(d: KinyaDb = db): Promise<void> {
  await applyNumbers(bundledNumbers, d);
  if (!(await d.content_state.get('numbers'))) {
    await d.content_state.put({
      id: 'numbers',
      cursor: newestStamp(bundledNumbers) || null,
      last_checked_at: null,
    });
  }
  await applyContent(bundledItems, bundledForms, d);
  if (!(await d.content_state.get('main'))) {
    const newest = [...bundledItems, ...bundledForms].reduce(
      (max, r) => (r.updated_at > max ? r.updated_at : max),
      '',
    );
    await d.content_state.put({ id: 'main', cursor: newest || null, last_checked_at: null });
  }
}

async function pullTable<T extends { updated_at: string }>(
  table: 'items' | 'item_forms' | 'number_phrases',
  since: string | null,
): Promise<T[]> {
  const rows: T[] = [];
  let from = since;
  for (;;) {
    let q = supabase!.from(table).select('*').order('updated_at').order('id').limit(PULL_BATCH);
    if (from) q = q.gt('updated_at', from);
    const { data, error } = await q;
    if (error) throw error;
    const page = (data ?? []) as T[];
    rows.push(...page);
    if (page.length < PULL_BATCH) return rows;
    from = page[page.length - 1]!.updated_at;
  }
}

/** Server rows come back with Postgres timestamps; the device stores ISO strings. */
const iso = <T extends { updated_at: string }>(r: T): T => ({
  ...r,
  updated_at: new Date(r.updated_at).toISOString(),
});

let pulling: Promise<void> | null = null;

/**
 * Downloads course changes. Works signed out; does nothing offline or without Supabase. Skips
 * the check when one ran in the last few minutes, unless `force` is set.
 */
export function pullContent(d: KinyaDb = db, force = false): Promise<void> {
  if (!supabase || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return Promise.resolve();
  }
  pulling ??= (async () => {
    try {
      const state = (await d.content_state.get('main')) ?? {
        id: 'main' as const,
        cursor: null,
        last_checked_at: null,
      };
      const last = state.last_checked_at ? Date.parse(state.last_checked_at) : 0;
      if (!force && Date.now() - last < CHECK_EVERY_MS) return;
      const [items, forms] = await Promise.all([
        pullTable<Item>('items', state.cursor),
        pullTable<ItemForm>('item_forms', state.cursor),
      ]);
      const changed = await applyContent(items.map(iso), forms.map(iso), d);
      await d.content_state.put({
        ...state,
        cursor: newestStamp([...items, ...forms], state.cursor ?? '') || null,
        last_checked_at: new Date().toISOString(),
      });
      // Numbers keep their own place, since their table arrived after the course's.
      const numberState = (await d.content_state.get('numbers')) ?? {
        id: 'numbers' as const,
        cursor: null,
        last_checked_at: null,
      };
      const numbers = await pullTable<NumberPhrase>('number_phrases', numberState.cursor);
      const numbersChanged = await applyNumbers(numbers.map(iso), d);
      await d.content_state.put({
        ...numberState,
        cursor: newestStamp(numbers, numberState.cursor ?? '') || null,
        last_checked_at: new Date().toISOString(),
      });
      if (changed || numbersChanged) progressChanged.emit();
    } finally {
      pulling = null;
    }
  })();
  return pulling;
}
