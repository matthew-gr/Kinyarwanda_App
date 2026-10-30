import { describe, expect, it } from 'vitest';
import { syllables } from './pronunciation';

describe('syllables', () => {
  it('splits after each vowel, keeping clusters with the next vowel', () => {
    expect(syllables('murakoze')).toBe('mu_ra_ko_ze');
    expect(syllables('umuntu')).toBe('u_mu_ntu');
    expect(syllables('Ikinyarwanda')).toBe('i_ki_nya_rwa_nda');
    expect(syllables('icyayi')).toBe('i_cya_yi');
    expect(syllables('oya')).toBe('o_ya');
  });

  it('handles phrases, punctuation and the elided vowel', () => {
    expect(syllables('Amakuru yawe?')).toBe('a_ma_ku_ru ya_we');
    expect(syllables("n'umugore")).toBe('nu_mu_go_re');
    expect(syllables('Nitwa ...')).toBe('ni_twa');
  });
});
