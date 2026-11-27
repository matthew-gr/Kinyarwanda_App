// The parts of a flashcard that come from the course: the pronunciation guide, the example or
// breakdown, the Report a mistake form, and asking for the audio to be re-recorded.

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import {
  audioCheckOf,
  onAudioChecks,
  rerecordRequest,
  setAudioCheck,
  setRerecordRequest,
} from '../data/audioChecks';
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
    </>
  );
}

/** Sends a re-record request for a form; the outcome is kept (audioChecks.ts). */
async function sendRerecord(formId: string): Promise<void> {
  const r = await requestRerecord(formId);
  setRerecordRequest(
    formId,
    !r.queued
      ? 'Re-record requested; an admin will check it'
      : r.waiting === undefined
        ? 'Re-recorded with the queue'
        : `Queued for re-recording (${r.waiting} of ${r.batch ?? 15})`,
  );
}

/**
 * Under a card with audio, front and back (decisions 205, 207 and 211): say whether the
 * recording sounds right, which turns its play button green, or wrong, which turns it red,
 * stops the clip playing by itself and asks for it to be made again, in the same tap; or just
 * ask for it to be made again.
 */
export function AudioCheck({ form }: { form: ItemForm }) {
  const check = useSyncExternalStore(onAudioChecks, () => audioCheckOf(form.id));
  const sent = useSyncExternalStore(onAudioChecks, () => rerecordRequest(form.id));
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  if (!form.audio_path) return null;
  const rerecord = async () => {
    setBusy(true);
    setFailed(null);
    try {
      await sendRerecord(form.id);
    } catch (e) {
      setFailed(`Couldn’t send the re-record request: ${errorText(e)}`);
    } finally {
      setBusy(false);
    }
  };
  const undo = (
    <button
      type="button"
      className="report-link body-small"
      onClick={() => setAudioCheck(form.id, null)}
    >
      Undo
    </button>
  );
  return (
    <div className="audio-check body-small">
      {check === 'ok' ? (
        <>
          <span>✓ You confirmed this recording.</span>
          {undo}
        </>
      ) : check === 'wrong' ? (
        <>
          <span>✗ You marked this recording wrong. It plays only when you tap it.</span>
          {undo}
        </>
      ) : (
        <>
          <span>Does the recording say this?</span>
          <button
            type="button"
            className="report-link body-small"
            onClick={() => setAudioCheck(form.id, 'ok')}
          >
            Sounds right
          </button>
          <button
            type="button"
            className="report-link body-small"
            onClick={() => {
              setAudioCheck(form.id, 'wrong');
              if (!sent && !busy) void rerecord();
            }}
          >
            Sounds wrong
          </button>
        </>
      )}
      {/* A request sent earlier stays shown at the card's next review (learner feedback). */}
      <button
        type="button"
        className="report-link body-small"
        disabled={busy || sent !== null}
        onClick={() => void rerecord()}
      >
        {busy
          ? 'Sending…'
          : (sent ?? (failed ? 'Try the re-record request again' : 'Re-record audio'))}
      </button>
      {failed && !sent ? <span role="alert">{failed}</span> : null}
    </div>
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

/** A card's picture or emoji (decisions 188 and 202); see `hasPicture`. */
export function CardPicture({ item }: { item: Item }) {
  if (item.picture) return <img src={item.picture} alt="" />;
  return (
    <span className="kn-flash-emoji" aria-hidden="true">
      {item.emoji}
    </span>
  );
}
