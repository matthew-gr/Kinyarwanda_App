// The Verb Builder's verbs and stored forms, as drafted by scripts/draft-verbs.ts. AI drafts:
// every form carries a confidence until a native speaker checks it.

import type { Verb, VerbForm } from '../engine/verbs';
import seed from './seed/verbs.json';

export const bundledVerbs = seed.verbs as Verb[];
export const bundledVerbForms = seed.verb_forms as VerbForm[];
