// Common 2000, second part: ranks 1,501 to 2,000, drafted in four files by area:
//   common-2000-home.ts     house, food, clothes, body and health
//   common-2000-nature.ts   nature, animals, farming, weather, places, transport and tools
//   common-2000-society.ts  work, money, school, church, government, law, people and family
//   common-2000-general.ts  everyday and abstract verbs, feelings, descriptions, time, function words
// They are dealt out a cluster at a time from each area in turn, so every hundred mixes them,
// with the picturable clusters first.
//
// AI DRAFT. Written by Claude, not yet checked by a native speaker.

import { COMMON_2000_GENERAL } from './common-2000-general.ts';
import { COMMON_2000_HOME } from './common-2000-home.ts';
import { COMMON_2000_NATURE } from './common-2000-nature.ts';
import { COMMON_2000_SOCIETY } from './common-2000-society.ts';
import type { Cluster } from './words.ts';

const AREAS = [COMMON_2000_HOME, COMMON_2000_NATURE, COMMON_2000_SOCIETY, COMMON_2000_GENERAL];

function dealOut(areas: Cluster[][]): Cluster[] {
  const out: Cluster[] = [];
  for (let i = 0; areas.some((a) => i < a.length); i++)
    for (const a of areas) {
      const c = a[i];
      if (c) out.push(c);
    }
  return out;
}

const dealt = dealOut(AREAS);
const HUNDRED = 100;

/** The clusters in order: each run of about a hundred words puts its picturable clusters first. */
export const COMMON_2000: Cluster[] = (() => {
  const out: Cluster[] = [];
  let run: Cluster[] = [];
  let size = 0;
  const flush = () => {
    out.push(...run.filter((c) => c.picturable), ...run.filter((c) => !c.picturable));
    run = [];
    size = 0;
  };
  for (const c of dealt) {
    run.push(c);
    size += c.words.length;
    if (size >= HUNDRED) flush();
  }
  flush();
  return out;
})();
