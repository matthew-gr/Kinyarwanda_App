-- The vocabulary plan (docs/vocabulary-plan.md): every item gets topic tags and whether it is
-- picturable. A word's band comes from its rank and is stored as its tier. The topic list
-- itself lives in src/engine/vocabulary.ts, so every device has it offline (decision 158).

alter table public.items
  add column tags text[] not null default '{}',
  add column picturable boolean not null default false;

grant insert (tags, picturable) on public.items to authenticated;
grant update (tags, picturable) on public.items to authenticated;
