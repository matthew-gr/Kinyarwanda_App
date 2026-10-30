// The listening test from the spec's audio plan: the same 20 items in each candidate voice,
// side by side, so the best one can be chosen before any course audio is made.

import { useState } from 'react';
import { errorText, listVoices, makeSample, type SampleVoice } from '../../data/admin';
import { bundledForms, bundledItems } from '../../data/content';
import { playAudio } from '../cardText';
import { AdminShell, ErrorLine } from './AdminShell';

const STORE = 'kinyarwanda.voice-test';
const MODELS = ['eleven_v3', 'eleven_multilingual_v2', 'eleven_flash_v2_5'];

/** The 20 test items: the first 14 words, a plural, a verb form, and the first 4 phrases. */
const SAMPLE = (() => {
  const base = (id: string) => bundledForms.find((f) => f.item_id === id && f.is_base)!;
  const words = bundledItems.filter((i) => i.kind === 'word' && i.rank <= 14);
  const phrases = bundledItems.filter((i) => i.kind === 'phrase' && i.rank <= 4);
  const extra = bundledForms.filter((f) => f.text === 'abana' || f.text === 'turiruka');
  return [...words.map((w) => base(w.id)), ...extra, ...phrases.map((p) => base(p.id))].map(
    (f) => ({ key: f.text, text: f.text, en: f.en }),
  );
})();

interface Trial {
  voice: SampleVoice;
  clips: Record<string, string>;
}

function loadTrials(): Trial[] {
  try {
    return JSON.parse(localStorage.getItem(STORE) ?? '[]') as Trial[];
  } catch {
    return [];
  }
}

function saveTrials(trials: Trial[]): void {
  try {
    localStorage.setItem(STORE, JSON.stringify(trials));
  } catch {
    // Private windows can refuse storage; the trials still show until the page closes.
  }
}

export function VoiceTest() {
  const [trials, setTrials] = useState<Trial[]>(loadTrials);
  const [provider, setProvider] = useState<SampleVoice['provider']>('elevenlabs');
  const [voices, setVoices] = useState<{ voice_id: string; name: string }[]>([]);
  const [voiceId, setVoiceId] = useState('');
  const [model, setModel] = useState(MODELS[0]!);
  const [httpLabel, setHttpLabel] = useState('mms-kin');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chosen, setChosen] = useState<SampleVoice | null>(null);

  const load = async () => {
    setError(null);
    try {
      const { voices: list } = await listVoices();
      setVoices(list);
      if (list[0]) setVoiceId(list[0].voice_id);
    } catch (e) {
      setError(errorText(e));
    }
  };

  const run = async () => {
    setError(null);
    const name = voices.find((v) => v.voice_id === voiceId)?.name ?? voiceId;
    const voice: SampleVoice =
      provider === 'elevenlabs'
        ? { provider, voice_id: voiceId, model_id: model, label: `${name}-${model}` }
        : { provider, label: httpLabel };
    setBusy(true);
    try {
      const res = await makeSample(
        voice,
        SAMPLE.map(({ key, text }) => ({ key, text })),
      );
      const trial: Trial = {
        voice: { ...voice, label: res.label },
        clips: Object.fromEntries(res.clips.map((c) => [c.key, `${c.url}?v=${Date.now()}`])),
      };
      const next = [...trials.filter((t) => t.voice.label !== res.label), trial];
      setTrials(next);
      saveTrials(next);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const forget = (label: string) => {
    const next = trials.filter((t) => t.voice.label !== label);
    setTrials(next);
    saveTrials(next);
  };

  return (
    <AdminShell title="Voice test" back="/admin">
      <section className="panel form" aria-labelledby="try-title">
        <h2 id="try-title" className="h2-bold">
          Try a voice
        </h2>
        <p className="body-small">
          Each try voices the same {SAMPLE.length} items. No provider lists Kinyarwanda, so listen
          for the sounds English voices get wrong: r, c and the vowels.
        </p>
        <label className="field">
          <span className="body-small-bold">Provider</span>
          <select
            className="field-input field-select"
            value={provider}
            onChange={(e) => setProvider(e.target.value as SampleVoice['provider'])}
          >
            <option value="elevenlabs">ElevenLabs</option>
            <option value="http">Other endpoint (the TTS_HTTP_URL secret)</option>
          </select>
        </label>
        {provider === 'elevenlabs' ? (
          <>
            {voices.length === 0 ? (
              <button type="button" className="btn btn-missed" onClick={() => void load()}>
                Load voices
              </button>
            ) : (
              <label className="field">
                <span className="body-small-bold">Voice</span>
                <select
                  className="field-input field-select"
                  value={voiceId}
                  onChange={(e) => setVoiceId(e.target.value)}
                >
                  {voices.map((v) => (
                    <option key={v.voice_id} value={v.voice_id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="field">
              <span className="body-small-bold">Model</span>
              <select
                className="field-input field-select"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              >
                {MODELS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <label className="field">
            <span className="body-small-bold">Name for this voice</span>
            <input
              className="field-input"
              value={httpLabel}
              onChange={(e) => setHttpLabel(e.target.value)}
            />
          </label>
        )}
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy || (provider === 'elevenlabs' && !voiceId)}
          onClick={() => void run()}
        >
          {busy ? 'Making samples…' : 'Make samples'}
        </button>
        <ErrorLine error={error} />
      </section>

      {trials.length > 0 ? (
        <section className="panel" aria-labelledby="listen-title">
          <h2 id="listen-title" className="h2-bold">
            Listen
          </h2>
          <div className="admin-table-wrap">
            <table className="admin-table body-small">
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  {trials.map((t) => (
                    <th key={t.voice.label} scope="col">
                      {t.voice.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SAMPLE.map((s) => (
                  <tr key={s.key}>
                    <th scope="row">
                      <span lang="rw">{s.text}</span>
                      <br />
                      {s.en}
                    </th>
                    {trials.map((t) => (
                      <td key={t.voice.label}>
                        {t.clips[s.key] ? (
                          <button
                            type="button"
                            className="report-link body-small"
                            aria-label={`Play ${s.text}, ${t.voice.label}`}
                            onClick={() => playAudio(t.clips[s.key]!)}
                          >
                            Play
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th scope="row">Choose</th>
                  {trials.map((t) => (
                    <td key={t.voice.label}>
                      <button
                        type="button"
                        className="report-link body-small"
                        onClick={() => setChosen(t.voice)}
                      >
                        Use
                      </button>{' '}
                      <button
                        type="button"
                        className="report-link body-small"
                        onClick={() => forget(t.voice.label)}
                      >
                        Remove
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          {chosen ? (
            <div className="stack">
              <p className="body">
                To make the course audio with <strong>{chosen.label}</strong>, store this as the{' '}
                <code>TTS_VOICE</code> secret, then use Make missing audio on the Admin page:
              </p>
              <pre className="admin-code">
                {JSON.stringify({
                  provider: chosen.provider,
                  ...(chosen.voice_id ? { voice_id: chosen.voice_id } : {}),
                  ...(chosen.model_id ? { model_id: chosen.model_id } : {}),
                  label: chosen.label,
                })}
              </pre>
            </div>
          ) : null}
        </section>
      ) : null}
    </AdminShell>
  );
}
