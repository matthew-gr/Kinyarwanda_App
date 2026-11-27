-- Decision 208: streak freezes earned by perfect Review rounds (learner feedback of 27
-- November). Each finished Review round goes in drill_scores as 'review_round' (answers: the
-- round's cards, correct: those known), so every device can count perfect rounds in a row.

alter table public.drill_scores drop constraint drill_scores_drill_check;

alter table public.drill_scores add constraint drill_scores_drill_check check (drill in ('speed_speaking', 'number_listening', 'quick_recall', 'review_round'))
