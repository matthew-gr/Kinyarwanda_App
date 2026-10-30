# Decisions and open questions

Choices made while building the app that the prompts or the product spec did not settle: Prompt 1 (foundation and Learn), then Prompt 2 (Review), then Prompt 3 (accounts and sync), then Prompt 4 (Home, Profile, History, daily goal, streaks). Each takes the simplest reading. Questions for Matt are at the end.

## Learn engine

1. **`nextStep` returns `{ step, state }`, not just the step.** The prompt's signature returns only the step, but `createLearnState` and `applyAnswer` take no random number generator, so the shuffled round order and each test's `cardViewId` can only be decided inside `nextStep`. To make "reload lands on the same card" exact, `nextStep` records the issued step as `state.current` and returns the updated state. Calling it again, or after a reload, returns the same step and the same `cardViewId` without touching the generator.
2. **An introduction counts as an appearance** for the no-repeat rule. A new round never starts with the item shown last, whether that was a test or an introduction, so a card is never introduced and then immediately tested.
3. **Rounds are built when the previous one ends.** New items are introduced at the end of each round (rule 6) and shown before the next round starts, so new items join that next round.
4. **Tiers are computed from rank and `tierSizes`; the last size repeats.** Words use `[100, 400]` (the first 100, then up to 500); phrases use `[25]`, so every batch is 25. Any words after 500 would fall into further tiers of 400, which is a placeholder: the spec has the learner choose topic pools after 500, which is not built yet.
5. **The next tier opens automatically** when every item in the current tier has graduated. "Done" shows only when every item in the deck has graduated, so with today's 22 seed words and 10 phrases the done screen appears after the whole deck is learned.
6. **The engine keeps the item order it was created with.** When the course changes, `reconcileOrder` moves a saved deck onto it (decision 70).
7. **Duplicate answers** are rejected twice over: the engine ignores any `cardViewId` other than the one on screen, and `answer_events.card_view_id` has a unique index.

## Forms engine

8. **A verb's infinitive is never shown in a test**, matched either by `tense: 'infinitive'` or by text equal to the item's dictionary form. The seed has no infinitive forms, so this is a guard for later content.
9. **"Nouns alternate"** follows from the no-repeat rule: with exactly two allowed forms, avoiding the last one means strict alternation.
10. **The last form shown per item** is stored in the `learn_state` row (`last_form_by_item`), not in the engine state, so the Learn engine stays unaware of forms. The form on the current card is also stored (`shown_form`) so a reload shows the same form, not a new pick.
11. **The dictionary form line** ("Dictionary form: umwana (child)") shows under nouns and verbs only when the card shows a different form, to avoid repeating the same word.

## Data

12. **Seed IDs are fixed UUIDs** generated once and committed in `src/data/seed/items.dev.json`, so saved progress and the answer log keep pointing at the same items across reloads and, later, devices.
13. **amazi, ibiryo and akazi are typed as nouns with one form** (no plural was given). The other non-pair words are `other`. `noun_class` is null everywhere because the prompt gave none.
14. **Times are stored as ISO strings** (`answered_at`, `due_at`, `created_at`) to match Postgres `timestamptz` in Prompt 3. The engine works in epoch milliseconds.
15. **The profile row has a UUID** (`id`), created on first launch with `verb_level: 1` and `daily_goal: 10`.
16. **"Today's new items" on Home counts items learned (graduated) today**, from `review_items.created_at`, not items introduced today.

## Screens and design

