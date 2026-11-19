import { useState, type FormEvent } from 'react';
import {
  FEEDBACK_AREAS,
  FEEDBACK_MAX,
  type FeedbackArea,
} from '../../supabase/functions/_shared/feedback';
import { sendFeedback } from '../data/feedback';

/**
 * The Feedback box on Profile. Messages go to a public file in the app's repository, without
 * the learner's name or email, so the box says so.
 */
export function FeedbackPanel({ signedIn }: { signedIn: boolean }) {
  const [area, setArea] = useState<FeedbackArea>('General');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await sendFeedback(area, message);
      setMessage('');
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel" aria-labelledby="feedback-title">
      <h2 id="feedback-title" className="h2-bold">
        Feedback
      </h2>
      <p className="body">
        Tell us what works, what's confusing or what you'd like next. Messages are shared without
        your name or email, in a file anyone can read, so please leave out anything private.
      </p>
      {!signedIn ? (
        <p className="body-small">Sign in to send feedback.</p>
      ) : (
        <form className="form" onSubmit={(e) => void send(e)}>
          <label className="field">
            <span className="body-bold">What is it about?</span>
            <select
              className="field-input field-select body"
              value={area}
              onChange={(e) => setArea(e.target.value as FeedbackArea)}
            >
              {FEEDBACK_AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="body-bold">Your feedback</span>
            <textarea
              className="field-input body"
              name="feedback"
              rows={4}
              maxLength={FEEDBACK_MAX}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setSent(false);
              }}
            />
          </label>
          <p className="body-small">
            {message.length.toLocaleString()} of {FEEDBACK_MAX.toLocaleString()} characters
          </p>
          {error ? (
            <p className="form-error body-small" role="alert">
              {error}
            </p>
          ) : null}
          {sent ? (
            <p className="body-small" role="status">
              Thank you. Your feedback was sent.
            </p>
          ) : null}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={busy || message.trim().length === 0}
          >
            {busy ? 'Sending…' : 'Send feedback'}
          </button>
        </form>
      )}
    </section>
  );
}
