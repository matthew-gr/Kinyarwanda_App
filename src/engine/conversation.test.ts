import { describe, expect, it } from 'vitest';
import { accepts, choices, dealRole, levelTurns, LEVELS, normalize, tiles } from './conversation';
import { createSeededRng } from './random';

describe('Conversations (decision 215)', () => {
  it('has levels that go from picking to building to typing a reply', () => {
    expect(LEVELS.map((l) => l.mode)).toEqual([
      'choose',
      'choose',
      'build',
      'build',
      'type',
      'type',
      'type',
      'type',
    ]);
    expect(LEVELS.map((l) => l.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('fills every slot from the role', () => {
    for (let seed = 1; seed < 20; seed++) {
      const role = dealRole(createSeededRng(seed));
      expect(role.name).not.toBe(role.otherName);
      expect(role.place).not.toBe(role.otherPlace);
      for (const level of LEVELS)
        for (const t of levelTurns(level, role))
          for (const text of [t.them, t.themEn, t.replyEn, ...t.replies, ...t.wrong])
            expect(text).not.toMatch(/[{}]/);
    }
  });

  it('never offers a wrong reply that would be accepted', () => {
    const role = dealRole(createSeededRng(5));
    for (const level of LEVELS)
      for (const t of levelTurns(level, role))
        for (const w of t.wrong) expect(accepts(t, w)).toBe(false);
  });

  it('accepts a reply whatever its capitals, punctuation and apostrophes', () => {
    const role = dealRole(createSeededRng(2));
    const [first] = levelTurns(LEVELS[2]!, role);
    expect(accepts(first!, `nitwa ${role.name.toLowerCase()}`)).toBe(true);
    expect(accepts(first!, `Nitwa ${role.otherName}.`)).toBe(false);
    expect(normalize('Ak’imuhana!')).toBe("ak'imuhana");
  });

  it('builds a reply from its own tiles, with two more that don’t belong', () => {
    const rng = createSeededRng(9);
    const role = dealRole(rng);
    for (const t of levelTurns(LEVELS[3]!, role)) {
      const own = t.replies[0]!.split(' ');
      const all = tiles(t, rng);
      expect(all.length).toBeGreaterThanOrEqual(own.length);
      expect(own.every((w) => all.includes(w))).toBe(true);
      expect(accepts(t, own.join(' '))).toBe(true);
    }
    const c = choices(levelTurns(LEVELS[0]!, role)[0]!, rng);
    expect(c).toHaveLength(3);
  });
});
