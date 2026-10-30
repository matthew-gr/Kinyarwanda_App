// Writes a migration that loads src/data/seed/content.json into the Supabase content tables.
// Rows that already exist are left alone, so edits made in the admin screens are never undone.
//
//   node scripts/content-sql.ts <migration file name>

import { readFileSync, writeFileSync } from 'node:fs';

const name = process.argv[2];
if (!name) throw new Error('Usage: node scripts/content-sql.ts <migration file name>');

const content = JSON.parse(
  readFileSync(new URL('../src/data/seed/content.json', import.meta.url), 'utf8'),
) as { items: object[]; item_forms: object[] };

const literal = (rows: object[]) => `'${JSON.stringify(rows).replaceAll("'", "''")}'::jsonb`;

const sql = `-- AI-drafted course content, from src/data/seed/content.json (scripts/content-sql.ts).
-- Existing rows are kept, so admin edits are never overwritten.

insert into public.items
  select * from jsonb_populate_recordset(null::public.items, ${literal(content.items)})
  on conflict (id) do nothing;

insert into public.item_forms
  select * from jsonb_populate_recordset(null::public.item_forms, ${literal(content.item_forms)})
  on conflict (id) do nothing;
`;

writeFileSync(new URL(`../supabase/migrations/${name}`, import.meta.url), sql);
console.log(`Wrote supabase/migrations/${name}`);
