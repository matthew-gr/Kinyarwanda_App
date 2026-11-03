// How Kinyarwanda is said, respelled for a voice that reads letters the English way. Learners
// always see the real spelling; only the text sent to the voice changes. Kept here so the audio
// function can bundle it, and tested from src/engine/spoken.test.ts.
//
// Kinyarwanda letters sound the same every time, so each word is split into syllables and
// each letter written one fixed English way, with hyphens between syllables so the voice
// cannot blend them into English sounds (wowe is woh-weh, not "wow"; amazi is ah-mah-zee, not
// like maize). Only n or m before another consonant changes things:
// - The n or m joins the syllable before (umuntu is oo-moon-...), or starts its own at the
//   start of a word (njye is in-jeh, not spelled out letter by letter).
// - After it, t, k and p are breathed out: umuntu is oo-moon-hoo, inka een-hah.
// And a consonant before w picks up a g or k (Rwanda is rgwahn-dah, twese tkweh-seh), softened
// to ŋ after m because a hard g was too strong (umwami is oo-mŋwah-mee). A consonant before y
// ends the syllable before, so the voice glides into the y: ibiryo is ee-beer-yoh. Written
// ryoh it was said ri-o, and rjoh came out as jya.
// Between words, a short word ending in a vowel joins a word starting with one, as it is said:
// u becomes w and any other vowel drops (ku isoko is kw'isoko, na umwana n'umwana, ni iki
// n'iki), as writers do when they write the join.
// With `stress`, the syllable before last is written in capitals so the voice leans on it
// (arateka is ah-rah-TEH-kah, never on the tense marker ra).
// AI-drafted from what Matt heard; a native speaker should confirm by listening.

// e is always short, as in "tech": written ay, arateka was said a-ra-take-uh.
const VOWEL_SOUND: Record<string, string> = { a: 'ah', e: 'eh', i: 'ee', o: 'oh', u: 'oo' };
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

function sayWord(word: string, stress: boolean): string {
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
    // A consonant before y ends the syllable before (ibiryo is ee-beer-yoh).
    if (/^[bdfgkprstvz]y$/.test(cluster) && syllables.length) {
      syllables[syllables.length - 1] += cluster.slice(0, 1);
      cluster = 'y';
    }
    syllables.push(consonants(cluster, vowel) + VOWEL_SOUND[vowel]);
  }
  if (stress && syllables.length >= 3) {
    const at = syllables.length - 2;
    syllables[at] = syllables[at]!.toUpperCase();
  }
  const out = syllables.join('-');
  return word[0] !== word[0]!.toLowerCase() ? out[0]!.toUpperCase() + out.slice(1) : out;
}

/** Words of up to 3 letters ending in a vowel join a following vowel: ku, mu, na, ni, kwa. */
const JOINS = /(?<![A-Za-z'])([A-Za-z]{0,2}[aeiou]) +([aeiouAEIOU])/g;

/** Joins a short word to a next word that starts with a vowel, the way it is said. */
export function joinVowels(text: string): string {
  return text.replace(JOINS, (_, word: string, next: string) => {
    const stem = word.slice(0, -1);
    const glide = word.slice(-1).toLowerCase() === 'u' ? 'w' : '';
    // A word that is only a vowel is left as it is.
    return stem ? `${stem}${glide}'${next}` : `${word} ${next}`;
  });
}

/**
 * The text to send to a voice for `text`, which may be a word, a phrase or a sentence. With
 * `stress`, each word's syllable before last is in capitals.
 */
export function spokenSpelling(text: string, stress = false): string {
  return joinVowels(text).replace(/[A-Za-z']+/g, (word) =>
    /[aeiou]/i.test(word) ? sayWord(word, stress) : word,
  );
}