17. **Session header labels.** The design's level slot shows "3 of 8 in play" and the timer slot shows "Streak 1 of 3" (with a flame icon) on a test, or "New card" on an introduction. The session progress bar shows the current item's streak out of 3.
18. **The card flips one way.** Tapping the front flips it to the back; the back does not flip back, since the next tap grades it.
19. **Introduction card.** "Front and back together" is drawn on the front colour (green) with the word, a rule, the meaning and the dictionary form.
20. **Grade buttons sit under the card**, ✗ on the left and ✓ on the right to match the arrow keys. Each has an icon and a word ("✗ I didn't", "✓ I knew it"), so neither relies on colour.
21. **Learn runs full screen without the bottom nav**, as the spec describes module screens. Home, Search, History and Profile have the nav.
22. **Touch targets.** Raised to 44 px where the design was smaller: the app bar back button (was 40 x 42), the notification bell, the card's play button (was 42), the bottom nav items, and the card's hint chip. Each change is marked "Changed:" in `src/components/components.css`.
23. **Bottom nav.** The drawn iPhone home indicator is removed (the phone draws its own) and safe-area padding added. The design gives the current tab no visual state; a short bar under the current icon is added so it does not rely on `aria-current` alone.
24. **Hero banner without the mascot** drops the 56 px headroom reserved for the image, and adds a progress bar for today's goal.
25. **Flashcards shrink below 302 px** on phones narrower than 342 px, instead of overflowing.
26. **Review row on Home** is shown with a dashed border and the words "Locked · Coming next", and is not a button.
27. **Learner name** is the placeholder "Learner" until accounts arrive.
28. **Tokens.** `design-system/tokens.json` is a copy of the design system's file. `npm run tokens` regenerates `src/theme/tokens.css`, including one class per text style (`.h1-bold`, `.flash-word`, `.phonetic`, ...). CI fails if the generated file is out of date.

## Review (Prompt 2)

Prompt 2 was written from the product spec's Module 2 section; the build plan names it "Review engine with the recheck rule, the Review screen, due counts".

29. **What a stage means.** An item at stage N waits stage N's interval before its next review. Learn graduates an item into stage 1 (due 5 minutes later); each correct answer moves it up one stage and schedules the new stage's interval, so the second review is 15 minutes after the first. This matches the spec's recheck example: a missed stage 10 item drops to stage 9 and, after two good rechecks, is due 2 months later.
30. **Intervals start from the answer**, not from when the item was due, so reviewing late neither shortens nor stretches the next wait.
31. **Calendar time.** Minutes and hours are exact; days and months follow the calendar in the device's time zone and keep the time of day. A month from Jan 31 is Feb 28 (or 29). Stage 11 repeats yearly.
32. **Rechecks.** A miss drops one stage (never below 1) and sets a recheck 5 minutes later; a good first recheck sets the second 1 hour later; a good second recheck puts the item back on the schedule at its current stage. A miss at either recheck drops one more stage and restarts the rechecks.
33. **The queue** is every item due now, ordered by due time, so overdue items come first, oldest first. The item just answered is skipped when anything else is due.
34. **Overdue** means due before today began; **due now** means due earlier today. Home shows those two, later today, tomorrow, and the total in Review.
35. **Words and phrases share one Review queue.** The card's WORD, VERB or PHRASE tag says which it is. Learn keeps them in separate decks as before.
36. **Forms in Review** come from the forms engine as in Learn tests: within the learner's verb level, never an infinitive, and different from the form shown at the item's last review.
37. **Reload lands on the same card.** The card on screen (its card view ID, item and form) is saved in a one-row `review_session` table. An answer, the new schedule and the cleared card are saved in one transaction; `card_view_id` stays unique, so a double tap counts once.
38. **Due times live in storage only.** The Review and Home screens set a timer for the next due time just to wake themselves up, and Home recounts when the tab comes back into view.
39. **Session header in Review**: "N due", then "Stage 3 of 11" or "Recheck 1 of 2"; the bar shows the stage out of 11. After each answer a note says what happens next ("Next review in 1 day.", "Down to stage 4. Recheck in 5 minutes.").
40. **Home's Review row** is unlocked and says "N due now", "All caught up · next in 12 minutes", or "Opens when you learn your first word". The five counts sit in a small panel under the Practice rows once anything is in Review.
41. **Database version 2** adds `recheck_step`, `updated_at` and `last_form_id` to `review_items` (existing rows are upgraded in place) and adds `review_session`.
42. **End-to-end tests wait for each new card.** Learn and Review mark the card's container with `data-card`, which changes with every card. The first CI runs failed because the test clicked an old "Next" button while the app was still saving; the tests now wait for `data-card` to change after every step. The Review test uses Playwright's page clock to skip ahead to due times.

