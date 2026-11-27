-- Decision 214: two proverbs retired at Jonathan's request (27 November 2026). Retired rows stay,
-- so every device learns they are gone; updating them restamps updated_at (stamp_content).

update public.items set retired = true where kind = 'phrase' and base in ('Ukurusha umugore akurusha urugo.', 'Ak’imuhana kaza imvura ihise.');

update public.item_forms set retired = true where item_id in (select id from public.items where kind = 'phrase' and base in ('Ukurusha umugore akurusha urugo.', 'Ak’imuhana kaza imvura ihise.'))
