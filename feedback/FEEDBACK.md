# Learner feedback

Sent from the Feedback box on the Profile screen of the app. The `feedback` server function
adds each message here, newest at the bottom. This repository is public, so entries carry no
name, email or account: only the date, the part of the app it is about, the app version and the
message. Every message is also kept in the `feedback` table in Supabase.

### 2026-11-20 12:22 UTC · General · 0.1.0+698069f
<!-- feedback:8027e7d8-f497-49ba-9ba7-3f082b029de4 -->

> I would love it if the app prompted me to translate English to Kinyarwanda.

### 2026-11-20 14:04 UTC · General · 0.1.0+698069f
<!-- feedback:02e782cf-3022-4dfa-af9b-794f1ca016f9 -->

> An exercise to practice noun classes would be helpful.

### 2026-11-20 14:06 UTC · Learn · 0.1.0+698069f
<!-- feedback:f84ebfc7-e041-43bc-b78e-38f930ccbd30 -->

> More phrases would be great, especially proverbs.

### 2026-11-23 06:47 UTC · General · 0.1.0+698069f
<!-- feedback:9e1e8690-e995-4465-9610-a3389e5f51d5 -->

> A toggle for a dark mode would be nice.

### 2026-11-23 10:09 UTC · Review · 0.1.0+698069f
<!-- feedback:9d6495bb-84a5-447b-bba6-5408c487adb8 -->

> Expected behavior: If I get a word wrong, the next time I see it should be the exact same form of that word.
>
> Actual behavior: If I get a word wrong, the next time I see it is often a different/easier form of that word.

### 2026-11-23 10:22 UTC · Review · 0.1.0+698069f
<!-- feedback:2aeff6e5-bd7b-48d9-838a-dda6557cb243 -->

> My impression is that the scheduler schedules too many reviews.
>
> I like Anki's scheduler. This is open-source app has a sophisticated algorithm. For example, when a card is scheduled for review after 4 hours, but I review it only after 3 days and get it right, the scheduler won't schedule the next review after 1 day, but 6 days or something similar. Instead of fixed intervals, the intervals are tailored to each card.
>
> It would be great to have an option to turn Anki's algorithm on and off to test if it works as expected.
>
> Also, it would be helpful to see for each card
> \- the current review frequency (e.g., 3.4 days)
> the new review frequency when I get it right (e.g., 6.8 days)
> \- the new review frequency when I get it wrong (e.g., 5 min)

### 2026-11-23 11:42 UTC · Drills · 0.1.0+698069f
<!-- feedback:030a2a54-d94d-4632-8807-de539063c008 -->

> The speed recall offers words as choices that have not been lerned yet. Because I can just look for the word(s) I already know, the exercise becomes too easy.

### 2026-11-23 14:10 UTC · General · 0.1.0+698069f
<!-- feedback:4481f551-0e22-4bdb-a896-cb6ec4e90b2e -->

> A button to download the progress as a file could be helpful to have a backup.

### 2026-11-24 08:41 UTC · Review · 0.1.0+698069f
<!-- feedback:818142e1-b9cf-4cdf-81af-375317d4b5a2 -->

> Idea: Shuffle cards before review so that they do not appear in the same order again after answering them correctly.

### 2026-11-24 08:42 UTC · Review · 0.1.0+698069f
<!-- feedback:b9749edf-70db-4338-9823-6b5a1b8c1545 -->

> Idea: Show also the plural form of a singular noun on the card's back side. (The singular form is already being shown on a plural noun's back side.)

### 2026-11-24 08:57 UTC · Stories · 0.1.0+698069f
<!-- feedback:c53b6b25-404e-4081-87ab-159e21dbeda5 -->

> Idea: Adjust the reading speed. It is currently too fast for me.

### 2026-11-24 10:30 UTC · General · 0.1.0+698069f
<!-- feedback:74ddff2f-9de8-48ae-8d0a-b0fedf0fc90a -->

> The audio sometimes not matches the text (on \~20 % of the cards).

