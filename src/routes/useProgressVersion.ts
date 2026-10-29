import { useEffect, useState } from 'react';
import { progressChanged } from '../data/signals';

/** Counts up whenever progress changes under the screen, for example after a sync. */
export function useProgressVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => progressChanged.on(() => setVersion((v) => v + 1)), []);
  return version;
}
