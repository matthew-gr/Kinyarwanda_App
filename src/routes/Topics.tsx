// Topics (decision 176): each topic with how many of its words are learned, and choosing one
// to work on next in Learn. One topic at a time; the common order carries on underneath.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { AppBar } from '../components/AppBar';
import { PracticeRow } from '../components/PracticeRow';
import { chooseTopic, loadTopics, type TopicsView } from '../data/topics';
import { useProgressVersion } from './useProgressVersion';

const TONES = ['green', 'blue', 'yellow'] as const;

export function Topics() {
  const navigate = useNavigate();
  const [view, setView] = useState<TopicsView | null>(null);
  const version = useProgressVersion();

  useEffect(() => {
    let alive = true;
    void loadTopics().then((v) => {
      if (alive) setView(v);
    });
    return () => {
      alive = false;
    };
  }, [version]);

  const open = view !== null && view.firstBand.learned >= view.firstBand.total;
  const focus = view?.topics.find((t) => t.topic === view.focus) ?? null;

  const choose = async (topic: string | null) => {
    await chooseTopic(topic);
    if (topic) navigate('/learn/words');
    else setView(await loadTopics());
  };

  return (
    <main className="screen screen-topics">
      <AppBar title="Topics" onBack={() => navigate('/')} backLabel="Back to Home" />
      {view === null ? null : (
        <div className="stack">
          {!open ? (
            <section className="panel">
              <p className="body">
                Topics open once you&rsquo;ve learned the first {view.firstBand.total} words (
                {view.firstBand.learned} of {view.firstBand.total} so far). Already know some
                Kinyarwanda? The placement check on Profile can place you past them.
              </p>
            </section>
          ) : focus ? (
            <section className="panel">
              <p className="body">
                Learning <strong>{focus.label}</strong> next: {focus.learned} of {focus.total}{' '}
                learned. Its new words come first in Learn until you choose another topic.
              </p>
              <div className="admin-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => navigate('/learn/words')}
                >
                  Learn {focus.label}
                </button>
                <button type="button" className="btn btn-missed" onClick={() => void choose(null)}>
                  Back to the common order
                </button>
              </div>
            </section>
          ) : (
            <p className="body">
              Choose a topic to learn its words next. The most common words carry on once it is
              done.
            </p>
          )}
          <div className="rows">
            {view.topics.map((t, i) => {
              const done = t.learned >= t.total;
              return (
                <PracticeRow
                  key={t.topic}
                  title={t.topic === view.focus ? `${t.label} (now)` : t.label}
                  tone={TONES[i % TONES.length]}
                  subtitle={`${t.learned} of ${t.total} learned${done ? ' · done' : ''}`}
                  progress={t.total ? t.learned / t.total : 0}
                  locked={!open || done}
                  onClick={open && !done ? () => void choose(t.topic) : undefined}
                />
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
