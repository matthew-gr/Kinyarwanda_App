// The pronunciation guide on a card: each word split into syllables joined by underscores.
//
// Kinyarwanda syllables are open: every one ends in a vowel, and consonant clusters such as nt,
// mb, ny, cy, shy and rw start the next syllable. So a word splits after each vowel.
// Vowel length and tone are not written in Kinyarwanda spelling, so the guide cannot show them;
// native reviewers can add them later.

const SYLLABLE = /[^aeiou]*[aeiou]/g;

function word(w: string): string {
  const letters = w.toLowerCase().replace(/[^a-z]/g, '');
  const parts = letters.match(SYLLABLE) ?? [];
  const tail = letters.slice(parts.join('').length);
  if (tail) {
    if (parts.length === 0) return tail;
    parts[parts.length - 1] += tail;
  }
  return parts.join('_');
}

/** "Murakoze cyane" becomes "mu_ra_ko_ze cya_ne". */
export function syllables(text: string): string {
  return text.split(/\s+/).map(word).filter(Boolean).join(' ');
}
