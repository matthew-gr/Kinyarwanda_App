// Tiny publish and subscribe channels between the data layer and the screens.

type Listener = () => void;

function channel() {
  const listeners = new Set<Listener>();
  return {
    emit: () => listeners.forEach((l) => l()),
    on: (l: Listener) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
  };
}

/** An answer was saved on this device and is waiting to upload. */
export const answerSaved = channel();

/** Progress changed under the screens, for example answers arrived from another device. */
export const progressChanged = channel();