### 2026-11-24 12:43 UTC · General · 0.1.0+698069f
<!-- feedback:8f16b967-04bb-4a83-a6b6-10f8ef9d2317 -->

> The audio that does not match the text is caused by splitting the audio at the wrong places. This is currently visible in the story mode, when more or less than the highlighted line is being read.
>
> If it is difficult to find a tool that splits the audio at the right places, a reliable solution is to apply TTS by making one API request for each word (or line in story mode) instead of making a single API request for a long text passage and split it later on. However, this approach might increase cost.

### 2026-11-25 09:18 UTC · Stories · 0.1.0+698069f
<!-- feedback:d000bda9-ddd9-424a-a5b9-c930acccb556 -->

> It appears that the story builder disregards the feedback for stories that have been read before.

### 2026-11-25 13:20 UTC · Stories · 0.1.0+698069f
<!-- feedback:c6117c90-ade0-466e-8ce2-a2190089aa89 -->

> Idea: Answer 5 - 10 instead of 3 multiple choice questions to get a more precise assessment.

### 2026-11-27 07:42 UTC · Review · 0.4.0+1d8a852
<!-- feedback:b284c792-568d-4d86-b6cf-83ac25c9fcec -->

> Vizualize the progress on the finish screen as a wall that builds up. Each round is a square block. They build up from bottom to top, left to right. 5 blocks per row. Their color shows the accuracy. Green = 100 %, Yellow = 50 %, Red = 0 %. Interpolate colors. On top of the colored blocks, dark grey blocks show predicted upcoming review rounds until no more reviews are due, taking into account scheduled reviews, current review speed, and current accuracy. On top of the dark grey blocks, light grey blocks show reviews that are scheduled for later today but will probably not be reached in this session. Therefore, the colored blocks first "fill up" the dark grey blocks, then the light grey blocks. Hovering over a colored block reveals the accuracy, missed words, and their translations.

### 2026-11-27 07:43 UTC · Learn · 0.4.0+1d8a852
<!-- feedback:5aa066c1-0d77-4c28-8f49-0af8b7932714 -->

> Add emojies at the back of cards. Preferably only one that relates to the stem.

### 2026-11-27 07:45 UTC · General · 0.4.0+1d8a852
<!-- feedback:17a657e5-99a6-459c-a5f1-27c02eaefabe -->

> Add a debugging mode that can be toggled on and of in the profile. If debugging is on, show when the time in the app is counted and when it is not counted. For example, by a green/red dot at the corner of the screen.

### 2026-11-27 07:47 UTC · Verb Builder · 0.4.0+1d8a852
<!-- feedback:5f3f8f14-851b-4e47-b3fe-83774c4dd719 -->

> I am stuck at 93/96 mastered words. When debugging is turned on and the user hovers over "93 of 96 mastered", show which words have not been mastered yet and what is missing until they will be mastered.

### 2026-11-27 07:53 UTC · General · 0.4.0+1d8a852
<!-- feedback:782711ba-4fba-4c24-9e03-2d95daab5689 -->

> On the back side of cards, add an explanation that pops up on hover/click that tells the user how to memorize the word faster. For example, by mentioning words that have the same or similar stem and a similar or different meaning. For example, I wonder why the word for hospital "ibitaro" is plural and which other words have "taro".

### 2026-11-27 09:23 UTC · Review · 0.5.0+0ec655f
<!-- feedback:46ddf8c1-af92-46ab-94f5-908684ad1b89 -->

> Only allow review if at least 20 cards need to be reviewed unless less than 20 cards are scheduled for the rest of the day.
>
> Horizontally center the wall of 5 times x blocks on the screen.
>
> For each block, show the missed words in the exact same form as they have been missed.

### 2026-11-27 09:23 UTC · General · 0.5.0+0ec655f
<!-- feedback:b7de6c74-1f3c-41e1-8d2d-a37d368296e9 -->

> In debug mode, ask the user for confirmation before he does something that incurs cost. Show him the estimated cost.
