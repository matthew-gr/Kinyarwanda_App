// DEVELOPMENT SEED DATA: NOT VALIDATED. These words, forms and translations have not been
// checked by a native speaker. They exist only to build and test Learn, and are replaced by
// AI-drafted, reviewable content in Prompt 5. Every row carries status "dev" and source "dev".

import type { Item, ItemForm } from '../engine/types';
import seed from './seed/items.dev.json';

export const seedItems = seed.items as Item[];
export const seedForms = seed.item_forms as ItemForm[];
