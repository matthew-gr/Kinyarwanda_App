import { expect, it } from 'vitest';
import { spokenSpelling } from '../../supabase/functions/_shared/spoken';

it('adds the g or k sound a consonant takes before w', () => {
  expect(spokenSpelling('umwami')).toBe('umgwami');
  expect(spokenSpelling('Rwanda')).toBe('Rgwanda');
  expect(spokenSpelling('ubwiza')).toBe('ubgwiza');
  expect(spokenSpelling('twese')).toBe('tkwese');
  expect(spokenSpelling('ishwagara')).toBe('ishkwagara');
  // k and g already carry it.
  expect(spokenSpelling('ukwezi')).toBe('ukwezi');
  expect(spokenSpelling('igwa')).toBe('igwa');
});

it('breathes out t, k and p after n or m', () => {
  expect(spokenSpelling('umuntu')).toBe('umunhu');
  expect(spokenSpelling('inka')).toBe('inha');
  expect(spokenSpelling('impamvu')).toBe('imhamvu');
  expect(spokenSpelling('Ntabwo')).toBe('Nhabgwo');
});

it('leaves everything else alone', () => {
  expect(spokenSpelling('Muraho, amakuru?')).toBe('Muraho, amakuru?');
  expect(spokenSpelling('mirongo itanu na gatanu')).toBe('mirongo itanu na gatanu');
});
