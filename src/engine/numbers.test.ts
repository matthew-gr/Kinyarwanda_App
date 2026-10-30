import { describe, expect, it } from 'vitest';
import {
  canCountNoun,
  digitsOnly,
  phoneDisplay,
  sayMoney,
  sayNounNumber,
  sayNumber,
  sayPhone,
} from './numbers';

describe('sayNumber', () => {
  it('counts 1 to 10', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(sayNumber)).toEqual([
      'rimwe',
      'kabiri',
      'gatatu',
      'kane',
      'gatanu',
      'gatandatu',
      'karindwi',
      'umunani',
      'icyenda',
      'icumi',
    ]);
  });

  it('says the teens, tens and the numbers between', () => {
    expect(sayNumber(11)).toBe('cumi na rimwe');
    expect(sayNumber(20)).toBe('makumyabiri');
    expect(sayNumber(25)).toBe('makumyabiri na gatanu');
    expect(sayNumber(42)).toBe('mirongo ine na kabiri');
    expect(sayNumber(99)).toBe("mirongo icyenda n'icyenda");
    expect(sayNumber(18)).toBe("cumi n'umunani");
  });

  it('says hundreds', () => {
    expect(sayNumber(100)).toBe('ijana');
    expect(sayNumber(300)).toBe('magana atatu');
    expect(sayNumber(150)).toBe('ijana na mirongo itanu');
    expect(sayNumber(911)).toBe('magana cyenda na cumi na rimwe');
    expect(sayNumber(110)).toBe("ijana n'icumi");
  });

  it('says thousands', () => {
    expect(sayNumber(1000)).toBe('igihumbi');
    expect(sayNumber(1500)).toBe('igihumbi na magana atanu');
    expect(sayNumber(2000)).toBe('ibihumbi bibiri');
    expect(sayNumber(10000)).toBe('ibihumbi icumi');
    expect(sayNumber(1100)).toBe("igihumbi n'ijana");
    expect(sayNumber(50000)).toBe('ibihumbi mirongo itanu');
  });

  it('refuses numbers it has no rule for', () => {
    expect(() => sayNumber(25000)).toThrow();
    expect(() => sayNumber(-1)).toThrow();
    expect(() => sayNumber(1.5)).toThrow();
  });
});

describe('sayMoney', () => {
  it('says prices in francs, in whole hundreds only', () => {
    expect(sayMoney(500)).toBe('amafaranga magana atanu');
    expect(sayMoney(2500)).toBe('amafaranga ibihumbi bibiri na magana atanu');
    expect(() => sayMoney(250)).toThrow();
  });
});

describe('sayPhone', () => {
  it('reads groups as numbers and anything starting with 0 digit by digit', () => {
    expect(sayPhone('0788123456', [3, 3, 2, 2])).toBe(
      'zeru, karindwi, umunani, magana inani na cumi na kabiri, mirongo itatu na kane, mirongo itanu na gatandatu',
    );
    expect(sayPhone('0705', [2, 2])).toBe('zeru, karindwi, zeru, gatanu');
    expect(phoneDisplay('0788123456', [3, 3, 2, 2])).toBe('078 812 34 56');
  });

  it('refuses groups that do not fit', () => {
    expect(() => sayPhone('0788', [3, 3])).toThrow();
  });
});

describe('sayNounNumber', () => {
  it('makes 1 to 5 agree with the noun', () => {
    expect(sayNounNumber('1/2', 1, 'umuntu', 'abantu')).toBe('umuntu umwe');
    expect(sayNounNumber('1/2', 2, 'umuntu', 'abantu')).toBe('abantu babiri');
    expect(sayNounNumber('7/8', 3, 'ikintu', 'ibintu')).toBe('ibintu bitatu');
    expect(sayNounNumber('9/10', 4, 'inka', 'inka')).toBe('inka enye');
    expect(sayNounNumber('5/6', 5, 'ishuri', 'amashuri')).toBe('amashuri atanu');
    expect(sayNounNumber('3/4', 2, 'umugati', 'imigati')).toBe('imigati ibiri');
    expect(sayNounNumber('11/10', 1, 'urugo', 'ingo')).toBe('urugo rumwe');
    expect(sayNounNumber('9/6', 3, 'inzu', 'amazu')).toBe('amazu atatu');
  });

  it('knows which classes it can count', () => {
    expect(canCountNoun('1/2')).toBe(true);
    expect(canCountNoun('6')).toBe(false);
    expect(canCountNoun(null)).toBe(false);
    expect(() => sayNounNumber('1/2', 6, 'umuntu', 'abantu')).toThrow();
  });
});

it('reads only the digits the learner typed', () => {
  expect(digitsOnly(' 078 812-34 ')).toBe('07881234');
});
