import { describe, expect, it } from 'vitest';
import {
  appendFeedback,
  cleanFeedback,
  cleanVersion,
  FEEDBACK_HEADER,
  FEEDBACK_MAX,
  FEEDBACK_PER_DAY,
  FEEDBACK_PER_HOUR,
  feedbackEntry,
  feedbackLimit,
  fromBase64,
  isFeedbackArea,
  markdownText,
  toBase64,
  type FeedbackEntry,
} from '../../supabase/functions/_shared/feedback';

const entry = (id: string, message = 'The audio is quiet.'): FeedbackEntry => ({
  id,
  created_at: '2026-11-19T17:05:42.000Z',
  area: 'Learn',
  app_version: '0.1.0+1b56573',
  message,
});

describe('cleanFeedback', () => {
  it('trims, tidies line endings and blank lines', () => {
    expect(cleanFeedback('  Hello\r\nthere   \r\n\r\n\r\n\r\nbye  ')).toBe('Hello\nthere\n\nbye');
  });

  it('removes control and direction characters', () => {
    expect(cleanFeedback('ok\u0000ay\u202e then')).toBe('okay then');
  });

  it('turns away messages too short or too long', () => {
    expect(cleanFeedback('  hi ')).toBeNull();
    expect(cleanFeedback('abc')).toBe('abc');
    expect(cleanFeedback('a'.repeat(FEEDBACK_MAX))).toHaveLength(FEEDBACK_MAX);
    expect(cleanFeedback('a'.repeat(FEEDBACK_MAX + 1))).toBeNull();
  });
});

describe('checks', () => {
  it('knows the areas', () => {
    expect(isFeedbackArea('Learn')).toBe(true);
    expect(isFeedbackArea('learn')).toBe(false);
    expect(isFeedbackArea(3)).toBe(false);
  });

  it('keeps only version-like strings', () => {
    expect(cleanVersion('0.1.0+1b56573')).toBe('0.1.0+1b56573');
    expect(cleanVersion('0.1.0\n# hi')).toBe('unknown');
    expect(cleanVersion(undefined)).toBe('unknown');
  });

  it('limits each account per hour and per day', () => {
    expect(feedbackLimit(0, 0)).toBeNull();
    expect(feedbackLimit(FEEDBACK_PER_HOUR - 1, FEEDBACK_PER_DAY - 1)).toBeNull();
    expect(feedbackLimit(FEEDBACK_PER_HOUR, 5)).toMatch(/last hour/);
    expect(feedbackLimit(0, FEEDBACK_PER_DAY)).toMatch(/today/);
  });
});

describe('markdownText', () => {
  it('leaves ordinary text readable', () => {
    expect(markdownText("I can't hear umwana. Great app!")).toBe("I can't hear umwana. Great app!");
  });

  it('stops HTML, links, emphasis, code and tables', () => {
    expect(markdownText('<img src=x onerror=alert(1)> & co')).toBe(
      '&lt;img src=x onerror=alert(1)&gt; &amp; co',
    );
    expect(markdownText('[click](http://x) ![p](y) *b* _i_ `c` a|b ~s~')).toBe(
      '\\[click\\](http://x) !\\[p\\](y) \\*b\\* \\_i\\_ \\`c\\` a\\|b \\~s\\~',
    );
  });

  it('stops headings, lists and rules at the start of a line', () => {
    expect(markdownText('# Title')).toBe('\\# Title');
    expect(markdownText('- item')).toBe('\\- item');
    expect(markdownText('+ item')).toBe('\\+ item');
    expect(markdownText('===')).toBe('\\===');
    expect(markdownText('12. item')).toBe('12\\. item');
    expect(markdownText('a - b')).toBe('a - b');
  });
});

describe('the file', () => {
  it('writes an entry as a heading, a marker and a quote', () => {
    expect(feedbackEntry(entry('a1', 'First line\n\n# not a heading'))).toBe(
      [
        '### 2026-11-19 17:05 UTC · Learn · 0.1.0+1b56573',
        '<!-- feedback:a1 -->',
        '',
        '> First line',
        '>',
        '> \\# not a heading',
      ].join('\n'),
    );
  });

  it('starts a new file with the header', () => {
    const { text, added } = appendFeedback(null, [entry('a1')]);
    expect(added).toBe(1);
    expect(text.startsWith(FEEDBACK_HEADER)).toBe(true);
    expect(text).toContain('> The audio is quiet.');
    expect(text.endsWith('\n')).toBe(true);
  });

  it('adds new entries at the end and never repeats one', () => {
    const first = appendFeedback(FEEDBACK_HEADER, [entry('a1')]).text;
    const { text, added } = appendFeedback(first, [entry('a1'), entry('b2', 'Second')]);
    expect(added).toBe(1);
    expect(text.indexOf('feedback:a1')).toBeLessThan(text.indexOf('feedback:b2'));
    expect(text.match(/feedback:a1/g)).toHaveLength(1);
    expect(appendFeedback(text, [entry('b2')])).toEqual({ text, added: 0 });
  });

  it('round-trips UTF-8 through base64', () => {
    const s = 'Murakoze cyane! ✓ ñ 🙂\n'.repeat(5000);
    expect(fromBase64(toBase64(s))).toBe(s);
    // GitHub wraps its base64 in lines.
    expect(fromBase64(toBase64('Yego').replace(/(.{4})/g, '$1\n'))).toBe('Yego');
  });
});
