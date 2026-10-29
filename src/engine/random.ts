// Seeded random numbers, so every rule that shuffles or picks can be tested exactly.

export interface Rng {
  /** A float in [0, 1). */
  next(): number;
  /** A version 4 UUID. */
  uuid(): string;
}

/** mulberry32: small, fast and good enough for shuffling cards. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function uuidFrom(byte: () => number): string {
  const b = Array.from({ length: 16 }, byte);
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const hex = b.map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Fully deterministic: the same seed gives the same numbers and the same UUIDs. For tests. */
export function createSeededRng(seed: number): Rng {
  const next = mulberry32(seed);
  return { next, uuid: () => uuidFrom(() => Math.floor(next() * 256)) };
}

/**
 * Seeded shuffles, but UUIDs from the platform so card view IDs stay globally unique
 * once answers sync between devices.
 */
export function createAppRng(
  seed: number = crypto.getRandomValues(new Uint32Array(1))[0]!,
  uuid: () => string = () => crypto.randomUUID(),
): Rng {
  return { next: mulberry32(seed), uuid };
}

/** Fisher-Yates shuffle into a new array. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export function pickOne<T>(items: readonly T[], rng: Rng): T {
  if (items.length === 0) throw new Error('pickOne: empty list');
  return items[Math.floor(rng.next() * items.length)]!;
}
