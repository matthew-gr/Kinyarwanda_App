import { describe, expect, it } from 'vitest';
import { dollars, storyCost } from './costs';

describe('cost estimates', () => {
  it('prices a story by model, and twice when it is written again', () => {
    const sonnet = storyCost('claude-sonnet-5-5', 35_000, 200);
    const opus = storyCost('claude-opus-5-5', 35_000, 200);
    expect(opus.once).toBeCloseTo(2 * sonnet.once, 6);
    expect(sonnet.twice).toBeCloseTo(2 * sonnet.once, 6);
    // 10,600 input and 3,100 output tokens on Sonnet: about 5 cents.
    expect(sonnet.once).toBeGreaterThan(0.04);
    expect(sonnet.once).toBeLessThan(0.07);
  });

  it('writes dollars to the cent', () => {
    expect(dollars(0.12)).toBe('$0.12');
    expect(dollars(0.0049)).toBe('less than $0.01');
  });
});
