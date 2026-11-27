import { useSyncExternalStore } from 'react';
import { getDebugMode, onDebugMode } from '../data/debugMode';

/** Whether debug mode is on (decision 202), kept in step with the Profile switch. */
export const useDebugMode = (): boolean =>
  useSyncExternalStore(onDebugMode, getDebugMode, getDebugMode);
