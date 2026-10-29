# Kinyarwanda Learning App: Product Spec

Oct 29, 2026 · @Matt

## Summary

A web app, later installable on phones, that takes English-speaking adults from zero to conversational Kinyarwanda through eight short, game-like modules. It replaces the earlier Lovable prototype, keeps its learning rules, and adds verb building, speed drills and listening practice.

**Who it is for:** English-speaking adults living in or connected to Rwanda, starting as beginners. The intro screen also lets intermediate and advanced learners start further along.

**How it teaches.** Three ideas carry every module:

- **Most useful first.** Learners start with the 100 most frequent words and the most common phrases, then unlock the next 100, and so on.
- **Recall, then spacing.** Every word and phrase is practised until it can be recalled three times in a row, then reviewed on a schedule that stretches from 5 minutes to 1 year.
- **Mostly understandable input.** Stories and drills are built from words the learner already knows, aiming for about 70 to 80% comprehension. This target is a starting setting, adjustable per learner.

**What is new in this version:**

- Phrases sit alongside words in Learn and Review, in separate pools, using the same cards and schedule.
- Words change form as the learner advances: umwana one time, abana the next; ariruka (he runs) rather than kwiruka (to run), matched to the Verb Builder level reached.
- A wrong answer in Review drops a word one stage and rechecks it within the hour, instead of sending it back to the start.
- Five new modules: Verb Builder, Speed Speaking, Number Listening, Quick Recall and Sound Pairs.
- Everything starts AI-generated, words and audio included. Native speakers review it and replace AI narration with recordings in a later phase.
- It launches as a web app, then becomes installable on phones as a progressive web app.
- The app follows the Kinyarwanda Learning App design system built from the Figma file.

## App shape

The app opens on a Home screen that always answers one question: what should I do next? Eight modules sit behind it, grouped into vocabulary, grammar, speed, listening and reading.

**Screens** (from the Figma design):

