// How Kinyarwanda is said, respelled for a voice that reads letters the English way. Learners
// always see the real spelling; only the text sent to the voice changes. Kept here so the audio
// function can bundle it, and tested from src/engine/spoken.test.ts.
//
// Kinyarwanda letters sound the same every time, so each word is split into syllables and
// each letter written one fixed English way, with hyphens between syllables so the voice
// cannot blend them into English sounds (wowe is woh-way, not "wow"; amazi is ah-mah-zee, not
// like maize). Only n or m before another consonant changes things:
// - The n or m joins the syllable before (umuntu is oo-moon-...), or starts its own at the
//   start of a word (njye is in-jay, not spelled out letter by letter).
// - After it, t, k and p are breathed out: umuntu is oo-moon-hoo, inka een-hah.
// And a consonant before w picks up a g or k (Rwanda is rgwahn-dah, twese tkway-say), softened
// to ŋ after m because a hard g was too strong (umwami is oo-mŋwah-mee).
// AI-drafted from what Matt heard; a native speaker should confirm by listening.

const VOWEL_SOUND: Record<string, string> = { a: 'ah', e: 'ay', i: 'ee', o: 'oh', u: 'oo' };
const isVowel = (c: string) => c in VOWEL_SOUND;

/** The consonants that start a syllable, spelled for an English reader. */
function consonants(cluster: string, vowel: string): string {
  let c = cluster
    .replace(/shy/g, 'sh')
    .replace(/cy/g, 'ch')
    .replace(/jy/g, 'j')
    .replace(/c(?!h)/g, 'ch');
  if (/[^aeiou]w$/.test(c)) {
    c = c
      .replace(/shw$/, 'shkw')
      .replace(/mw$/, 'mŋw')
      .replace(/([brvzj])w$/, '$1gw')
      .replace(/([ptsf])w$/, '$1kw');
  }
  // g stays the g of "get" before e and i.
  if (c.endsWith('g') && (vowel === 'e' || vowel === 'i')) c += 'h';
  return c;
}

/** n or m that belongs to the syllable before: before a consonant other than ny, my or mw. */
const strayNasal = (cluster: string) => /^[nm][^yw]/.test(cluster);

function sayWord(word: string): string {
  const letters = word.toLowerCase().replace(/'/g, '');
  const syllables: string[] = [];
  let i = 0;
  while (i < letters.length) {
    let cluster = '';
    while (i < letters.length && !isVowel(letters[i]!)) cluster += letters[i++];
    const vowel = letters[i] ?? '';
    // A doubled vowel is one long vowel.
    while (i < letters.length && letters[i] === vowel) i++;
    if (!vowel) {
      // Consonants left at the end of a word stay with the last syllable.
      if (syllables.length) syllables[syllables.length - 1] += cluster;
      else syllables.push(cluster);
      break;
    }
    if (strayNasal(cluster)) {
      const nasal = cluster[0]!;
      cluster = cluster.slice(1);
      if (syllables.length) syllables[syllables.length - 1] += nasal;
      else syllables.push(`i${nasal}`);
      // The stop after it is breathed out.
      if (/^[tk]/.test(cluster) || (nasal === 'm' && cluster.startsWith('p'))) {
        cluster = `h${cluster.slice(1)}`;
      }
    }
    syllables.push(consonants(cluster, vowel) + VOWEL_SOUND[vowel]);
  }
  const out = syllables.join('-');
  return word[0] !== word[0]!.toLowerCase() ? out[0]!.toUpperCase() + out.slice(1) : out;
}

/** The text to send to a voice for `text`, which may be a word, a phrase or a sentence. */
export function spokenSpelling(text: string): string {
  return text.replace(/[A-Za-z']+/g, (word) => (/[aeiou]/i.test(word) ? sayWord(word) : word));
}
