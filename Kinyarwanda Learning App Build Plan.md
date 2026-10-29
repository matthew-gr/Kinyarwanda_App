# Kinyarwanda Learning App: Build Plan

Oct 29, 2026 · @Matt

How the app in Doc gets built, phase by phase, with Claude Code writing the code and AI drafting the Kinyarwanda, ready for native speakers to review in a later phase.

## How the build runs

Claude Code builds one slice at a time from a written prompt; a developer tries each slice in a phone browser before the next one starts. Content is AI-drafted alongside the code and marked for native review later.

**Roles:**

| Role | Who | Does |
| --- | --- | --- |
| Product owner | Matt | Approves each slice, settles open decisions, tests daily |
| Builder | Claude Code | Writes code and tests from the prompts in this plan |
| Reviewer | One developer, part time | Reviews pull requests and tries each preview link on a phone |
| Content | Claude | Drafts words, forms, phrases, verb forms, stories and pictures; generates audio |
| Language reviewers | Native speakers, later phase | Approve or correct content; record audio to replace AI narration |

**Rhythm:**

- One prompt builds one slice. Each slice ends with passing tests and a preview link to try on a phone.
- Learning rules are written as tested engines before any screen is built on top of them.
- Every phase ends with a link shared with testers.
- Decisions made during a slice go back into the product spec, so the spec stays the source of truth.

**Tools:** one GitHub repository; Vercel for hosting and a preview link per change; one Supabase project for development and one for production; the Kinyarwanda design system for colours, type and components.

## Roadmap

Six phases run in order. Learn and Review reach testers first; the phone install comes last, once every module works on the web.

&#91;embedded content: build phases, in order\]

Content is drafted a step ahead of each phase, so every module has words, forms and audio the day it is built.

## Phase by phase

Six phases take the app from an empty repository to a phone install, each ending with a working link testers can try.

### Phase 0: Foundation

- **Builds:** the web app (React, TypeScript, Vite), design system tokens and components, bottom nav and empty screens, the in-browser database, tests on every push, and a preview link per change.
- **Content:** Claude drafts the first 100 words with their forms and the first 50 phrases; the AI voice listening test picks a voice.
- **Done when:** the app opens in a phone browser in the design system's colours, and tests run on every push.

### Phase 1: Learn and Review

- **Builds:** Learn for words and phrases; Review with the recheck rule; due counts on Home; sign-in with email and Google; sync to Supabase; the Home Today banner; basic Profile and History; AI audio for every item; admin screens to edit content and regenerate audio; Report a mistake.
- **Content:** the first 100 words with forms and 50 phrases, AI-drafted, with audio.
- **Done when:** a tester learns 20 words, sees a review due 5 minutes later, reviews on a second device, and sees the same progress.
- **Gate:** a tester beta of 5 to 10 learners for 2 weeks. Findings are fixed before Phase 2.

### Phase 2: Verb Builder, levels 1 to 3

- **Builds:** the AI-drafted verb form table; the tile game with graduation screens and reverse rounds; levels 1 (present, who), 2 (tomorrow and narrative) and 3 (objects). Word forms in Learn and Review start following the learner's verb level.
- **Content:** every level 1 to 3 form of the 13 starter verbs, with audio; AI pictures for verbs, people and time icons.
- **Done when:** a tester completes levels 1 to 3 and then sees conjugated verbs in Review.

### Phase 3: Speed drills

- **Builds:** one shared drill engine (countdown, scoring, personal bests); Speed Speaking, Number Listening with all 7 levels, and Quick Recall.
- **Content:** number phrases for 1 to 10 across the common noun classes; numbers read in each style, phone numbers and colloquial forms, all as AI audio.
- **Done when:** each drill runs a 2-minute session and saves a score.

### Phase 4: Stories

- **Builds:** the server function that calls Claude, the coverage check and retry, tap to define, save to Learn, comprehension questions, Report a mistake, story repeats at 1 day, 1 week, 1 month and 3 months, Too hard and Too easy feedback, and verb forms limited to the learner's unlocked levels.
- **Done when:** a learner with 100 words gets a story under 200 words at the target share, and it comes back the next day.

### Phase 5: Phone install

- **Builds:** the progressive web app: install from the browser, offline use, web push reminders for due reviews and rechecks, app icon and splash screen.
- **Done when:** the app installs on an iPhone and an Android phone, works in airplane mode, and sends a reminder when a review is due.

### Later phases

- Native review in the admin screens: rate, correct and approve every entry; record or upload native audio to replace AI clips.
- Sound Pairs, once native recordings exist.
- The placement check.
- Topic pools after 500 words.
- Verb Builder levels 4 to 6.
- Speech recognition for Speed Speaking.

