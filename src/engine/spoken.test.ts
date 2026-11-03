import { expect, it } from 'vitest';
import { spokenSpelling } from '../../supabase/functions/_shared/spoken';

it('writes every vowel one way, a syllable at a time', () => {
  expect(spokenSpelling('wowe')).toBe('woh-way');
  expect(spokenSpelling('amazi')).toBe('ah-mah-zee');
  expect(spokenSpelling('Muraho, amakuru?')).toBe('Moo-rah-hoh, ah-mah-koo-roo?');
});

it('keeps g as in "get" and writes cy, jy and shy as English letters', () => {
  expect(spokenSpelling('aragenda')).toBe('ah-rah-ghayn-dah');
  expect(spokenSpelling('icyenda')).toBe('ee-chayn-dah');
  expect(spokenSpelling('ishyamba')).toBe('ee-shahm-bah');
  expect(spokenSpelling('imijyi')).toBe('ee-mee-jee');
});

it('moves n or m before a consonant to the syllable before, or gives it one', () => {
  expect(spokenSpelling('njye')).toBe('in-jay');
  expect(spokenSpelling('Ndi')).toBe('In-dee');
  expect(spokenSpelling('inyama')).toBe('ee-nyah-mah');
  expect(spokenSpelling("n'icyenda")).toBe('nee-chayn-dah');
});

it('breathes out t, k and p after n or m', () => {
  expect(spokenSpelling('umuntu')).toBe('oo-moon-hoo');
  expect(spokenSpelling('inka')).toBe('een-hah');
  expect(spokenSpelling('impamvu')).toBe('eem-hahm-voo');
});

it('adds the g or k sound a consonant takes before w, softened to ŋ after m', () => {
  expect(spokenSpelling('umwami')).toBe('oo-mŋwah-mee');
  expect(spokenSpelling('Rwanda')).toBe('Rgwahn-dah');
  expect(spokenSpelling('twese')).toBe('tkway-say');
  expect(spokenSpelling('ukwezi')).toBe('oo-kway-zee');
});

it('leaves words without vowels alone', () => {
  expect(spokenSpelling('100 RWF')).toBe('100 RWF');
});

it('says a consonant before y as one sound with it', () => {
  expect(spokenSpelling('ibiryo')).toBe('ee-bee-rjoh');
  expect(spokenSpelling('ibyo')).toBe('ee-bjoh');
  expect(spokenSpelling('icyo')).toBe('ee-choh');
});

it('joins a short word ending in a vowel to the next word starting with one', () => {
  expect(spokenSpelling('ku isoko.')).toBe('kwee-soh-koh.');
  expect(spokenSpelling('na umwana')).toBe('noo-mŋwah-nah');
  expect(spokenSpelling('Ni iki?')).toBe('Nee-kee?');
  // Longer words, and words split by punctuation, stay apart.
  expect(spokenSpelling('umugabo arakina')).toBe('oo-moo-gah-boh ah-rah-kee-nah');
  expect(spokenSpelling('Ego, ariko')).toBe('Ay-goh, ah-ree-koh');
});

it('with stress, writes the syllable before last in capitals', () => {
  expect(spokenSpelling('arateka', true)).toBe('ah-rah-TAY-kah');
  expect(spokenSpelling('ibiryo', true)).toBe('ee-BEE-rjoh');
  // Words of 1 or 2 syllables are left as they are.
  expect(spokenSpelling('amazi wowe', true)).toBe('ah-MAH-zee woh-way');
});
