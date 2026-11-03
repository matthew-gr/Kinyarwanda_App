// The listening test from the spec's audio plan: the same 20 items in each candidate voice,
// side by side, so the best one can be chosen before any course audio is made.

import { useState } from 'react';
import { spokenSpelling } from '../../../supabase/functions/_shared/spoken';
import { errorText, listVoices, makeSample, type SampleVoice } from '../../data/admin';
import { bundledForms, bundledItems } from '../../data/content';
import { playAudio } from '../cardText';
import { AdminShell, ErrorLine } from './AdminShell';

const STORE = 'kinyarwanda.voice-test';
const LINES_STORE = 'kinyarwanda.voice-test-lines';
const DEFAULT_LINES = 'ku isoko\nibiryo\narateka';
const MODELS = ['eleven_v3', 'eleven_multilingual_v2', 'eleven_flash_v2_5'];
const GEMINI_MODELS = ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts'];
/** Gemini's 30 prebuilt voices, with Google's one-word description. */
const GEMINI_VOICES = [
  'Kore (firm)',
  'Puck (upbeat)',
  'Charon (informative)',
  'Zephyr (bright)',
  'Fenrir (excitable)',
  'Leda (youthful)',
  'Orus (firm)',
  'Aoede (breezy)',
  'Callirrhoe (easy-going)',
  'Autonoe (bright)',
  'Enceladus (breathy)',
  'Iapetus (clear)',
  'Umbriel (easy-going)',
  'Algieba (smooth)',
  'Despina (smooth)',
  'Erinome (clear)',
  'Algenib (gravelly)',
  'Rasalgethi (informative)',
  'Laomedeia (upbeat)',
  'Achernar (soft)',
  'Alnilam (firm)',
  'Schedar (even)',
  'Gacrux (mature)',
  'Pulcherrima (forward)',
  'Achird (friendly)',
  'Zubenelgenubi (casual)',
  'Vindemiatrix (gentle)',
  'Sadachbia (lively)',
  'Sadaltager (knowledgeable)',
  'Sulafat (warm)',
];
/** Gemini and Pindo read Kinyarwanda, so they get the real spelling, not the respelling. */
const readsKinyarwanda = (p: SampleVoice['provider']) => p === 'gemini' || p === 'pindo';

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

function loadLines(): string {
  try {
    return localStorage.getItem(LINES_STORE) ?? DEFAULT_LINES;
  } catch {
    return DEFAULT_LINES;
  }
}

/** The lines typed in, one item each, after the 20 fixed ones. */
const ownItems = (lines: string) =>
  [...new Set(lines.split('\n').map((l) => l.trim()))]
    .filter(Boolean)
    .slice(0, 5)
    .map((l) => ({ key: `own-${l}`, text: l, en: 'Your line' }));

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
  const [geminiModel, setGeminiModel] = useState(GEMINI_MODELS[0]!);
  const [geminiVoice, setGeminiVoice] = useState('Kore');
  const [rate, setRate] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chosen, setChosen] = useState<SampleVoice | null>(null);
  const [stress, setStress] = useState(true);
  const [lines, setLines] = useState(loadLines);
  const items = [...SAMPLE, ...ownItems(lines)];

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
    const tag = stress ? '-stress' : '';
    const voice: SampleVoice =
      provider === 'elevenlabs'
        ? { provider, voice_id: voiceId, model_id: model, label: `${name}-${model}${tag}`, stress }
        : provider === 'gemini'
          ? {
              provider,
              voice_name: geminiVoice,
              model_id: geminiModel,
              label: `${geminiVoice}-${geminiModel}`,
            }
          : provider === 'pindo'
            ? { provider, speech_rate: rate, label: `pindo-${rate}` }
            : { provider, label: `${httpLabel}${tag}`, stress };
    setBusy(true);
    try {
      const res = await makeSample(
        voice,
        items.map(({ key, text }) => ({ key, text })),
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
          Each try voices the same {SAMPLE.length} items, and your own lines. ElevenLabs doesn't
          know Kinyarwanda, so it gets the words respelled; Gemini and Pindo read Kinyarwanda and
          get them as written.
        </p>
        <label className="field">
          <span className="body-small-bold">Provider</span>
          <select
            className="field-input field-select"
            value={provider}
            onChange={(e) => setProvider(e.target.value as SampleVoice['provider'])}
          >
            <option value="elevenlabs">ElevenLabs</option>
            <option value="gemini">Gemini (the GEMINI_API_KEY secret)</option>
            <option value="pindo">Pindo (Kinyarwanda)</option>
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
        ) : provider === 'gemini' ? (
          <>
            <label className="field">
              <span className="body-small-bold">Voice</span>
              <select
                className="field-input field-select"
                value={geminiVoice}
                onChange={(e) => setGeminiVoice(e.target.value)}
              >
                {GEMINI_VOICES.map((v) => (
                  <option key={v} value={v.split(' ')[0]}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="body-small-bold">Model</span>
              <select
                className="field-input field-select"
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
              >
                {GEMINI_MODELS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
          </>
        ) : provider === 'pindo' ? (
          <label className="field">
            <span className="body-small-bold">Speech rate (0.5 to 2)</span>
            <input
              className="field-input"
              type="number"
              min={0.5}
              max={2}
              step={0.1}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value) || 1)}
            />
          </label>
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
        {readsKinyarwanda(provider) ? null : (
          <label className="field">
            <input type="checkbox" checked={stress} onChange={(e) => setStress(e.target.checked)} />{' '}
            <span className="body-small-bold">
              Mark the stressed syllable (the one before last, in capitals)
            </span>
          </label>
        )}
        <label className="field">
          <span className="body-small-bold">Your own lines, one per line (up to 5)</span>
          <textarea
            className="field-input"
            rows={4}
            value={lines}
            lang="rw"
            onChange={(e) => {
              setLines(e.target.value);
              try {
                localStorage.setItem(LINES_STORE, e.target.value);
              } catch {
                // Kept until the page closes.
              }
            }}
          />
        </label>
        <p className="body-small">
          Sent to the voice as:{' '}
          {ownItems(lines)
            .map((i) => (readsKinyarwanda(provider) ? i.text : spokenSpelling(i.text, stress)))
            .join(' · ')}
        </p>
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
                {items.map((s) => (
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
                  ...(chosen.voice_name ? { voice_name: chosen.voice_name } : {}),
                  ...(chosen.model_id ? { model_id: chosen.model_id } : {}),
                  ...(chosen.speech_rate ? { speech_rate: chosen.speech_rate } : {}),
                  label: chosen.label,
                  ...(chosen.stress === false ? { stress: false } : {}),
                })}
              </pre>
            </div>
          ) : null}
        </section>
      ) : null}
    </AdminShell>
  );
}
