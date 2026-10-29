# Decisions and open questions

Choices made while building the app that the prompts or the product spec did not settle: Prompt 1 (foundation and Learn), then Prompt 2 (Review), then Prompt 3 (accounts and sync). Each takes the simplest reading. Questions for Matt are at the end.

## Learn engine

1. **`nextStep` returns `{ step, state }`, not just the step.** The prompt's signature returns only the step, but `createLearnState` and `applyAnswer` take no random number generator, so the shuffled round order and each test's `cardViewId` can only be decided inside `nextStep`. To make "reload lands on the same card" exact, `nextStep` records the issued step as `state.current` and returns the updated state. Calling it again, or after a reload, returns the same step and the same `cardViewId` without touching the generator.
2. **An introduction counts as an appearance** for the no-repeat rule. A new round never starts with the item shown last, whether that was a test or an introduction, so a card is never introduced and then immediately tested.
3. **Rounds are built when the previous one ends.** New items are introduced at the end of each round (rule 6) and shown before the next round starts, so new items join that next round.
4. **Tiers are computed from rank and `tierSizes`; the last size repeats.** Words use `[100, 400]` (the first 100, then up to 500); phrases use `[25]`, so every batch is 25. Any words after 500 would fall into further tiers of 400, which is a placeholder: the spec has the learner choose topic pools after 500, which is not built yet.
5. **The next tier opens automatically** when every item in the current tier has graduated. "Done" shows only when every item in the deck has graduated, so with today's 22 seed words and 10 phrases the done screen appears after the whole deck is learned.
6. **The engine keeps the item order it was created with.** If seed content changes later (Prompt 5), new items will need a migration step that appends them to a saved deck. Not built now.
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
54. **Builds without Supabase settings** (CI, local runs without `.env.local`) run with accounts switched off; Profile says so. The two settings are public: the URL and the publishable key.
55. **`.npmrc` sets `include=dev`**, because this machine's global `NODE_ENV=production` made `npm install <package>` remove the dev tools.

## Colour pairs below contrast guidelines (kept as designed)

From the design system's Accessibility section. None were changed.

| Token | Where it appears in this build | Ratio |
| --- | --- | --- |
| `text-muted` | Practice row subtitles ("3 of 22 learned") | about 3.7:1 |
| `text-subtitle` | "Start where you left off" under Practice | about 3.1:1 |
| `text-link` | Not used yet ("See All") | about 3.1:1 |
| `green-600` | Practice row percentages | 3.1:1 |
| `blue-tag-text` | WORD, VERB and PHRASE tags on cards | 3.9:1 |
| `yellow-pill-text`, `yellow-stat`, `orange-tile-text` | Not used yet (Profile) | 2.3 to 2.9:1 |
| White on `hero-start`, `hero-mid`, `hero-end` | "Start Learning today" banner | 3.5, 2.6 and 2.1:1 |
| `text-card-back` | The quiet Kinyarwanda word above the meaning on a card back | 2.3:1 |
| `green-phonetic` | Phonetic spelling (no phonetic data yet) | 3.5:1 |
| `yellow-name` | Learner's name on Home (decorative only) | 1.5:1 |

## Dependencies

The prompt names the stack; these supporting packages come with it and were added without asking: `@vitejs/plugin-react`, `@types/react`, `@types/react-dom`, `@types/node`, `jsdom` and `@testing-library/dom` (for Testing Library under Vitest), `typescript-eslint`, `@eslint/js`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `eslint-config-prettier` and `globals`. `@supabase/supabase-js` was added in Prompt 3 with Matt's approval. No others. The Supabase CLI runs from its own folder (`%LOCALAPPDATA%/supabase-cli`), not as a project dependency.

- `react-router` v7 is used (the package formerly published as `react-router-dom`).
- `scripts/build-tokens.ts` runs directly on Node 22.18+, which strips TypeScript types itself, so no `tsx` or `ts-node` is needed.
- Vitest sets `NODE_ENV=test` itself (`vite.config.ts`). The development machine has `NODE_ENV=production` set globally, which made React load its production build, where Testing Library's `act` does not exist. A global `NODE_ENV=production` also makes `npm install` skip dev dependencies unless `--include=dev` is passed.
- The 1,000-session no-repeat test takes about 6 seconds, so it has a 30 second timeout instead of Vitest's default 5.
- Playwright runs Chromium at 390 x 844 with touch. Safari on iPhone is not covered by an automated test; see the questions below.

## Questions for Matt

1. **Safari coverage.** Should CI also run the walkthrough in Playwright's WebKit? It is closer to iPhone Safari but adds a few minutes to every push. Real-device checks on an iPhone and an Android phone still need a person.
2. **After 500 words.** The engine needs a tier size for anything beyond 500. It uses 400 for now. Should it stop at 500 until topic pools exist?
3. **Daily goal.** Does the goal count items learned (graduated) today, as built, or items introduced today?
4. **Between tiers.** Should finishing a tier show a moment of celebration ("You've learned your first 100 words") before the next tier's first introductions? Today it moves straight on.
5. **Seed content.** amazi, ibiryo and akazi have no plural in the seed; please confirm they should stay single-form nouns until AI content replaces the seed.
6. **Review stages.** Is "an item at stage N waits stage N's interval" the reading you meant (decision 29)? The other reading would make the second review 5 minutes after the first instead of 15.
7. **One Review queue or two.** Words and phrases are mixed in one Review queue. Should Review get the same Words | Phrases switch as Learn?
