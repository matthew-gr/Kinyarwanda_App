// Pictures and recordings for the learner's own words (decision 188). Each file is kept on this
// device, so cards show and play it offline, and uploads to the private my-words bucket on the
// next sync, in a folder named after the learner. Other devices download it when they see the
// word's path. A replaced or removed file is deleted from the server on the next sync.

import { db, type KinyaDb, type MyWordMediaRow } from './db';
import { supabase } from './supabase';

export const BUCKET = 'my-words';
/** A photo is shrunk so its longer side is at most this many pixels. */
export const PICTURE_SIDE = 320;
/** GIFs are kept as they are, so they keep moving, up to this size. */
export const GIF_MAX_BYTES = 1_000_000;
/** The bucket's own limit, for recordings. */
export const FILE_MAX_BYTES = 2_000_000;
export const RECORDING_MAX_MS = 10_000;
export const EMOJI_MAX = 16;

export type MediaKind = MyWordMediaRow['kind'];

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'audio/webm': 'webm',
  'audio/mp4': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
};

/** The file's type without parameters: audio/webm;codecs=opus is audio/webm. */
export const baseType = (type: string) => type.split(';')[0]!.trim().toLowerCase();

/** What is wrong with an emoji the learner typed, or null. One to three emoji, nothing else. */
export function emojiProblem(text: string): string | null {
  const t = text.trim();
  if (!t) return null;
  const parts = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(t)]
    .map((s) => s.segment)
    .filter((p) => !/^\s+$/.test(p));
  if (!parts.every((p) => /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(p)))
    return 'Only emoji go in this box. Put words in English.';
  if (parts.length > 3 || t.length > EMOJI_MAX) return 'Use one to three emoji.';
  return null;
}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That file could not be opened as a picture.'));
    };
    img.src = url;
  });
}

const toBlob = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));

/**
 * A picture ready to keep: a GIF as it is (so it still moves), anything else shrunk on this
 * device to a JPEG at most PICTURE_SIDE pixels on its longer side, about 20 to 40 KB.
 */
export async function pictureFromFile(file: Blob): Promise<Blob> {
  if (baseType(file.type) === 'image/gif') {
    if (file.size > GIF_MAX_BYTES) throw new Error('GIFs can be up to 1 MB. Try a smaller one.');
    return file;
  }
  if (!file.type.startsWith('image/')) throw new Error('Choose a picture or a GIF.');
  const img = await loadImage(file);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (!w || !h) throw new Error('That picture is empty.');
  const scale = Math.min(1, PICTURE_SIDE / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser cannot resize pictures.');
  // A see-through picture gets a white background, as JPEG has none.
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  for (const quality of [0.82, 0.65]) {
    const blob = await toBlob(canvas, quality);
    if (blob && blob.size <= 200_000) return blob;
  }
  throw new Error('That picture could not be saved. Try another one.');
}

/** Checks a recording before it is kept. */
export function recordingProblem(blob: Blob): string | null {
  if (blob.size === 0) return 'Nothing was recorded. Check the microphone and try again.';
  if (blob.size > FILE_MAX_BYTES) return 'That recording is too long. Keep it under 10 seconds.';
  return null;
}

/** A new path for a word's file, below the learner's folder: a new name for every change. */
export function newPath(wordId: string, kind: MediaKind, type: string): string {
  const ext = EXT[baseType(type)] ?? (kind === 'audio' ? 'webm' : 'jpg');
  return `${wordId}/${kind}-${crypto.randomUUID()}.${ext}`;
}

/**
 * Puts a word's new file in place of its old one, inside the caller's transaction (which must
 * include my_word_media). Returns the new path, or null when the file is removed.
 */
export async function replaceMedia(
  d: KinyaDb,
  wordId: string,
  kind: MediaKind,
  oldPath: string | null | undefined,
  blob: Blob | null,
): Promise<string | null> {
  if (oldPath) await dropMedia(d, oldPath);
  if (!blob) return null;
  const path = newPath(wordId, kind, blob.type);
  await d.my_word_media.put({ path, word_id: wordId, kind, blob, uploaded: 0, deleted: 0 });
  return path;
}

/** Forgets a file here, and marks it to go from the server if the server has it. */
export async function dropMedia(d: KinyaDb, path: string): Promise<void> {
  const row = await d.my_word_media.get(path);
  if (row && !row.uploaded) await d.my_word_media.delete(path);
  else
    await d.my_word_media.put({
      ...(row ?? { path, word_id: '', kind: 'picture' }),
      blob: null,
      uploaded: 1,
      deleted: 1,
    });
}

/** Object URLs for files on this device, by path. A path's file never changes, so they keep. */
const urls = new Map<string, string>();

/** The URL to show or play a word's file, if this device has it. */
export async function mediaUrls(
  paths: readonly (string | null | undefined)[],
  d: KinyaDb = db,
): Promise<Map<string, string>> {
  const want = [...new Set(paths.filter((p): p is string => !!p))];
  const out = new Map<string, string>();
  const missing = want.filter((p) => {
    const u = urls.get(p);
    if (u) out.set(p, u);
    return !u;
  });
  if (missing.length === 0 || typeof URL.createObjectURL !== 'function') return out;
  const rows = await d.my_word_media.bulkGet(missing);
  for (const r of rows) {
    if (!r?.blob || r.deleted) continue;
    const u = URL.createObjectURL(r.blob);
    urls.set(r.path, u);
    out.set(r.path, u);
  }
  return out;
}

/** The server's name for a file: the learner's folder, then the path. */
const objectName = (userId: string, path: string) => `${userId}/${path}`;

/** Uploads new files and removes replaced ones. Files must be on the server before their word. */
export async function pushMedia(userId: string, d: KinyaDb = db): Promise<void> {
  const storage = supabase!.storage.from(BUCKET);
  const gone = await d.my_word_media.where('deleted').equals(1).toArray();
  if (gone.length > 0) {
    const { error } = await storage.remove(gone.map((m) => objectName(userId, m.path)));
    if (error) throw error;
    await d.my_word_media.bulkDelete(gone.map((m) => m.path));
  }
  const fresh = await d.my_word_media.where('uploaded').equals(0).toArray();
  for (const m of fresh) {
    if (!m.blob || m.deleted) continue;
    const { error } = await storage.upload(objectName(userId, m.path), m.blob, {
      contentType: baseType(m.blob.type) || undefined,
      upsert: true,
    });
    if (error) throw error;
    await d.my_word_media.update(m.path, { uploaded: 1 });
  }
}

/** Downloads files for words that name one this device doesn't have. Returns how many. */
export async function pullMedia(userId: string, d: KinyaDb = db): Promise<number> {
  const storage = supabase!.storage.from(BUCKET);
  const words = await d.my_words.filter((w) => !w.deleted).toArray();
  const wanted = words.flatMap((w) => [
    ...(w.picture_path ? [{ path: w.picture_path, word_id: w.id, kind: 'picture' as const }] : []),
    ...(w.audio_path ? [{ path: w.audio_path, word_id: w.id, kind: 'audio' as const }] : []),
  ]);
  if (wanted.length === 0) return 0;
  const have = await d.my_word_media.bulkGet(wanted.map((w) => w.path));
  let got = 0;
  for (const [i, w] of wanted.entries()) {
    if (have[i]) continue;
    const { data, error } = await storage.download(objectName(userId, w.path));
    // A file not uploaded yet by the device that made it: try again next time.
    if (error || !data) continue;
    await d.my_word_media.put({ ...w, blob: data, uploaded: 1, deleted: 0 });
    got++;
  }
  return got;
}
