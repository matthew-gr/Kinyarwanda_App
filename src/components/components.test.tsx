// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BottomNav } from './BottomNav';
import { Flashcard } from './Flashcard';
import { PracticeRow } from './PracticeRow';
import { SessionHeader } from './SessionHeader';

afterEach(cleanup);

describe('Flashcard', () => {
  it('shows only the Kinyarwanda on the front, and flips when the card is tapped', () => {
    const onFlip = vi.fn();
    const { container } = render(
      <Flashcard side="front" word="abana" translation="children" onFlip={onFlip} />,
    );
    const flip = screen.getByRole('button', { name: /abana/ });
    expect(container.querySelector('.kn-flash-back')?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.queryByRole('button', { name: 'Play pronunciation' })).toBeNull();
    fireEvent.click(flip);
    expect(onFlip).toHaveBeenCalledOnce();
  });

  it('shows the meaning and dictionary form on the back', () => {
    const { container } = render(
      <Flashcard
        side="back"
        word="abana"
        translation="children"
        detail="Dictionary form: umwana (child)"
        tag="WORD"
      />,
    );
    expect(container.querySelector('.kn-flash')?.classList.contains('is-back')).toBe(true);
    expect(container.querySelector('.kn-flash-front')?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByText('children')).toBeTruthy();
    expect(screen.getByText('Dictionary form: umwana (child)')).toBeTruthy();
    expect(screen.getByText('WORD')).toBeTruthy();
  });

  it('shows front and back together for an introduction', () => {
    render(<Flashcard side="both" word="arakina" translation="he or she plays" />);
    expect(screen.getByText('arakina')).toBeTruthy();
    expect(screen.getByText('he or she plays')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Tap to reveal/ })).toBeNull();
  });

  it('shows the play button only when there is audio to play', () => {
    const onSpeak = vi.fn();
    render(<Flashcard side="front" word="muraho" translation="hello" onSpeak={onSpeak} />);
    fireEvent.click(screen.getByRole('button', { name: 'Play pronunciation' }));
    expect(onSpeak).toHaveBeenCalledOnce();
  });
});

describe('PracticeRow', () => {
  it('is a button when it opens something', () => {
    const onClick = vi.fn();
    render(
      <PracticeRow title="Words" subtitle="3 of 22 learned" progress={3 / 22} onClick={onClick} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Words/ }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(
      screen.getByRole('progressbar', { name: 'Words progress' }).getAttribute('aria-valuenow'),
    ).toBe('14');
  });

  it('says it is locked in words and is not a button', () => {
    render(
      <PracticeRow title="Review" subtitle="Locked · Coming next" locked onClick={() => {}} />,
    );
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('Locked · Coming next')).toBeTruthy();
  });
});

describe('SessionHeader', () => {
  it('shows the pool and streak, with the streak as progress', () => {
    render(
      <SessionHeader
        level="3 of 8 in play"
        meta="Streak 1 of 3"
        progress={1 / 3}
        progressLabel="Streak"
      />,
    );
    expect(screen.getByText('3 of 8 in play')).toBeTruthy();
    expect(screen.getByText('Streak 1 of 3')).toBeTruthy();
    expect(screen.getByRole('progressbar', { name: 'Streak' }).getAttribute('aria-valuenow')).toBe(
      '33',
    );
  });
});

describe('BottomNav', () => {
  it('labels every destination and marks the current one', () => {
    const onSelect = vi.fn();
    render(<BottomNav active="home" onSelect={onSelect} />);
    for (const name of ['Home', 'Search', 'History', 'Profile']) {
      expect(screen.getByRole('button', { name })).toBeTruthy();
    }
    expect(screen.getByRole('button', { name: 'Home' }).getAttribute('aria-current')).toBe('page');
    fireEvent.click(screen.getByRole('button', { name: 'History' }));
    expect(onSelect).toHaveBeenCalledWith('history');
  });
});
