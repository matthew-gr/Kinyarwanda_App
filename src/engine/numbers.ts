// Kinyarwanda numbers in words: counting, money, phone numbers, and a number agreeing with a
// noun. AI drafts from the rules below, for scripts/draft-numbers.ts to store with a status, so
// a native speaker can correct any of them later without touching this file.

const UNITS = [
  'zeru',
  'rimwe',
  'kabiri',
  'gatatu',
  'kane',
  'gatanu',
  'gatandatu',
  'karindwi',
  'umunani',
  'icyenda',
] as const;

/** 30 to 90 are mirongo with the tens agreeing with it: mirongo itatu. */
const TENS_AGREE = ['', '', '', 'itatu', 'ine', 'itanu', 'itandatu', 'irindwi', 'inani', 'icyenda'];
/** 200 to 900 are magana with the hundreds agreeing with it: magana abiri. */
const HUNDREDS_AGREE = [
  '',
  '',
  'abiri',
  'atatu',
  'ane',
  'atanu',
  'atandatu',
  'arindwi',
  'inani',
  'cyenda',
];
/** 2,000 to 9,000 are ibihumbi with the thousands agreeing with it: ibihumbi bibiri. */
const THOUSANDS_AGREE = [
  '',
  '',
  'bibiri',
  'bitatu',
  'bine',
  'bitanu',
  'bitandatu',
  'birindwi',
  'umunani',
  'icyenda',
];

/** "and": na, or n' before a vowel, as written Kinyarwanda joins them (makumyabiri n'icyenda). */
const and = (word: string) => (/^[aeiou]/.test(word) ? `n'${word}` : `na ${word}`);

function tens(t: number): string {
  if (t === 1) return 'icumi';
  if (t === 2) return 'makumyabiri';
  return `mirongo ${TENS_AGREE[t]}`;
}

function under100(n: number): string {
  if (n < 10) return UNITS[n]!;
  const t = Math.floor(n / 10);
  const u = n % 10;
  if (u === 0) return tens(t);
  // 11 to 19 drop the i of icumi: cumi na rimwe.
  return `${t === 1 ? 'cumi' : tens(t)} ${and(UNITS[u]!)}`;
}

function under1000(n: number): string {
  if (n < 100) return under100(n);
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const hundreds = h === 1 ? 'ijana' : `magana ${HUNDREDS_AGREE[h]}`;
  return rest === 0 ? hundreds : `${hundreds} ${and(under100(rest))}`;
}

/** Thousands this file can say. Above 10,000 only round tens and 100 for now. */
export function canSayThousands(k: number): boolean {
  return k >= 1 && (k <= 10 || (k % 10 === 0 && k <= 100));
}

/** A number as it is said when counting, 0 to 109,999. Throws on thousands it cannot say yet. */
export function sayNumber(n: number): string {
  if (!Number.isInteger(n) || n < 0) throw new Error(`sayNumber: ${n}`);
  if (n < 1000) return under1000(n);
  const k = Math.floor(n / 1000);
  if (!canSayThousands(k)) throw new Error(`sayNumber: no draft rule for ${n}`);
  const rest = n % 1000;
  const thousands =
    k === 1 ? 'igihumbi' : k < 10 ? `ibihumbi ${THOUSANDS_AGREE[k]}` : `ibihumbi ${under1000(k)}`;
  return rest === 0 ? thousands : `${thousands} ${and(under1000(rest))}`;
}

/** A price in Rwandan francs. Only whole hundreds, so no small number has to agree. */
export function sayMoney(n: number): string {
  if (n < 100 || n % 100 !== 0) throw new Error(`sayMoney: only whole hundreds, not ${n}`);
  return `amafaranga ${sayNumber(n)}`;
}

/**
 * A phone number read in groups, the way people say them: a group is read as one number
 * (42 is mirongo ine na kabiri), but a single digit, or a group starting with 0, is read
 * digit by digit. Groups are separated by commas so the voice pauses between them.
 */
export function sayPhone(digits: string, groups: readonly number[]): string {
  if (!/^\d+$/.test(digits)) throw new Error(`sayPhone: ${digits}`);
  if (groups.reduce((a, b) => a + b, 0) !== digits.length) {
    throw new Error(`sayPhone: groups ${groups.join('+')} do not fit ${digits}`);
  }
  const out: string[] = [];
  let at = 0;
  for (const size of groups) {
    const g = digits.slice(at, at + size);
    at += size;
    if (size === 1 || g.startsWith('0')) out.push(...[...g].map((c) => UNITS[Number(c)]!));
    else out.push(sayNumber(Number(g)));
  }
  return out.join(', ');
}

/** The phone number with spaces where the groups break, for showing after an answer. */
export function phoneDisplay(digits: string, groups: readonly number[]): string {
  const out: string[] = [];
  let at = 0;
  for (const size of groups) {
    out.push(digits.slice(at, at + size));
    at += size;
  }
  return out.join(' ');
}

/** "one" agrees with the singular noun's class. */
const ONE: Record<string, string> = {
  '1': 'umwe',
  '3': 'umwe',
  '5': 'rimwe',
  '7': 'kimwe',
  '9': 'imwe',
  '11': 'rumwe',
};

/** 2 to 5 agree with the plural noun's class. */
const TWO_TO_FIVE: Record<string, readonly [string, string, string, string]> = {
  '2': ['babiri', 'batatu', 'bane', 'batanu'],
  '4': ['ibiri', 'itatu', 'ine', 'itanu'],
  '6': ['abiri', 'atatu', 'ane', 'atanu'],
  '8': ['bibiri', 'bitatu', 'bine', 'bitanu'],
  '10': ['ebyiri', 'eshatu', 'enye', 'eshanu'],
};

/** The noun classes this file can count with, as the course writes them ("1/2", "9/10"). */
export function canCountNoun(nounClass: string | null): boolean {
  const [sg, pl] = (nounClass ?? '').split('/');
  return !!sg && !!pl && sg in ONE && pl in TWO_TO_FIVE;
}

/**
 * A noun with a number from 1 to 5 agreeing with it: umuntu umwe, abantu babiri, inka eshatu.
 * `singular` and `plural` are the noun's own forms; 1 takes the singular.
 */
export function sayNounNumber(
  nounClass: string,
  n: number,
  singular: string,
  plural: string,
): string {
  if (!canCountNoun(nounClass)) throw new Error(`sayNounNumber: class ${nounClass}`);
  if (!Number.isInteger(n) || n < 1 || n > 5) throw new Error(`sayNounNumber: ${n}`);
  const [sg, pl] = nounClass.split('/') as [string, string];
  return n === 1 ? `${singular} ${ONE[sg]}` : `${plural} ${TWO_TO_FIVE[pl]![n - 2]}`;
}

/** The digits in what the learner typed, ignoring spaces, commas and anything else. */
export const digitsOnly = (typed: string) => typed.replace(/\D/g, '');
