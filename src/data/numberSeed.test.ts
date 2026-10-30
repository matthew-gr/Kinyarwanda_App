import { describe, expect, it } from 'vitest';
import { sayMoney, sayNumber, sayPhone } from '../engine/numbers';
import { bundledItems, bundledNumbers as rows } from './content';
import { OPENING_NUMBERS } from './drills';

describe('the drafted numbers', () => {
  it('fills Number Listening levels 1 to 5, all marked as AI drafts', () => {
    const levels = new Set(rows.map((r) => r.level));
    expect([...levels].sort()).toEqual([1, 2, 3, 4, 5]);
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
    expect(rows.every((r) => /^\d+$/.test(r.value) && r.status === 'ai_draft')).toBe(true);
  });

  it('matches what the number rules say today', () => {
    for (const r of rows) {
      if (r.kind === 'count') expect(r.text).toBe(sayNumber(Number(r.value)));
      if (r.kind === 'money') expect(r.text).toBe(sayMoney(Number(r.value)));
      if (r.kind === 'phone') expect(r.text).toBe(sayPhone(r.value, r.groups!));
    }
  });

  it('gives Speed Speaking course nouns with 1 to 5', () => {
    const nouns = rows.filter((r) => r.kind === 'noun');
    const ids = new Set(bundledItems.map((i) => i.id));
    expect(nouns.length).toBeGreaterThanOrEqual(50);
    expect(nouns.every((r) => r.noun_item_id && ids.has(r.noun_item_id) && r.noun)).toBe(true);
    expect(new Set(nouns.map((r) => r.value))).toEqual(new Set(['1', '2', '3', '4', '5']));
    expect(nouns.find((r) => r.noun === 'abantu' && r.value === '2')?.text).toBe('abantu babiri');
  });

  it('opens the drills on numbers that are in the course', () => {
    const bases = new Set(bundledItems.map((i) => i.base));
    expect(OPENING_NUMBERS.every((n) => bases.has(n))).toBe(true);
  });
});
