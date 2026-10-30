// Report a mistake. A report is saved on the device first and sent with the next sync, so it
// is never lost offline. Anyone can send one, signed in or not.

import { db, type KinyaDb, type ReportRow } from './db';
import { supabase } from './supabase';

export type NewReport = Pick<
  ReportRow,
  'item_id' | 'form_id' | 'module' | 'shown_text' | 'message'
>;

export async function saveReport(report: NewReport, d: KinyaDb = db): Promise<void> {
  await d.reports.add({
    ...report,
    message: report.message.trim().slice(0, 1000),
    shown_text: report.shown_text.slice(0, 500),
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    synced: 0,
  });
}

/** Sends waiting reports. A report the server already has counts as sent. */
export async function sendReports(d: KinyaDb = db): Promise<void> {
  if (!supabase) return;
  const waiting = await d.reports.where('synced').equals(0).toArray();
  if (waiting.length === 0) return;
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id ?? null;
  for (const r of waiting) {
    const { error } = await supabase.from('reports').insert({
      id: r.id,
      user_id: userId,
      item_id: r.item_id,
      form_id: r.form_id,
      module: r.module,
      shown_text: r.shown_text,
      message: r.message,
    });
    if (error && error.code !== '23505') throw error;
    await d.reports.update(r.id, { synced: 1 });
  }
}
