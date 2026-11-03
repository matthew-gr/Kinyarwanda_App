import { useRegisterSW } from 'virtual:pwa-register/react';

/** How often an open app checks for a new version. */
const CHECK_MS = 60 * 60 * 1000;

/**
 * Registers the service worker, which keeps the app working offline. A new version waits
 * until the learner taps Update, so it never reloads in the middle of a card.
 */
export function UpdateBanner() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration) setInterval(() => void registration.update(), CHECK_MS);
    },
  });
  if (!needRefresh) return null;
  return (
    <div className="update-banner" role="status">
      <p className="body-small">A new version of the app is ready.</p>
      <button
        type="button"
        className="btn btn-primary update-btn"
        onClick={() => void updateServiceWorker(true)}
      >
        Update
      </button>
      <button
        type="button"
        className="btn btn-missed update-btn"
        onClick={() => setNeedRefresh(false)}
      >
        Later
      </button>
    </div>
  );
}