## Claude Code prompt sequence

Twelve prompts build the app, each one slice that ends with passing tests and a preview link. Prompt 1 is written and ready; each later prompt is written when its phase starts, from the spec as it stands then.

| # | Prompt | Phase |
| --- | --- | --- |
| 1 | Foundation and Learn, working in the browser with sample words | 0 and 1 |
| 2 | Review engine with the recheck rule, the Review screen, due counts | 1 |
| 3 | Accounts and sync: database tables, privacy rules, sign-in, answer log sync | 1 |
| 4 | Home, Profile, History, daily goal, streaks | 1 |
| 5 | AI content and audio: drafting, the chosen voice, admin editing, Report a mistake | 1 |
| 6 | Verb Builder engine and the AI-drafted form table | 2 |
| 7 | Verb Builder screens, levels 1 to 3; word forms follow the verb level | 2 |
| 8 | Drill engine, Speed Speaking, Number Listening | 3 |
| 9 | Quick Recall | 3 |
| 10 | Stories: server function, reader, repeats, difficulty feedback | 4 |
| 11 | Phone install: progressive web app, offline, web push | 5 |
| 12 | Native review and recordings in the admin screens | Later |

Every prompt links the product spec and the design system, names the files it may change, and lists the tests that must pass.

## Content pipeline

Claude drafts all content a step ahead of the code. Every entry carries its source and status, so native speakers can review it later without rework.

1. **Draft.** Claude drafts words in frequency order with their forms, plus phrases, verb forms, number phrases and pictures.
2. **Check.** Automated checks catch duplicates, missing fields and verb forms that break the pattern table; Matt spot-checks a sample.
3. **Voice.** The chosen AI voice generates a file for every form, and each file records which voice made it.
4. **Publish.** AI drafts go live for learners, with Report a mistake on every card.
5. **Review later.** Native speakers approve, correct or re-record in the admin screens; approved entries replace the drafts.

**What each phase needs:**

| Content | Amount | Phase |
| --- | --- | --- |
| Words with their forms | First 100 | 1 |
| Phrases | 50 | 1 |
| Words with their forms | 101 to 500 | After the tester beta |
| Verb forms, levels 1 to 3 | About 400 | 2 |
| Pictures | 13 verbs, 6 people, time icons, nouns for "it" | 2 |
| Number phrases, 1 to 10 across common noun classes | About 80 | 3 |
| Numbers read aloud, all 7 levels | About 150 clips | 3 |
| Stories | Generated on demand | 4 |

## Testing

The learning rules are tested exactly, with a fake clock, before any screen is built on them; the screens are then tested on real phones and by real learners.

**Engine tests** (examples that must pass):

- Learn starts with 2 cards, adds 1 per round, and never holds more than 8.
- A card graduates after exactly 3 correct in a row; one miss resets its streak to 0.
- No card appears twice in a row while others are in play.
- A graduated card is due in Review exactly 5 minutes later.
- A miss at stage 10 drops it to stage 9, with rechecks at 5 minutes and 1 hour.
- A miss on a recheck drops one more stage and restarts the rechecks; stage 1 is the floor.
- A double tap or a replayed sync counts one answer.
- Month intervals land on calendar dates (Jan 31 plus 1 month is Feb 28).

**Browser and device tests:** each preview runs in Chrome and Safari at phone size, and on a real iPhone and a mid-range Android phone, online and offline. End-to-end tests cover learning a word, reviewing it, and syncing to a second device.

**Tester group:** 5 to 10 learners from Phase 1 on, with a feedback button on every screen. Each beta tracks days returned, words learned per day, review accuracy, crashes, and reported language mistakes.

**Language checks:** Matt spot-checks AI content each phase, and learner mistake reports are reviewed weekly. Native-speaker review joins in a later phase.

## Risks and fallbacks

The biggest risks are language quality and voice, not code; each has a fallback that keeps the build moving.

| Risk | Fallback |
| --- | --- |
| AI Kinyarwanda is wrong: words, forms or tone | Report a mistake on every card and story; spot checks each phase; native review in a later phase |
| No AI voice sounds acceptable | Use the open Meta model for the private pilot, or record a small native set for the first 100 words |
| Verb forms are harder than the draft table suggests | Grade only against the stored form table; ship levels 1 to 3 first |
| iPhone limits for web apps | Reminders on iPhone need the app added to the home screen; due counts in the app cover the gap |
| Progress conflicts between devices | Answers saved as a log with unique IDs; progress rebuilt from the log |
| Eight modules stretch the build | Each phase has a gate; anything not essential moves to a later phase |
