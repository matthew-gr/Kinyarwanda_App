import { describe, expect, it } from 'vitest';
import { BAND_SIZES, bandFor, placeLabel } from './vocabulary';

describe('the vocabulary bands', () => {
  it('takes each band from the rank', () => {
    expect(BAND_SIZES).toEqual([100, 100, 300, 300, 400, 800]);
    expect([1, 100, 101, 200, 201, 500, 800, 1200, 2000, 2400].map((r) => bandFor(r).name)).toEqual(
      [
        'Common 100',
        'Common 100',
        'Common 200',
        'Common 200',
        'Common 500',
        'Common 500',
        'Common 800',
        'Common 1200',
        'Common 2000',
        'Common 2000',
      ],
    );
  });

  it('labels a card with its band and its first topic', () => {
    expect(placeLabel({ rank: 105, tags: ['family', 'actions'] })).toBe('Common 200 · Family');
    expect(placeLabel({ rank: 3 })).toBe('Common 100');
  });
});