## Accounts and sync (Prompt 3)

43. **One Supabase project**, `ujrfelmkvqckurpkqyre`, for now (Matt's call), not separate development and production projects.
44. **Email sign-in only** for now: an emailed link (Supabase's magic link, PKCE flow). Google comes later. The link has to be opened in the same browser that asked for it. Emails go through SendGrid: Supabase's Send Email hook calls the `send-email` function (`supabase/functions/send-email`), which checks the hook's Standard Webhooks signature and sends through SendGrid's v3 API from info@growrwanda.com with click and open tracking off, so the one-time link is never rewritten. The email also carries the 6-digit code. Deploy it with `supabase functions deploy send-email --no-verify-jwt --use-api` (Supabase calls hooks without a user token).
45. **The answer log is the only thing that syncs.** Each device uploads answers the server lacks and downloads answers it has not seen, in server order (`seq`). Uploads are keyed by the answer's own UUID with "insert, or do nothing if it exists", so a retried sync never adds a row.
46. **Progress is rebuilt from the log on each device** (`src/engine/progress.ts`): replaying every answer in time order (device clock, then event ID) gives the same Learn streaks, graduations and Review schedule on every device. The spec's `user_items` table is not created yet; it can be added as a server-side cache when a server feature needs progress (Stories, Prompt 10).
47. **Learn decks merge, they do not reset.** Each device keeps its own Learn round order. Items introduced on another device join this device's pool (without a second introduction), items graduated anywhere leave it, and streaks come from the log. Introductions themselves are not logged, so an item introduced but never answered on one device is not known to the other.
48. **When answers arrive from another device**, Learn, Review and Home reload their data. Only then is local progress rewritten, so a Learn round in progress on this device is not disturbed by its own sync.
49. **Sync runs** on sign-in, 1.5 seconds after each answer, when the device comes back online, when the tab becomes visible, and every minute while it is visible. Nothing in the app waits for it: answers save on the device first.
50. **Answers made before signing in** belong to the first account that signs in on that device and upload then. Signing out removes this device's progress (it is on the server); if any answers have not uploaded, Profile warns first. If a different account signs in, the previous account's local progress is cleared before syncing.
51. **The server profile wins** once it exists; the first sign-in creates it from this device's profile (verb level 1, daily goal 10).
52. **Privacy rules**, checked against the live database with two throwaway accounts in a rolled-back transaction: a learner sees and adds only their own answers and profile; answers cannot be updated or deleted; `seq` and `received_at` are set by the server only; a second answer for the same card view is rejected; signed-out requests see nothing.
53. **Response time** (in the spec's `answer_events`) is not recorded yet; nothing uses it.
54. **The two Supabase settings live in a committed `.env`** (the URL and the publishable key). Both are public by design; row level security is what protects the data. Vercel refused a `VITE_`-prefixed variable that looked like a key, so the build reads them from `.env` instead and Vercel needs no Supabase variables. A build without them runs with accounts switched off, and Profile says so.
55. **`.npmrc` sets `include=dev`**, because this machine's global `NODE_ENV=production` made `npm install <package>` remove the dev tools.

## Home, Profile and History (Prompt 4)

56. **Everything here is worked out from the answer log** (`src/engine/stats.ts`), so it matches on every device after a sync. Days follow the device's time zone.
57. **Day streak** (Matt's call): any answer in Learn or Review keeps the day. Today counts once practised; until then the streak runs to yesterday, so it does not break before the day is over. Best streak is the longest run.
58. **Daily goal** (Matt's call): counts items learned (graduated) today, words and phrases together. Settings offer 5, 10, 15, 20 or 30 a day. A change saves on the device and goes to the server on the next sync; until a change is made, the server copy wins.
59. **Badges** mark 10, 100, 500, 1,000, 2,000 and 5,000 **words** learned (phrases do not count), dated by the word that earned each. They are worked out from the log, so the spec's `achievements` table is not created yet.
60. **The Today banner** keeps the design's title, "Start Learning today", and shows reviews due now and today's goal progress beneath it.
61. **The module carousel** (Matt's call) shows all eight modules as the design's course cards. Learn and Review open; the other six say "Coming soon" in words, have dashed borders, and are not buttons. Page dots under the row follow the scroll. Learn opens the Words deck.
62. **History** shows the day streak, two 14-day bar charts (answers per day, items learned per day; one measure each, own scale, a value on hover, and a table for screen readers) and Review accuracy over 7 and 30 days.
63. **Profile** shows the day streak, words learned, phrases learned, best streak, the verb level (always 1 until the Verb Builder), the six badges in a carousel, the daily goal setting, then the account section.
64. **New design system ports**: CourseCard (with a locked state), PageDots, StatRow and AchievementCard, plus the confetti, hands-clapping, settings, time-fill and global-learning icons, copied from the design system bundle.

## AI content, audio, admin and reports (Prompt 5)

65. **I drafted the course myself, in the repo**, rather than through a server function calling Claude. `scripts/draft-content.ts` holds the drafts as compact tables and writes `src/data/seed/content.json`. Every row is `ai_draft` with source `ai:claude-opus-5-5`. No Anthropic API key is needed until Stories (Prompt 10).
66. **The first 100 words are ordered by usefulness, not counted from a corpus.** I did not download the Common Voice sentences, so the order is my judgment of frequency: greetings first, then people, food and drink, question words, numbers 1 to 10, and the 23 verbs. There are 40 nouns, 23 verbs, 10 numbers, 6 pronouns and 21 other words. Agreeing adjectives and possessives are left out, since they change with every noun class.
67. **Verbs carry six level 1 forms each**: present tense for I, you, he or she, we, you all and they (ndakina … barakina). The he or she form comes first, as in the dev seed. Later tenses wait for the Verb Builder prompts.
68. **Nouns with a plural carry both forms.** Nouns whose plural looks the same (inshuti, imodoka, inka) or that have none (amazi, ibiryo, akazi) have one form, with both meanings in the English where it applies ("car, cars"). Noun classes are recorded as "1/2", "9/10" and so on.
69. **The pronunciation guide is syllables only**, such as mu_ra_ko_ze, worked out from the spelling (`src/engine/pronunciation.ts`). Kinyarwanda spelling doesn't mark vowel length or tone, and I can't vouch for either, so the guide doesn't double long vowels as the spec's example does. Forms other than the dictionary form get a guide from their own spelling. Admins can overwrite any guide.
70. **Every dev item kept its ID**, and all 22 words and 10 phrases are in the new course, so existing progress carries over. `reconcileOrder` keeps introduced items at the front of a saved deck, drops removed ones, and puts the rest in the new rank order. Review drops items that have left the course.
71. **The automated checks** (`src/engine/contentCheck.ts`) cover: missing fields, exactly one first form, duplicate forms, noun plurals, all six persons on a verb, duplicate words and clashing ranks. Two words spelled alike pass when their meanings differ, for pairs like kurira (cry) and kurira (climb). The same checks run in the admin editor before saving.
72. **The server holds the course**: `items` and `item_forms` in Supabase, readable by anyone (signed in or not), writable only by admins. Nothing is deleted; a removed row is marked `retired`, so every device learns it is gone. Each change is stamped, and devices download rows stamped after the newest one they have. A sync checks for course changes at most every 5 minutes; an admin's own device checks straight after each save.
73. **The app still ships the course** as a snapshot, so it works offline from the first launch. A row replaces the stored one only when it is newer, so the snapshot never undoes an admin's edit. Course changes download with every sync, for everyone.
74. **Admins** are listed in an `admins` table. Matt is the first; there is no screen to add more yet (a one-line SQL insert does it). The database rules, not the screens, decide who can edit.
75. **Admin screens** are at /admin, linked from Profile for admins only. The Course tab lists words or phrases with status and audio coverage, and adds new ones. The editor changes every field and form, retires items and forms, and makes or remakes audio per form. Rows added in the editor are marked `admin:editor`. The Reports tab lists open reports and marks them resolved, with a note.
76. **Audio is made by a server function** (`generate-audio`), for admins only. It keeps every clip ever made in `audio_clips` and points the form at the newest. Files live in a public `audio` storage bucket. The function talks to ElevenLabs, or to any endpoint that takes text and returns audio (a hosted Meta MMS model, for example). The chosen voice is the `TTS_VOICE` secret, so switching voices needs no code change. The "..." in phrases like "Nitwa ..." is not spoken.
77. **The voice listening test** is an admin screen. It voices the same 20 items (the first 14 words, abana, turiruka and the first 4 phrases) with each candidate, side by side. Results are remembered in the browser, and choosing one shows the exact `TTS_VOICE` value to store.
78. **Report a mistake** is on every card: on introductions and card backs in Learn, and on card backs in Review. A report records the item, the form and the text shown, and is saved on the device first, then sent with the next sync. Anyone can send one, signed in or not; only admins can read them.
79. **The card back** shows the example sentence, or for a phrase its word-by-word meanings, in a notes area at the foot of the card. The centre text moves up to make room ("Changed:" in `components.css`).

## Verb Builder (Prompt 6)

80. **Slots by level.** Level 1 asks for who and the action (present tense only). Level 2 adds when (now, tomorrow or later, and then). Level 3 adds whom. The ending slot is always -a until the past tense at level 4, so it is not asked yet.
81. **Grading compares slot values, not spellings.** Each stored form records its who, when, whom, verb and ending. A tile is right when its value matches the stored form's value for that slot. The stored word is shown and played after every answer, so sound changes are taught by the word and never computed at grading time.
82. **Mastery is per verb and slot**, such as gukina's who slot: 3 right in a row, like Learn. A miss resets the streak and un-masters the pair, so it has to earn 3 in a row again. A slot answered right keeps its own streak even when another slot in the same round was wrong.
83. **Misses come back sooner.** A missed form returns after exactly one other round. Come-backs take at most every other round, so a learner who misses everything still meets new forms instead of two forms taking turns.
84. **Choosing the next form**: a missed form that is due back; otherwise a form whose verb still has a slot to master; otherwise any form at the learner's level. The same form never comes twice in a row while another can.
85. **Reverse rounds are every 4th round.** The stored word plays, and the learner picks the who, when and action pictures (never whom, as the spec lists only those three).
86. **Tiles.** Who and when tiles are listed in a fixed order (n, u, a, tu, mu, ba, ki, bi; ra, za, ka), and only those that lead to a stored word for that verb are offered. Action tiles are the right verb plus 3 others, shuffled. Whom adds a "no one" tile, and is asked only for verbs that take a person as object.
87. **The engine state is plain JSON** (`VerbState`). `nextRound` records the round on screen, so a reload shows the same round, and a second answer for the same round ID is ignored, as in Learn.
88. **Changing level keeps mastery.** `levelComplete` reports when every verb and slot at the learner's level is mastered, for Prompt 7's graduation screens.
89. **The form table is drafted by `scripts/draft-verbs.ts`** into `src/data/seed/verbs.json`: 13 verbs and 324 forms, all `ai_draft`. Each form has a confidence (144 high, 156 medium, 24 low) so native reviewers can check the weakest first. Past stems are drafted for level 4, each with its own confidence.
90. **Sound rules used for the drafts**: n + r is nd (ndakina, ndiruka); a marker's vowel drops before a vowel stem (ra + iruka is riruka); Dahl's law voices ku, tu, ka and ki before a voiceless consonant (ndaguseka, dukaza, agakina, ngicara). The spec's draft table gives "akakina" for "and then he plays"; Dahl's law gives **agakina**, which the draft uses (see the questions).
91. **"It" forms** (ki- and bi- subjects) are drafted only for verbs an iki or ibi thing can sensibly do: cry, sleep, go, come, run, stand and sit.
92. **Object forms (level 3) exist only for guseka (laugh at) and gusoma (kiss)**, the two starter verbs that take a person as object. Pairs whose object includes the subject (I and me, I and us, you all and you) need reflexive forms and are left out. "He laughs at him" is two people, so it stays.
93. **The verb table is bundled in the app** (`src/data/verbSeed.ts`), like the course snapshot. Moving it into Supabase with admin editing belongs with the Verb Builder screens or native review.

## Verb Builder screens (Prompt 7)

94. **The Verb Builder is at /verbs**, opened from its card on Home, which shows the learner's level. Levels 1 to 3 have screens; levels 4 to 6 come later (`LEVELS_BUILT` in `src/engine/verbLevels.ts`).
95. **Each level opens with its own screen**: what the level adds, then 2 or 3 worked examples built one piece at a time (barakina, ndakina and ariruka at level 1; nzakina and agakina at level 2; ndaguseka and arabaseka at level 3). When the joined word differs from its pieces, a line says the pieces change sound when they join.
96. **Guided practice is 3 rounds** after each opening screen. The right tiles are outlined. Guided answers are graded and shown but do not count toward mastery, and a miss there does not come back sooner.
97. **A build round** shows the pictures and the English, the word so far as a strip (fixed pieces such as ra at level 1, and the ending a, in grey), and one row of tiles per slot. Tapping a filled slot in the strip clears it. Check is enabled once every slot has a tile. **A reverse round** shows and plays the word, and its tiles show pictures and meanings without the pieces, which would give the answer away.
98. **After every answer** the stored word is shown, played when it has audio, and each slot is marked right or wrong with an icon and words ("you picked tu (we). It's ba (they).").
99. **Finishing a level unlocks the next**: every verb and slot at the level mastered (3 right in a row). The new level is saved to the profile and syncs. A level only ever rises across devices: a device that is behind never lowers it. After level 3 a message says levels 1 to 3 are done, once, and practice carries on.
100. **Word forms follow the verb level.** The 11 course verbs that are also starter verbs get their level 2 forms (future and "and then") and level 3 object forms from the verb table, 144 new forms, through `scripts/draft-content.ts`. Learn and Review already pick only forms at or below the learner's level, so these appear once unlocked. "It" forms stay in the Verb Builder. gusoma's object forms are left out of the course, since the course teaches it as "to read" and those forms mean "to kiss".
101. **Verb Builder progress stays on the device** (the `verb_state` table); only the level reached syncs. Signing in to another account clears it, like the rest of the progress. Syncing mastery itself needs a server table; it can come with native review.
102. **Pictures are emoji stand-ins** (`src/routes/verbPictures.ts`) until the drawn pictures exist. Each always sits beside a word label, so the meaning never depends on the picture.
103. **Verb Builder audio** reuses course audio where the spelling matches a course form. Words found only in the Verb Builder (the "it" forms, and the verbs not in the course) have no audio yet, so a reverse round shows the word written as well as playing it. Report a mistake is not on Verb Builder screens yet, because reports point at course items.

## Speed drills (Prompt 8)

104. **One drill engine** (`src/engine/drill.ts`): a 2-minute timer, the median, personal bests, and picking a prompt that wasn't shown in the last few. Speed Speaking (`speedSpeaking.ts`) and Number Listening (`numberListening.ts`) add their own rounds. Quick Recall will use the same engine.
105. **Numbers in words come from rules** (`src/engine/numbers.ts`): counting, prices in francs, phone numbers, and 1 to 5 agreeing with a noun's class. `scripts/draft-numbers.ts` runs them once into `src/data/seed/numbers.json` and a migration, 268 rows, all AI drafts. The app reads the stored words, never the rules, so a native speaker's correction in the database wins.
106. **The numbers live in a new table**, `number_phrases`. Like the course, everyone reads it and only admins change it, and it downloads with the course, keeping its own place. Each row can have audio: the audio function takes `numbers` as well as `forms`, and Make missing audio on the Admin page now does both.
107. **The drills open once numbers 1 to 5 are learned**, meaning rimwe to gatanu have graduated into Review. Until then, their Home cards say how many are learned, and the drill screen points to Learn.
108. **Speed Speaking** uses 16 picturable course nouns with 1 to 5: 80 cards. 1 takes the singular (umuntu umwe); 2 to 5 take the plural (abantu babiri). 6 to 10 and tens wait, since their agreement needs checking. The learner can show the answer early ("I said it"), or wait for the countdown to run out. "Two misses lengthen it" counts misses since the countdown last changed, not only misses in a row. **The score is the shortest countdown on which a card was marked Got it.**
109. **A session ends at the first answer after 2 minutes**, so the last card is never cut off. Leaving mid-session saves nothing.
110. **Number Listening levels 1 to 6 are built.** Level 1 is 1 to 10 plus the noun phrases, 2 is 11 to 99, 3 is the round hundreds plus 31 others, 4 is thousands and prices, and 5 is 20 phone numbers in three groupings. 6 mixes levels 1 to 5. **Level 7, numbers as people say them, waits for a native speaker's list**, since the spec's own example (chatanu) is unconfirmed.
111. **A Number Listening level opens** after a session on the level before with at least 10 answers and 80% right. **Its personal best** is the fastest median time among sessions meeting that same bar. The time counts from the end of the audio, or from the words appearing when there is no audio yet, to the last digit typed.
112. **Without audio, Number Listening shows the words written**, so it can be tried before the voice is chosen. It becomes a listening drill once Make missing audio has run.
113. **Scores sync**: a new `drill_scores` table, append-only like the answer log. Personal bests follow the learner to every device, and signing in to another account clears them from the device like the rest of the progress.
114. **Noun pictures are emoji stand-ins** (`src/routes/numberPictures.ts`), each beside the noun.

## Planned later

- **A Pronunciation section** (Matt, 30 October 2026), with two activities. *Hard words* is listening practice on words that are hard to hear; it overlaps with Sound Pairs and may absorb it. *Letter changes* shows a word in its pieces as they are before joining (ra + iruka); the learner types the joined word (riruka), submits, sees whether it's right, and can open an explanation of the rule that applied. Verb Builder's `formPieces` already gives the pieces for every verb form, so the verb forms can supply the first set of questions. Learners should practise the letter changes that happen when pieces join, which Verb Builder shows in the stored word but never teaches as rules: a vowel dropping before another vowel (ra + iruka is riruka, a + a is ya), n + r becoming nd (ndakina), and Dahl's law (ku, tu, ka and ki voicing before a voiceless consonant, as in agakina and dukaza). The sound rules in decision 90 are the starting list. Added to the build plan's later phases.

## Colour pairs below contrast guidelines (kept as designed)

From the design system's Accessibility section. None were changed.

| Token | Where it appears in this build | Ratio |
| --- | --- | --- |
| `text-muted` | Practice row subtitles ("3 of 22 learned"), stat labels, badge detail lines | about 3.7:1 |
| `text-subtitle` | "Start where you left off" under Practice | about 3.1:1 |
| `text-link` | Not used yet ("See All") | about 3.1:1 |
| `green-600` | Practice row percentages | 3.1:1 |
| `blue-tag-text` | WORD, VERB and PHRASE tags on cards | 3.9:1 |
| `yellow-stat` | Stat values and the streak flame on Profile and History | 2.3:1 |
| `yellow-pill-text` | The verb level pill on Profile | about 2.9:1 |
| `orange-tile-text` | Number on the orange badge tiles on Profile | 2.4:1 |
| White on `hero-start`, `hero-mid`, `hero-end` | "Start Learning today" banner | 3.5, 2.6 and 2.1:1 |
| `text-card-back` | The quiet Kinyarwanda word above the meaning on a card back | 2.3:1 |
| `green-phonetic` | Phonetic spelling (no phonetic data yet) | 3.5:1 |
| `yellow-name` | Learner's name on Home (decorative only) | 1.5:1 |

## Dependencies

The prompt names the stack; these supporting packages come with it and were added without asking: `@vitejs/plugin-react`, `@types/react`, `@types/react-dom`, `@types/node`, `jsdom` and `@testing-library/dom` (for Testing Library under Vitest), `typescript-eslint`, `@eslint/js`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `eslint-config-prettier` and `globals`. `@supabase/supabase-js` was added in Prompt 3 with Matt's approval. No others. The audio server function imports `@supabase/supabase-js` from JSR inside Deno; that is not a project dependency. The Supabase CLI runs from its own folder (`%LOCALAPPDATA%/supabase-cli`), not as a project dependency.

- `react-router` v7 is used (the package formerly published as `react-router-dom`).
- `scripts/build-tokens.ts` runs directly on Node 22.18+, which strips TypeScript types itself, so no `tsx` or `ts-node` is needed.
- Vitest sets `NODE_ENV=test` itself (`vite.config.ts`). The development machine has `NODE_ENV=production` set globally, which made React load its production build, where Testing Library's `act` does not exist. A global `NODE_ENV=production` also makes `npm install` skip dev dependencies unless `--include=dev` is passed.
- The 1,000-session no-repeat test takes about 6 seconds, so it has a 30 second timeout instead of Vitest's default 5.
- Playwright runs Chromium at 390 x 844 with touch. Safari on iPhone is not covered by an automated test; see the questions below.

## Questions for Matt

1. **Safari coverage.** Should CI also run the walkthrough in Playwright's WebKit? It is closer to iPhone Safari but adds a few minutes to every push. Real-device checks on an iPhone and an Android phone still need a person.
2. **After 500 words.** The engine needs a tier size for anything beyond 500. It uses 400 for now. Should it stop at 500 until topic pools exist?
3. **Between tiers.** Should finishing a tier show a moment of celebration ("You've learned your first 100 words") before the next tier's first introductions? Today it moves straight on.
4. **Review stages.** Is "an item at stage N waits stage N's interval" the reading you meant (decision 29)? The other reading would make the second review 5 minutes after the first instead of 15.
5. **One Review queue or two.** Words and phrases are mixed in one Review queue. Should Review get the same Words | Phrases switch as Learn?
6. **Word list.** Please skim the first 100 words in `scripts/draft-content.ts`. Is a usefulness order acceptable until a corpus count is run, and should numbers sit inside the first 100 (they open Speed Speaking)?
7. **Who else is an admin?** Only Matt for now. Native reviewers will need accounts in a later phase.
8. **Reports from people not signed in.** These are allowed so testers don't have to sign in. If spam ever shows up, reports can require sign-in instead.
9. **Narrative "and then".** The spec's table shows "akakina"; the draft uses "agakina", following Dahl's law. Which is right? The same rule decides ngakina, tugakina and agahagarara.
10. **Level 3 verbs.** Only guseka (laugh at) and gusoma (kiss) among the starter verbs take a person as object. Should level 3 add transitive verbs from the course, such as kubona (see), gukunda (love), gufasha (help) and kureba (look at)?
11. **"It" verbs.** "It" forms are drafted for cry, sleep, go, come, run, stand and sit. Should laugh, dance, sing or play have them too?
12. **How long a level takes.** Finishing a level needs every one of the 13 verbs' slots mastered, about 40 right rounds at level 1. Is that the right length, or should a level finish after fewer verbs?
13. **Number words.** Please check a sample in `src/data/seed/numbers.json`, especially: "na" before a vowel (makumyabiri na icyenda; is it said n'icyenda?), magana cyenda for 900, ibihumbi umunani for 8,000, the class 10 forms (inka ebyiri, eshatu, enye, eshanu), and how phone numbers are grouped when read aloud.
14. **Colloquial numbers (Number Listening level 7).** Could a native speaker list the everyday forms, such as the spec's chatanu for 1,500? The level is built once the list exists.
