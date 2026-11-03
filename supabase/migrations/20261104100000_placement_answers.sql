-- The placement check (decision 177) records each word it finds known as a "placement" answer,
-- so every device replays the same pre-learned words into Review.
alter table public.answer_events drop constraint answer_events_module_check;
alter table public.answer_events add constraint answer_events_module_check
  check (module in ('learn', 'review', 'placement'));
