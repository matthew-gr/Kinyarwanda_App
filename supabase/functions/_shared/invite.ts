// Invite codes, shared by the app and the invites server function. No imports, so Deno and
// Vite both load it.

/** Invites each member can make while the app is invite only. Admins have no limit. */
export const INVITES_PER_MEMBER = 2;

/** Letters and digits that can't be mistaken for each other (no 0, O, 1, I or L). */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** A new code, such as KQ7M-3XPA: 8 characters, about 850 billion possibilities. */
export function newInviteCode(random: (n: number) => Uint8Array): string {
  const chars = [...random(8)].map((b) => ALPHABET[b % ALPHABET.length]).join('');
  return `${chars.slice(0, 4)}-${chars.slice(4)}`;
}

/** A code as typed (kq7m 3xpa, KQ7M3XPA) in its stored form, or null if it can't be one. */
export function cleanInviteCode(typed: string): string | null {
  const chars = typed.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (chars.length !== 8 || [...chars].some((c) => !ALPHABET.includes(c))) return null;
  return `${chars.slice(0, 4)}-${chars.slice(4)}`;
}

export const cleanEmail = (typed: string) => typed.trim().toLowerCase();

export const looksLikeEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
