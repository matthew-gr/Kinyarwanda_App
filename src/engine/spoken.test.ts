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
