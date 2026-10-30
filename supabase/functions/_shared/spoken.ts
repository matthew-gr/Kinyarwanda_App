// How a Kinyarwanda word is said, spelled so a voice reading letters says it right. Learners
// always see the real spelling; only the text sent to the voice changes. Kept here so the audio
// function can bundle it, and tested from src/engine/spoken.test.ts.
//
// Two sound changes written Kinyarwanda does not show (AI-drafted rules; a native speaker
// should confirm them by listening):
// - A consonant before w picks up a g or k sound: umwami is said umgwami, Rwanda Rgwanda,
//   twese tkwese.
// - n or m before t, k or p breathes out the stop: umuntu is said umunhu, inka inha,
//   impamvu imhamvu.

const RULES: [RegExp, string][] = [
  [/(sh)w/gi, '$1kw'],
  [/([bmrvzj])w/gi, '$1gw'],
  [/([ptsf])w/gi, '$1kw'],
  [/(n)[tk]/gi, '$1h'],
  [/(m)p/gi, '$1h'],
];

/** The text to send to a voice for `text`, which may be a word, a phrase or a sentence. */
export function spokenSpelling(text: string): string {
  return RULES.reduce((out, [from, to]) => out.replace(from, to), text);
}
