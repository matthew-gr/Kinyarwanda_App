// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FeedbackPanel } from './FeedbackPanel';

const sendFeedback = vi.fn<(area: string, message: string) => Promise<void>>();
vi.mock('../data/feedback', () => ({
  sendFeedback: (area: string, message: string) => sendFeedback(area, message),
}));

afterEach(() => {
  cleanup();
  sendFeedback.mockReset();
});

describe('FeedbackPanel', () => {
  it('says messages are public and asks a signed-out learner to sign in', () => {
    render(<FeedbackPanel signedIn={false} />);
    expect(screen.getByText(/without your name or email/)).toBeTruthy();
    expect(screen.getByText('Sign in to send feedback.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Send feedback' })).toBeNull();
  });

  it('sends the area and message, then clears the box', async () => {
    sendFeedback.mockResolvedValue();
    render(<FeedbackPanel signedIn />);
    const send = screen.getByRole('button', { name: 'Send feedback' }) as HTMLButtonElement;
    expect(send.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText('What is it about?'), { target: { value: 'Review' } });
    fireEvent.change(screen.getByLabelText('Your feedback'), {
      target: { value: 'Reviews feel too fast' },
    });
    expect(screen.getByText('21 of 2,000 characters')).toBeTruthy();
    fireEvent.click(send);

    await waitFor(() =>
      expect(screen.getByText('Thank you. Your feedback was sent.')).toBeTruthy(),
    );
    expect(sendFeedback).toHaveBeenCalledWith('Review', 'Reviews feel too fast');
    expect((screen.getByLabelText('Your feedback') as HTMLTextAreaElement).value).toBe('');
  });

  it('keeps the message and shows why when sending fails', async () => {
    sendFeedback.mockRejectedValue(new Error("You've sent 5 messages in the last hour."));
    render(<FeedbackPanel signedIn />);
    fireEvent.change(screen.getByLabelText('Your feedback'), { target: { value: 'One more' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));

    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/last hour/));
    expect((screen.getByLabelText('Your feedback') as HTMLTextAreaElement).value).toBe('One more');
  });
});