- **Intro:** the mascot asks for a starting level (Beginner, Intermediate, Advanced). In the first release everyone starts at word 1. A placement check follows in a later release (below).
- **Home:** greeting, search, a Today banner (reviews due, new words left in today's goal), the module carousel, and Practice rows showing progress per skill.
- **Module screens:** each module runs full screen with a session header (level, timer, progress bar) and the app bar back button.
- **History:** daily activity, words learned per day, review accuracy over time.
- **Profile:** streak, words learned, level, achievements, settings.
- **Bottom nav:** Home, Search, History, Profile.

**Placement check (later release).** It runs 10-word review rounds and steps up or down by the share answered correctly, starting within the first 1,000 words:

1. Above 70% correct: move to harder words and run another round.
2. About 70%: this is the learner's level; start there.
3. Well under 70%: drop to the first 500 words and run another round.
4. Still under 70%: drop to the first 100 words.

**The eight modules** (unlock points are proposals and stay configurable):

| # | Module | What the learner does | Opens | Audio |
| --- | --- | --- | --- | --- |
| 1 | Learn | Meets new words or phrases on flashcards until each is recalled 3 times in a row | Day one | AI voice |
| 2 | Review | Recalls learned words and phrases on the spaced schedule | After the first word is learned | AI voice |
| 3 | Stories | Reads short stories built mostly from known words; taps any word for its meaning | 100 words learned | AI voice |
| 4 | Verb Builder | Builds a verb from picture cues: who, when, the action, an object, the ending | Day one, level 1 | AI voice |
| 5 | Speed Speaking | Sees a noun and a number, says the phrase aloud before the answer appears | Numbers 1 to 5 learned | AI voice |
| 6 | Number Listening | Hears a number, types it as fast as possible | Numbers 1 to 5 learned | AI voice |
| 7 | Quick Recall | Picks a known word's meaning against the clock | 20 words in Review | AI voice |
| 8 | Sound Pairs | Hears one word of a near-identical pair and picks which it was | Later phase | Native speakers |

Review opens straight away rather than at 100 words, as in the Lovable draft, because the first review falls 5 minutes after a word is learned.

## Module 1: Learn (words and phrases)

Learners meet new words or phrases two at a time, and a card leaves the deck once it is recalled three times in a row. At most 8 cards are in play at once.

**Words or phrases.** A switch at the top of Learn picks the deck. Words and phrases keep separate pools of up to 8 cards and separate queues. Both feed the same Review schedule and the same daily goal.

- **Words** come in frequency order, in tiers: the first 100, then the first 500. Each tier opens when every word in the one before has graduated.
- **After 500 words** the learner chooses: keep going with the next most frequent words, or add a topic pool such as medical, business or church. Topic pools can run alongside the frequency list.
- **Phrases** come in usefulness order (greetings, courtesy, questions, directions, shopping, family), in batches of 25.

**The card.** Front: the Kinyarwanda word or phrase, its pronunciation guide (for example muu\_raa\_ko\_ze) and a play button. Back: the English meaning for that exact form, a word-type tag (WORD, PHRASE, VERB), and an example sentence. A phrase's back adds a word-by-word breakdown where it helps.

**Changing forms.** A word does not always appear the same way, so learners recognise it in real speech. Each showing picks one form of the word:

- **Nouns** switch between singular and plural: umwana (child), abana (children).
- **Verbs** appear conjugated, never only as the infinitive, using only what the learner has unlocked in Verb Builder. At level 1, kwiruka shows as ariruka (he runs) or bariruka (they run); after level 4 it can also appear in the past tense.
- **The introduction** always shows the simplest form, with the dictionary form underneath.

Progress counts for the word, whichever form is shown.

**The sequence:**

1. Introduce 2 cards. Each shows front and back together and plays its audio. This is a preview, not a test.
2. Test every card in play once, in shuffled order. The same card never appears twice in a row, including across rounds.
3. A test shows the front only. The learner taps the card; it flips to the answer.
4. On the back, the learner taps ✓ (I knew it) or ✗ (I didn't).
5. ✓ adds 1 to the card's streak. ✗ resets it to 0.
6. A card that reaches 3 in a row graduates: it leaves the pool, enters Review, and its first review is due 5 minutes later.
7. After each round, if fewer than 8 cards are in play and new ones remain, introduce 1 new card, then start the next round. If fewer than 2 are in play, introduce enough to get back to 2.
8. The session ends whenever the learner leaves. Progress saves after every answer, and the next session resumes mid-round.

Every card takes two taps: one to flip, one to grade.

**Rules that keep the count honest:**

- One grade per card view; a double tap counts once.
- The meaning is shown only on the first introduction. After that, nothing is highlighted until the learner reveals it.
- Feedback always uses an icon and a word as well as colour.

**Goals and milestones.** A daily goal of new items (default 10) is shown on Home but never blocks learning. Badges mark 10, 100, 500, 1,000, 2,000 and 5,000 words.

## Module 2: Review (words and phrases)

Every graduated word and phrase comes back on an 11-stage schedule from 5 minutes to 1 year. A correct answer moves it up one stage; a wrong one drops it one stage and rechecks it within the hour.

**The schedule:**

| Stage | Next review after a correct answer |
| --- | --- |
| 1 | 5 minutes |
| 2 | 15 minutes |
| 3 | 1 hour |
| 4 | 4 hours |
| 5 | 1 day |
| 6 | 2 days |
| 7 | 1 week |
| 8 | 1 month |
| 9 | 2 months |
| 10 | 3 months |
| 11 | 1 year, then yearly |

Months use calendar dates, not 30-day blocks. Due times are stored on the server and the phone, never held only in a timer.

**The review card:**

1. The front shows the word or phrase, in one of its forms, and plays its audio.
2. The learner taps the card; it flips to the answer.
3. On the back, the learner taps ✓ (I knew it) or ✗ (I didn't).

This is the same card as Learn: two taps, one to flip and one to grade.

**When an answer is wrong.** A word at stage 10 (3 months) that is missed:

1. Drops one stage, to stage 9 (2 months).
2. Comes back for a recheck in 5 minutes.
3. If the recheck is correct, comes back again in 1 hour.
4. If that is also correct, its next review is 2 months after the second recheck.
5. A wrong answer at either recheck drops it one more stage (to 1 month) and restarts at step 2.

&#91;embedded content: review recheck loop · 5 steps\]

Either recheck can send the word down another stage; two correct rechecks in a row put it back on the schedule.

Rechecks confirm a word but never move it up a stage. The lowest stage is 5 minutes; a word never returns to Learn.

**The queue.** Overdue items come first, oldest first, then items due now. Home shows due now, due later today, due tomorrow, overdue, and the total in Review. Review always works independently of Learn, and a daily goal never blocks overdue reviews.

## Module 3: Stories (comprehensible input)

At 100 words, learners unlock short stories built mostly from words they know, using only the verb forms they have unlocked. Each story comes back four times, then retires.

**How a story is made.** The server asks Claude for a story with this prompt, filled in for each learner:

> Please create a simple story in Kinyarwanda primarily using only the following words. About \[share\]% of the words used in the story should be from the words provided. Use only these verb forms: \[unlocked forms\]. \[Tense instruction\]. Use correct grammar and conjugation in every sentence. The story should not exceed \[limit\] words. \[Learner feedback, if any\]. Known words: \[list\]

**What the app fills in:**

| Setting | Starts at | Changes with |
| --- | --- | --- |
| Share of known words | 70% | Too hard raises it 5 points, Too easy lowers it 5 points, kept between 60% and 90% |
| Length limit | Under 2 times the words learned | Words learned |
| Verb forms | Present tense only | Each Verb Builder level unlocked |
| Tense | "Tell the story in the present tense" | Once past tense is unlocked, about 30% of stories are told in the past |
| Learner feedback | None | The learner's latest note on difficulty |

The app then estimates how much of the story the learner should understand and regenerates if it falls more than 10 points below the target share. The estimate is approximate, because Kinyarwanda words change shape with prefixes and endings.

**What the learner can do:**

- Read the story and hear it read aloud, sentence by sentence.
- Tap any word for a short meaning; long-press to add it to the Learn deck.
- Replay any sentence.
- Answer 2 or 3 comprehension questions at the end.
- Tap **Too hard** or **Too easy**, with an optional one-line note ("too many new verbs"). The next story uses both.

**Quality.** AI-written Kinyarwanda can be wrong. Each story carries an "AI story" label and a **Report a mistake** button. Stories a native speaker has checked get a checkmark and are reused for other learners at the same level, so the checked library grows over time.

**Repeats.** Every story is saved and comes back after 1 day, 1 week, 1 month and 3 months, then retires. Home shows repeats that are due beside the option to read a new story.

Later levels add short dialogues, then longer stories and natural speech.

## Module 4: Verb Builder

Learners build a Kinyarwanda verb by snapping pieces onto a verb root, choosing each piece from a picture: who, when, whom, the action and the ending. Bararira ("they are crying") is ba + ra + rir + a.

**The slots, left to right:**

| Slot | Picture shown | Pieces (draft) | Level |
| --- | --- | --- | --- |
| Who | me, you, he or she, it, we, you all (also the respectful you), they | n-, u-, a-, tu-, mu-, ba-; for iki and ibi nouns, ki- and bi- | 1 |
| When | now, tomorrow or later, and then; then the past times | -ra-, -za-, -ka-, then the past markers | 2, 4, 6 |
| Whom | me, you, him or her, us, them | -n-, -ku-, -mu-, -tu-, -ba- | 3 |
| Action | the verb's own picture | the root: -kin-, -seka-, -rir- | 1 |
| Ending | plain, past, family forms | -a, the past stem, -ana, -esha | 1, 4, 5 |

**How a round plays:**

1. A target card shows the pictures (they + now + cry) and the English, "They are crying".
2. The learner fills each slot by tapping a tile. Tiles show the piece and a small picture.
3. On submit, the app shows the full word, plays it, and marks each slot right or wrong with an icon and a word.
4. A reverse round plays a built verb aloud and asks the learner to pick the who, when and action pictures.
5. Each verb and slot combination needs 3 correct in a row, like Learn. Misses come back sooner.

**Grade against checked words, not computed rules.** Pieces change sound when they join (n + ra becomes nda, a + a becomes ya, tu becomes du before some consonants), and past stems are irregular (gukina becomes -kinnye, kurya becomes -riye). So every full form is stored in a table. AI drafts the forms for the first release, and native speakers approve them in a later phase. Tiles teach the pieces; the stored word decides the answer.

**Draft time forms** for gukina (to play), first person. Every row stays a draft until a native speaker checks it:

| When | Pattern | Example | Level | Confidence |
| --- | --- | --- | --- | --- |
| Now | who + ra + root + a | ndakina | 1 | High |
| Tomorrow or later | who + za + root + a | nzakina | 2 | High |
| And then (narrative) | who + ka + root + a | akakina (and then he plays) | 2 | Medium |
| Later today | written the same as now | ndakina | 2 | Settled |
| Earlier today | who + a + past stem | nakinnye | 4, first lesson | Medium |
| Before today | who + a + ra + past stem | narakinnye | 4, the very next lesson | Medium |
| Subjunctive | who + root + e | ukine, mukine, dukine (let's play) | 6 | Medium |
| Helper verbs | helper + infinitive | ndaza gukina, ngiye gukina, namaze gukina | 6, its own session | Medium |

**Levels:**

Each level adds one idea, starting very simple:

1. **Present, who only.** He runs, they run, we run, you run: the learner picks only the first part of a present-tense verb. "It" uses iki and ibi nouns (ki- and bi-).
2. **Other non-past times.** Tomorrow versus now (-za- instead of -ra-), then the narrative -ka- ("and then he plays"). Later today is written the same as now and needs no lesson of its own.
3. **Direct objects.** He throws the ball to her, she throws the ball to them: the whom piece joins the word.
4. **Past tense, in two back-to-back lessons.** First earlier today (nakinnye), then before today with -ra- (narakinnye). In each, the learner picks the past time marker, sees how it changes the front of the word, and picks the verb's past ending.
5. **Verb families.** One root, new meanings: gukora (to work), gukorana (to work with), gukoresha (to use, or to make someone work). The form can shift who is the subject or object.
6. **Advanced.** Subjunctive and ongoing actions, then a closing session on helper verbs: ndaza gukina, ngiye gukina, namaze gukina.

**Every new level opens with a graduation screen:** "You've unlocked past tense", then 2 or 3 worked examples built piece by piece, then a short guided practice before free rounds.

**Starter verbs** (picture-friendly, easy to conjugate): kurira (cry), guseka (laugh), kuryama (sleep), kugenda (go), kuza (come), kubyina (dance), kuririmba (sing), gukina (play), guteka (cook), gusoma (read), kwiruka (run), guhagarara (stand), kwicara (sit). Kurya (eat) and kunywa (drink) are left out because their forms are irregular. Kwiruka and kwicara start with a vowel, which blends with the piece before it (ariruka, he runs). Kurira (to climb) is spelled exactly like kurira (to cry), so it moves to Sound Pairs.

**Pictures needed for level 1 and 2:** 13 verbs, 6 people, a few things for "it", and the time icons, in the design system's flat illustration style.

**Decisions so far:**

**Settled:** learners assemble from tiles, never pick from complete words; "you all" doubles as the respectful you; level 1 "it" uses iki and ibi nouns; later today is written the same as now; before today follows earlier today in the very next lesson; helper verbs are their own late session.

- [ ] Confirm the two verbs removed from the starter set: kurya (eat) and kunywa (drink).

## Modules 5 to 8: speed and listening

Four short drills build speed once knowledge is in place. Each session runs about 2 minutes and ends with a score and a personal best.

### Module 5: Speed Speaking

Learners see a noun and a number, say the phrase aloud, and check themselves when the answer appears.

1. The card shows a noun with its picture and a numeral: abantu + 2.
2. A countdown runs, starting at 4 seconds. The learner says the phrase aloud.
3. The answer appears and plays: abantu babiri. The learner marks **Got it** or **Missed**.
4. After 5 correct in a row the countdown shortens by 0.25 seconds, down to 1.5 seconds. Two misses lengthen it again. The shortest countdown held is the speed score.

**Content.** Numbers 1 to 5 change to match the noun (abantu babiri, ibintu bitatu, abana bane); numbers 6 and up mostly do not. The pilot covers numbers 1 to 5 with nouns from the most common noun classes, then 6 to 10, then tens. No speech recognition in the pilot.

### Module 6: Number Listening

The app says a number and the learner types it in digits as fast as possible, scored on speed and accuracy.

- **Levels, in order:**
  1. 1 to 10.
  2. 11 to 99.
  3. Hundreds.
  4. Thousands and prices.
  5. Phone numbers, read the way people say them: some digits one by one, some in pairs (42), some in threes (123).
  6. A mix of every type above in one session.
  7. Colloquial numbers, the way they are said in conversation, for example chatanu for 1,500 (spelling to confirm).
- **Ways a number is read:** counting, with a noun (abantu batatu), as money, and as a phone number.
- **Score:** accuracy and median time from the end of the audio to the last digit typed.

### Module 7: Quick Recall

Learners pick the meaning of a known word as fast as possible; the drill measures reaction time, not knowledge.

- Draws only from words and phrases already in Review (stage 3 and up).
- Shows the Kinyarwanda, or plays it in a listening variant, with 4 English options.
- A target time shrinks as the learner speeds up. An answer slower than the target counts against the speed score only.
- Results never change the Review schedule.
- **Score:** correct answers per minute and median reaction time.

### Module 8: Sound Pairs

Learners hear one word from a near-identical pair and pick which it was. This module arrives in a later phase, once native speakers record the pairs. Kinyarwanda writes neither tone nor vowel length, so many of these pairs are spelled the same.

1. The screen shows two pictures with their meanings.
2. One word plays; the learner taps the matching picture.
3. Feedback shows, then both words play side by side.

**Starter pairs** (spellings to confirm): kurira (to cry) and kurira (to climb); amagi (eggs) and amagi (second meaning to confirm); the maiden and corpse pair.

**Recordings.** At least two native speakers, one male and one female, 3 takes of each word, so learners hear the difference rather than one voice. Start with 10 pairs and add more over time.

## Content and audio

Everything in the first release is AI-generated: word lists, translations, word forms, verb forms, stories and audio. Every entry records its source and review status, so native speakers can check it and replace AI narration with recordings in a later phase.

**AI voice.** The first release uses the most basic AI voice that sounds acceptable. No major provider lists Kinyarwanda yet, so the build starts with a short listening test of these options (checked October 2026):

| Option | Kinyarwanda | Can be used commercially | Role |
| --- | --- | --- | --- |
| [ElevenLabs](https://elevenlabs.io/docs/overview/models.md) | Not listed for any model, v4 included | Yes | Try first with Kinyarwanda text |
| [Meta MMS Kinyarwanda voice](https://huggingface.co/nikalaasante/mms-tts-kin) | Yes, open model | No (CC BY-NC 4.0) | Fallback for the private pilot; replace before charging users |
| [KinyaTTS](https://github.com/uwimfuraz/KINYARWANDAVA), community model | Yes, open model | Licence not stated | Try |
| [MBAZA-NLP TTS API](https://github.com/MBAZA-NLP) | Yes, self-hosted | Licence not stated | Try |
| [Google Cloud Chirp 3 HD](https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd) | Not listed | Yes | None |
| [Azure AI Speech](https://learn.microsoft.com/azure/ai-services/speech-service/language-support) | Not found on its language page | Yes | None unless its voice list shows it |

**Audio plan:**

1. **Pick a voice.** Generate the same 20 items with each option and pick the one that sounds best.
2. **Generate everything once.** Every word form, phrase, number and verb form gets an audio file from the chosen voice.
3. **Label the source.** Each clip records whether it is AI (and which voice) or a native recording, plus its review status.
4. **Review later.** In a later phase, the admin module lets native speakers rate each clip, approve it, or record a replacement in the browser. Approved recordings replace the AI clip everywhere it is used.
5. **Sound Pairs waits** for native recordings, since tone is the thing being tested.

All audio is stored as files and cached in the browser, never generated while the learner waits. That keeps it consistent, works offline, and lets any clip be swapped later.

**Vocabulary.** Claude drafts the word and phrase lists in frequency order, using corpus counts such as the open sentences behind [Mozilla Common Voice](https://www.mozillafoundation.org/en/blog/how-rwanda-making-voice-tech-more-open/) where available, counted by root word rather than by every prefixed form. Each entry carries the word, its forms, meanings, word type, noun class, pronunciation guide, example sentence and translation, audio and difficulty. Status runs AI draft, reviewed, approved. Learners see AI drafts in the first release, with **Report a mistake** on every card.

**Pictures.** Verbs, people, time icons and the nouns used in Speed Speaking start as AI-generated flat illustrations in the design system's style. The placeholder art in the Figma file came from third-party sites, so it is not used.

## Technical approach

A mobile-first web app comes first; the same app then becomes a progressive web app (PWA) that installs on a phone from the browser, with no app store. It works offline in the browser and syncs to Supabase when online, and the learning rules live in small, fully tested engines.

| Layer | Choice | Why |
| --- | --- | --- |
| App | React and TypeScript, built with Vite, mobile-first | One codebase; the design system's components are already web React |
| Data in the browser | IndexedDB | Works offline and responds instantly |
| Backend | Supabase: Postgres, sign-in, file storage, server functions | Each learner sees only their own data; little server code |
| Sign-in | Email and Google | Enough for the web; no app store rules apply |
| Hosting | Vercel | A preview link for every change |
| Phone install | Progressive web app: add to home screen, offline, full screen | No app store; Android installs from Chrome, iPhone from Safari's Share menu |
| Reminders | Due counts in the app first; web push with the phone install | Push works on Android, and on iPhone once the app is added to the home screen |
| Audio | AI-generated files in storage, cached in the browser | Consistent, offline, swappable for recordings |
| AI | Claude, called from a server function | Content drafts, word forms, stories; the key never reaches the browser |
| Admin | Admin-only screens in the same app | Content editing now; native review and recording later |
| Design | Design system tokens as CSS variables; its components ported to TypeScript | Matches the Figma screens |
| Tests | Unit tests on every engine with a fake clock; browser tests at phone size | The rules are the product |

**Engines.** Learn, Review, Verb Builder grading and the drill timers are plain TypeScript with no screens attached. Each takes the time and a random seed as inputs, so every rule in this spec can be tested exactly.

**Answers as a log.** Every answer is saved as an event with its own ID, and progress is worked out from the log. A repeated tap or a retried sync never counts twice, and two devices merge cleanly.

**Main tables:**

| Table | Holds |
| --- | --- |
| profiles | Starting level, settings, daily goal, Verb Builder level reached |
| items | Words and phrases: base text, meanings, type, noun class, pronunciation guide, example, rank, tier or topic pool, status |
| item\_forms | Each form of an item: text, English for that form, number, person, tense, the Verb Builder level it needs, status |
| audio\_clips | One per form, phrase, number or verb form: file, source (AI voice name or native speaker), status |
| verbs | Root, meaning, picture, past stem, level |
| verb\_forms | Every form: who, when, whom, ending, full word, English, status |
| number\_phrases | Noun, number, correct phrase, status |
| sound\_pairs | Paired words, meanings, pictures, recordings (later phase) |
| user\_items | Per learner and item: Learn streak, Review stage, next due time, recheck step, totals |
| answer\_events | Every answer: learner, item, form shown, module, result, response time, timestamp |
| drill\_scores | Scores and personal bests for Modules 5 to 8 |
| stories | Text, settings used, coverage estimate, repeat schedule, feedback, reported mistakes |
| achievements | Badges earned and when |

- [ ] User selects Which topic pools come first after 500 words (medical, business, church)

* [Kinyarwanda Learning App design system](https://claude.ai/artifact/G3eRrHTMweWkHodvo9DJnX)
* [ElevenLabs models and languages](https://elevenlabs.io/docs/overview/models.md)
* [Google Cloud Chirp 3 HD voices](https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd)
* [Azure AI Speech language support](https://learn.microsoft.com/azure/ai-services/speech-service/language-support)
* [MMS Kinyarwanda text-to-speech model](https://huggingface.co/nikalaasante/mms-tts-kin)
* [KinyaVA and KinyaTTS](https://github.com/uwimfuraz/KINYARWANDAVA)
* [MBAZA-NLP](https://github.com/MBAZA-NLP)
* [Mozilla Foundation: How Rwanda is making voice tech more open](https://www.mozillafoundation.org/en/blog/how-rwanda-making-voice-tech-more-open/)
