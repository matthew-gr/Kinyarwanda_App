# Vocabulary plan (agreed 3 November 2026; being built)

**Progress:** frequency counts done (`docs/data/word-frequency.tsv`); bands in Learn, tags and the new-card label done; Common 200 drafted (`scripts/vocabulary/common-200.ts`). Next: Common 500, the Topics screen, then the placement check. Phrases are not yet tagged.

The plan below was a proposal for review. It covers the 2,000-word list, its tags and order, how Learn draws from it, the placement check, and pre-learned words. Section 7 lists the questions to settle before building.

## 1. What the Growing Participator Approach suggests

The Growing Participator Approach (GPA, Greg Thomson) assumes a live native "nurturer" for about 20 hours a week. An app can't copy that, but several of its rules carry over directly.

- **Comprehension before production, recognition before mastery.** The first 30 to 40 hours are listening only, about 300 items, and Phase 1 ends at about 800 to 1,000 understood words after about 100 hours. The goal for a word is to recognise it, not to produce it perfectly. ([Six-phase programme](https://growingparticipatorapproach.wordpress.com/six-phase-programme/), [Phase 1](https://www.growingparticipation.com/1-connecting))
- **Small sets, added one at a time.** Each set is 10 to 15 new items. "Start with two words, and only add one new word at a time." That is close to how Learn already works: 2 cards to start, with more added as the learner keeps up. ([First Hundred Hours](https://growingparticipatorapproach.wordpress.com/first-hundred-hours-2009/))
- **Grouped by scene, concrete first.** The sessions run people and pronouns, then animals, objects, places in the room, body parts, actions, family, and then possession, colours, numbers, emotions and so on. Words are picturable "here and now" things before abstract ones. Verbs arrive early (session 6), attached to nouns the learner already knows.
- **Old words woven into new sessions.** Each session mixes the last one or two sessions' items with much older ones, and some sessions add fewer new words to keep old ones alive. Review, Quick Recall and Stories already do this.
- **Words live in context.** "Words don't amount to much… apart from the life they are woven together with." Stories built from known words are our nearest equivalent.
- **Scale.** GPA counts about 900 words after Phase 1 and about 2,250 after Phase 2 ([Wikipedia](https://en.wikipedia.org/wiki/Growing_Participator_Approach)). A 2,000-word list therefore takes a learner to roughly the end of GPA Phase 2, where they can follow and retell simple stories.
- **Level by what a learner can do.** GPA describes each phase by participation ("I understand what I hear if I can clearly see what is being talked about"). It has no published placement test. An Ethiopian programme maps phases 1 to 5 onto CEFR A1 to B2/C1 ([Mas et al. 2015](https://www.sciencedirect.com/science/article/pii/S1877042815019680)).

Where we differ, and why:

- **Reading.** GPA delays reading. Our cards are text-first, which suits adults with no nurturer. I suggest an optional "Hear it first" setting for the first 200 words, where a card's front is the audio and the spelling appears on the back.
- **Order.** GPA's order is by scene, not by frequency. We use frequency to decide which words go in each band, and scenes to order the words within a band (section 3). That gives the learner both the most useful words and GPA's focus.

## 2. The word list

The list is about 2,000 base words, each one an item with its forms (plurals, verb forms) as today. Phrases stay a separate deck with the same tags. Each word has:

- **Recommended order** (1 to 2,000): one number that decides everything else. It is today's `rank`, extended to 2,000.
- **Band**, which comes from the order rather than being chosen per word. It is shown as a "Common" tag.

  | Band | Order | Words |
  |---|---|---|
  | Common 100 | 1–100 | 100 |
  | Common 200 | 101–200 | 100 |
  | Common 500 | 201–500 | 300 |
  | Common 800 | 501–800 | 300 |
  | Common 1200 | 801–1,200 | 400 |
  | Common 2000 | 1,201–2,000 | 800 |

  Taking the bands from the order means a word can never sit in the wrong band. They also replace Learn's current tiers (100, then 400): a band opens once the one before it is learned, as tiers do now.

- **Topic tags**, as many as fit: family, people, body, food and drink, house, clothes, animals, farming, numbers, time and dates, weather, places and travel, shopping and money, health, school, church and faith, business and work, government, feelings, colours and sizes, actions (verbs), and question and function words. "Church" covers words like imana (God), gusenga (to pray), itorero (church) and Bibiliya (Bible).
- **Part of speech and noun class**, already stored for nouns.
- **Picturable** (yes or no): concrete things and actions you can see. In each band these come first.

### Sources for the order

There is no ready-made frequency list for Kinyarwanda. I suggest blending three sources:

1. **Counts from real text.** Candidates are Mozilla Common Voice's Kinyarwanda sentences (very large, everyday speech) and the KINNEWS news corpus. Because Kinyarwanda adds prefixes, words would be counted by stem (umwana, abana and cy'umwana all count as -ana). I'd need your approval to download these datasets.
2. **A core list of everyday concepts**, from English core-vocabulary lists and GPA's scene order, so that daily-life words beat newspaper words.
3. **Your judgment, and a native speaker's**, on the AI draft. This is what decision 66 did for the first 100 words.

As before, AI drafts the 2,000 entries (meaning, plural, class, tags, example sentence) and native review in the admin screens (Prompt 12) checks them.

## 3. Order within a band: small topic clusters

Inside each band, words come in clusters of 10 to 15 that share a topic, GPA's "dirty dozen". For example, in Common 200 a learner might get 12 family words, then 12 food and market words, then 12 house words. To keep clusters useful:

- **Each cluster mixes nouns with one or two verbs and a function word**, so a story or example sentence can be made from it ("umwana arya ibiryo").
- **Picturable clusters come before abstract ones** in each band.
- **Topics rotate.** The same topic doesn't come up twice in a row, and every topic returns in each band at a harder level. Family in Common 100 is mama and data (mum and dad); in Common 800 it is sekuru (grandfather) and ubukwe (wedding).
- **The cluster's topic shows on the card** ("Common 200 · Family"), so learners know what they're working on.

The recommended order is simply this sequence written down: band by band, cluster by cluster.

## 4. How Learn draws from it

- **By default**, Learn introduces the next words in recommended order, one cluster at a time, skipping any word already learned or pre-learned. A learner who does nothing special works through Common 100, then Common 200, and so on.
- **The first 100 words are fixed**, as you suggested: everyone learns Common 100 (or places out of it) before choosing topics.
- **After that, topics can be pulled forward.** A Topics screen lists each tag with "N of M learned". Choosing one, say "Church", brings that topic's next cluster, in recommended order, to the front of Learn. This uses the same mechanism as Add to Learn from a story (`bringForward`, decision 136).
  - It takes the topic's next cluster from the current band first, then the next band's, and so on.
  - Once the pulled cluster is learned, Learn returns to the next common cluster. The common pile is always there underneath.
  - Only one topic is pulled at a time, so a learner can't bury the common words. The current topic can be swapped or cleared.
- **The pool rules stay** (decision 139): 2 to start, up to 2 more after a round with every card right, and fewer after misses.
- **Phrases** follow the same plan with their own order and tags.

## 5. The placement check

This is an optional check of about 5 minutes, offered on first open ("Already know some Kinyarwanda?") and later from Profile. It tests understanding, not speaking, which is GPA's priority.

1. **Words, adaptive.** It hears or shows a word and asks the learner to pick its meaning from 4, as in Quick Recall.
   - It starts at about order 50 and moves up through the order while the learner is right, and down when they miss.
   - It tests 3 words at each level, at orders 50, 150, 350, 650, 1,000, 1,600 and 2,000, with finer steps near where the answers turn.
   - "I don't know" is always an option, so the learner never has to guess.
   - It takes about 25 to 35 questions.
2. **Made-up words to catch guessing.** A few invented words that sound like Kinyarwanda are mixed in, asking "Is this a real word?", as the LexTALE test does. Saying yes to invented words lowers the estimate.
3. **Verb forms.** Up to 6 questions on hearing a verb form and picking its meaning ("barakina": they play). Each one right places the learner up to Verb Builder level 1, 2 or 3.
4. **The result.** The learner's **placement point** is the highest order where they got at least 80% of words right, allowing for the guessing check.
   - It is shown as a can-do sentence, for example: "You know about the first 500 words, enough to follow simple talk about family, food and the house."

### Pre-learned words (the monthly rotation)

- Every word below the placement point goes straight into Review as **pre-learned**, not into Learn.
- Pre-learned words get a long first interval: due dates spread evenly over the next 30 days, so a few come up each day rather than all at once.
- A pre-learned word answered right moves on to longer intervals. One that is missed is treated like any missed review card: it gets the recheck, and after a second miss it goes back to Learn's next cluster.
- They count toward story vocabulary at once. Home shows them separately ("420 known from placement, 37 confirmed") until each has been confirmed by a right answer.
- Learners can retake the check. A higher placement adds pre-learned words; a lower one never removes learned words.

The placement point also sets Stories' starting difficulty, since Stories already work from the words a learner knows.

## 6. What changes in the data

- **`items`**: `rank` becomes the recommended order (1 to 2,000), plus `tags text[]` and `picturable boolean`. The bands come from the rank.
- **A `tags` table**: name, kind (band or topic), label and description.
- **`review_items`**: a `source` column (`learn` or `placement`) and `confirmed_at`, so pre-learned words can be counted and shown apart.
- **`learn_state`**: the pulled topic (`ahead` already covers the mechanism).
- **A `placement_results` table**: the date, the placement point, the verb level and the answers, so a retake can be compared with the last one.
- **Audio**: 2,000 words with all their forms is about 6,000 to 8,000 clips. That is worth costing in ElevenLabs credits before making them.

## 7. Decisions (Matt, 3 November 2026)

1. The bands are 100, 200, 500, 800, 1,200 and 2,000.
2. The topic tag list is agreed.
3. Common Voice and KINNEWS may be downloaded to count stem frequencies.
4. Placement is about 5 minutes of recognition questions with the guessing check, and it also places Verb Builder levels.
5. Pre-learned words come due over the first 30 days. After that the normal schedule applies, so a word's interval can grow past a month or shrink below it.
6. One topic at a time: a pulled topic stays the focus until all its words are learned.
7. No "Hear it first" cards.

Also added to the build plan's later phases: **scenes**, which are pictures of everyday places with descriptions and their words marked. A word met in a scene or a story can be marked as learned and go straight into Review.

### The questions as first asked

1. Are the bands right: 100, 200, 500, 800, 1,200, 2,000?
2. Is the topic tag list right? Should anything be added (say, ministry or prayer under church, or agriculture beyond farming) or merged?
3. May I download Common Voice and KINNEWS to count stem frequencies, or should the order come from AI drafts plus your judgment only?
4. Placement: is 5 minutes, recognition only, with the guessing check right? And should it place Verb Builder levels too?
5. Pre-learned words: due over the first 30 days, then the normal schedule?
6. Pulling topics: one topic at a time, or several?
7. "Hear it first" cards for the first 200 words: yes, no, or a setting?

Suggested build order once agreed:

1. The word list and tags (AI draft, about 2,000 entries, reviewed in batches of 100).
2. Bands and clusters in Learn, and the Topics screen.
3. The placement check and pre-learned words.
4. Audio for each band as it is approved.
