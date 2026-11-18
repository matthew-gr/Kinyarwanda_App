// Records a word's audio on this phone (decision 188), so a learner can ask a native speaker to
// say it. Up to 10 seconds; the recording can be played back and made again before saving.

import { useEffect, useRef, useState } from 'react';
import { RECORDING_MAX_MS, recordingProblem } from '../data/myWordMedia';

/** The first recording format this browser can make: WebM on Android, MP4 on iPhone. */
function recordingType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  return ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg'].find((t) =>
    MediaRecorder.isTypeSupported(t),
  );
}

export function Recorder({
  url,
  onChange,
}: {
  /** The recording now, to play: one saved before, or one just made. */
  url: string | null;
  /** A new recording, or null to remove it. */
  onChange: (blob: Blob | null) => void;
}) {
  const [state, setState] = useState<'idle' | 'starting' | 'recording'>('idle');
  const [left, setLeft] = useState(RECORDING_MAX_MS);
  const [error, setError] = useState('');
  const recorder = useRef<MediaRecorder | null>(null);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanUp = () => {
    if (stopTimer.current) clearTimeout(stopTimer.current);
    if (tick.current) clearInterval(tick.current);
    stopTimer.current = null;
    tick.current = null;
  };

  // Stop the microphone if the form closes mid-recording.
  useEffect(
    () => () => {
      cleanUp();
      if (recorder.current?.state === 'recording') recorder.current.stop();
    },
    [],
  );

  const supported =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined';

  const start = async () => {
    setError('');
    setState('starting');
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setState('idle');
      setError('The microphone isn’t available. Allow it for this site in the browser settings.');
      return;
    }
    const type = recordingType();
    const rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    rec.onstop = () => {
      cleanUp();
      stream.getTracks().forEach((t) => t.stop());
      setState('idle');
      const blob = new Blob(chunks, { type: rec.mimeType || type || 'audio/webm' });
      const problem = recordingProblem(blob);
      if (problem) setError(problem);
      else onChange(blob);
    };
    recorder.current = rec;
    rec.start();
    setState('recording');
    const began = Date.now();
    setLeft(RECORDING_MAX_MS);
    tick.current = setInterval(() => setLeft(RECORDING_MAX_MS - (Date.now() - began)), 250);
    stopTimer.current = setTimeout(() => rec.stop(), RECORDING_MAX_MS);
  };

  const stop = () => {
    if (recorder.current?.state === 'recording') recorder.current.stop();
  };

  if (!supported) {
    return <p className="body-small">This browser can’t record audio.</p>;
  }

  return (
    <div className="recorder">
      {state === 'recording' ? (
        <button type="button" className="btn btn-primary" onClick={stop}>
          Stop ({Math.max(0, Math.ceil(left / 1000))} s)
        </button>
      ) : (
        <div className="admin-actions">
          <button
            type="button"
            className="btn btn-missed"
            disabled={state === 'starting'}
            onClick={() => void start()}
          >
            {url ? 'Record again' : 'Record'}
          </button>
          {url ? (
            <>
              <button
                type="button"
                className="btn btn-missed"
                onClick={() => void new Audio(url).play().catch(() => undefined)}
              >
                Play
              </button>
              <button type="button" className="btn btn-missed" onClick={() => onChange(null)}>
                Remove recording
              </button>
            </>
          ) : null}
        </div>
      )}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
