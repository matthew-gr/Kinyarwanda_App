import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { isCounting } from '../data/activity';
import { setDebugMode } from '../data/debugMode';
import { useDebugMode } from './useDebugMode';

/**
 * In debug mode, a dot in the top corner: green while time learning is being counted, red while
 * it isn't (decisions 190, 191 and 202).
 */
export function DebugDot() {
  const debug = useDebugMode();
  const [counting, setCounting] = useState(false);
  useEffect(() => {
    if (!debug) return;
    const check = () => setCounting(isCounting(Date.now()));
    check();
    const t = setInterval(check, 1000);
    // A tap counts at once, so the dot turns green without waiting for the next check.
    const soon = () => setTimeout(check, 0);
    window.addEventListener('pointerdown', soon, true);
    window.addEventListener('keydown', soon, true);
    return () => {
      clearInterval(t);
      window.removeEventListener('pointerdown', soon, true);
      window.removeEventListener('keydown', soon, true);
    };
  }, [debug]);
  if (!debug) return null;
  const label = counting ? 'Time is being counted' : 'Time is not being counted';
  return (
    <span
      className={`debug-dot ${counting ? 'debug-dot-on' : 'debug-dot-off'}`}
      role="img"
      aria-label={label}
      title={label}
    />
  );
}

/** The Profile switch, and in debug mode the link to the list of memory hints (decision 216). */
export function DebugSwitch() {
  const debug = useDebugMode();
  return (
    <>
      <DebugLabel debug={debug} />
      {debug ? (
        <Link className="report-link body-small" to="/hints">
          Memory hints and word families
        </Link>
      ) : null}
    </>
  );
}

function DebugLabel({ debug }: { debug: boolean }) {
  return (
    <label className="debug-switch body" htmlFor="debug-mode">
      <input
        id="debug-mode"
        type="checkbox"
        checked={debug}
        onChange={(e) => setDebugMode(e.target.checked)}
      />
      <span>
        <span className="body-bold">Debug mode</span>
        <span className="body-small debug-switch-help">
          A dot in the corner shows whether time learning is being counted (green) or not (red).
          Verb Builder shows what is still to master.
        </span>
      </span>
    </label>
  );
}
