-- Decision 207: American spelling for gray across the app (learner feedback of 27 November).
-- Updating the rows restamps updated_at (stamp_content), so every device downloads them.

update public.items set en = 'ash; gray' where id = 'c7d38424-b8b6-4aa2-8e41-ab226efd81f7' and en = 'ash; grey';

update public.item_forms set en = 'ash; gray' where id = 'fa2f6ae2-35d9-46e9-a4f7-be398fe8088e' and en = 'ash; grey'
