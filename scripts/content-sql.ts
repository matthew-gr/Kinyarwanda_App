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

create temp table draft_items on commit drop as
  select * from jsonb_populate_recordset(null::public.items, ${literal(content.items)});
create temp table draft_forms on commit drop as
  select * from jsonb_populate_recordset(null::public.item_forms, ${literal(content.item_forms)});

insert into public.items select * from draft_items on conflict (id) do nothing;
insert into public.item_forms select * from draft_forms on conflict (id) do nothing;

-- Items that have no tags yet get the drafted ones; tags an admin has set are kept.
update public.items i set tags = d.tags, picturable = d.picturable
  from draft_items d
  where i.id = d.id and i.tags = '{}' and d.tags <> '{}';

-- Rows still carrying the draft's date are stamped now, so devices that synced after that date
-- still pull them (sync asks for rows updated since its last pull).
update public.items i set updated_at = now()
  from draft_items d where i.id = d.id and i.updated_at = d.updated_at;
update public.item_forms f set updated_at = now()
  from draft_forms d where f.id = d.id and f.updated_at = d.updated_at;
`;

writeFileSync(new URL(`../supabase/migrations/${name}`, import.meta.url), sql);
console.log(`Wrote supabase/migrations/${name}`);
