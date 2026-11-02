-- Prompt 9: Quick Recall.
--
-- Quick Recall sessions go in drill_scores beside the other drills. Level 1 reads the word,
-- level 2 hears it. on_time is its speed score: right answers inside the target time.

alter table public.drill_scores drop constraint drill_scores_drill_check;
alter table public.drill_scores add constraint drill_scores_drill_check
  check (drill in ('speed_speaking', 'number_listening', 'quick_recall'));

alter table public.drill_scores
  add column on_time integer check (on_time between 0 and correct);

grant insert (on_time) on public.drill_scores to authenticated;
