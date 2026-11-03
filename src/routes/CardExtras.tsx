// The parts of a flashcard that come from the course: the pronunciation guide, the example or
// breakdown, the Report a mistake form, and asking for the audio to be re-recorded.

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { errorText, requestRerecord } from '../data/admin';
import { requestSync } from '../data/sync';
import { saveReport, type NewReport } from '../data/reports';
import type { Item, ItemForm } from '../engine/types';

/** A word's example sentence, or a phrase's word-by-word meanings. */
export function CardNotes({ item }: { item: Item }) {
  if (item.breakdown && item.breakdown.length > 0) {
    return (
      <p>
        {item.breakdown.map((g, i) => (
          <span key={i}>
            {i > 0 ? ' · ' : ''}
            <span lang="rw">{g.rw}</span> = {g.en}
          </span>
        ))}
      </p>
    );
  }
  if (!item.example) return null;
  return (
    <>
      <p className="body-small-bold" lang="rw">
        {item.example.rw}
      </p>
      <p>{item.example.en}</p>
    </>
  );
}

/** A small link under the card that opens a form to describe what looks wrong. */
export function ReportMistake({
  item,
  form,
  module,
}: {
  item: Item;
  form: ItemForm;
  module: 'learn' | 'review';
}) {
  return (
    <>
      <ReportLink
        report={{
          item_id: item.id,
          form_id: form.id,
          module,
          shown_text: `${form.text} = ${form.en}`,
        }}
        intro={
          <>
            This card was drafted by AI and is not yet checked by a native speaker. What looks wrong
            in <span lang="rw">{form.text}</span>?
          </>
        }
        placeholder="For example: the plural is wrong, or the audio says something else"
      />
      {form.audio_path ? <RerecordLink form={form} /> : null}
    </>
  );
}

/**
 * Asks for the card's audio to be made again (decision 175). An admin's request joins the
 * re-record queue, recorded once 15 wait; anyone else's waits for an admin to approve it.
 */
function RerecordLink({ form }: { form: ItemForm }) {
  const [state, setState] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ask = async () => {
    setBusy(true);
    try {
      const r = await requestRerecord(form.id);
      setState(
        !r.queued
          ? 'Re-record requested; an admin will check it'
          : r.waiting === undefined
            ? 'Re-recorded with the queue'
            : `Queued for re-recording (${r.waiting} of ${r.batch ?? 15})`,
      );
    } catch (e) {
      setState(`Couldn’t send: ${errorText(e)}`);
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      type="button"
      className="report-link body-small"
      disabled={busy || state !== null}
      onClick={() => void ask()}
    >
      {busy ? 'Sending…' : (state ?? 'Re-record audio')}
    </button>
  );
}

/** The Report a mistake link and form, for a card or a story. */
export function ReportLink({
  report,
  intro,
  placeholder,
}: {
  report: Omit<NewReport, 'message'>;
  intro: ReactNode;
  placeholder: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const titleId = useId();
  const fieldId = useId();

  useEffect(() => {
    if (!sent) return;
    const t = setTimeout(() => setSent(false), 4000);
    return () => clearTimeout(t);
  }, [sent]);

  const send = async () => {
    if (!message.trim()) return;
    await saveReport({ ...report, message });
    requestSync();
    setMessage('');
    setSent(true);
    dialog.current?.close();
  };

  return (
    <>
      <button
        type="button"
        className="report-link body-small"
        onClick={() => dialog.current?.showModal()}
      >
        {sent ? 'Thanks, report sent' : 'Report a mistake'}
      </button>
      <dialog ref={dialog} className="report-dialog" aria-labelledby={titleId}>
        <form
          method="dialog"
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <h2 id={titleId} className="h3-bold">
            Report a mistake
          </h2>
          <p className="body-small">{intro}</p>
          <label className="field" htmlFor={fieldId}>
            <span className="body-small-bold">What&apos;s wrong</span>
            <textarea
              id={fieldId}
              className="field-input"
              rows={4}
              maxLength={1000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={placeholder}
              required
            />
          </label>
          <div className="report-actions">
            <button
              type="button"
              className="btn btn-missed"
              onClick={() => dialog.current?.close()}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!message.trim()}>
              Send
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
