// Invite only, while the app is tested: whether the signed-in person is a member, joining with
// an invite code, and inviting others. The server function `invites` does the checking.

import { cleanEmail, cleanInviteCode } from '../../supabase/functions/_shared/invite';
import { supabase } from './supabase';

/**
 * On unless a build sets VITE_INVITE_ONLY=false, as the browser tests do, so a build can't
 * open by accident.
 */
export const INVITE_ONLY = import.meta.env.VITE_INVITE_ONLY !== 'false';

const MEMBER_KEY = 'kinyarwanda.member';

/** The account last confirmed as a member on this device, so the app opens offline. */
function cachedMember(): string | null {
  try {
    return localStorage.getItem(MEMBER_KEY);
  } catch {
    return null;
  }
}

function cacheMember(userId: string | null): void {
  try {
    if (userId) localStorage.setItem(MEMBER_KEY, userId);
    else localStorage.removeItem(MEMBER_KEY);
  } catch {
    // Storage blocked: membership is checked again next time.
  }
}

export type Access =
  | { state: 'signed-out' }
  | { state: 'not-invited'; email: string | null }
  /** Signed in, but never confirmed on this device and no connection to check. */
  | { state: 'offline' }
  | { state: 'member' };

/** Whether this device may open the app: signed in, and a member. */
export async function checkAccess(): Promise<Access> {
  if (!supabase) return { state: 'member' };
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) {
    cacheMember(null);
    return { state: 'signed-out' };
  }
  if (cachedMember() === user.id) return { state: 'member' };
  const { data: rows, error } = await supabase
    .from('members')
    .select('user_id')
    .eq('user_id', user.id);
  // Until the members table exists on the server, everyone signed in is let in.
  if (error && (error.code === '42P01' || error.code === 'PGRST205')) return { state: 'member' };
  // A device never confirmed can't be checked offline, so it waits for a connection.
  if (error) return { state: 'offline' };
  const member = (rows ?? []).length > 0;
  cacheMember(member ? user.id : null);
  return member ? { state: 'member' } : { state: 'not-invited', email: user.email ?? null };
}

export function forgetAccess(): void {
  cacheMember(null);
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new Error('Accounts are not set up in this build.');
  const { data, error } = await supabase.functions.invoke<T>('invites', { body });
  if (error) {
    const ctx = (error as { context?: Response }).context;
    const said =
      ctx && typeof ctx.json === 'function'
        ? ((await ctx.json().catch(() => null)) as { error?: string } | null)
        : null;
    throw new Error(said?.error ?? 'The invitation service could not be reached. Try again.');
  }
  return data as T;
}

/** Joins with an invite code: makes the account if needed. Signing in by email comes next. */
export async function redeemInvite(code: string, email: string): Promise<void> {
  const clean = cleanInviteCode(code);
  if (!clean) throw new Error('That invite code looks wrong. It has 8 letters and numbers.');
  await call({ action: 'redeem', code: clean, email: cleanEmail(email) });
}

export interface NewInvite {
  code: string;
  link: string;
  emailed: boolean;
}

export const createInvite = (email: string) =>
  call<NewInvite>({ action: 'create', email: email.trim() || undefined });

export interface InviteRow {
  code: string;
  email: string | null;
  created_at: string;
  expires_at: string;
  used_at: string | null;
}

/** The invitations this person has made, newest first. */
export async function listInvites(): Promise<InviteRow[]> {
  if (!supabase) return [];
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) return [];
  const { data, error } = await supabase
    .from('invites')
    .select('code, email, created_at, expires_at, used_at')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as InviteRow[];
}

/** An invite code in the address (?invite=KQ7M-3XPA), from an invitation link. */
export function inviteFromUrl(): string {
  return new URLSearchParams(window.location.search).get('invite') ?? '';
}
