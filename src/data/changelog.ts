// What changed in each version of the app, newest first, shown on the What's new screen.
// Bump `version` in package.json with each release and add its entry here, in words a learner
// understands. The build adds the commit (0.2.0+abc1234) to the version the app shows.

export interface Release {
  version: string;
  /** ISO date, or null when it isn't known. */
  date: string | null;
  changes: string[];
}

export const CHANGELOG: readonly Release[] = [
  {
    version: '0.15.0',
    date: '2026-11-27',
    changes: [
      'Noun Classes: pick which class a noun you’ve learned is in, or make its plural or singular, then see its prefix in its class’s colour.',
    ],
  },
  {
    version: '0.14.0',
    date: '2026-11-27',
    changes: [
      'Fixed: a word’s stem listed unrelated words that only looked alike. It now shows its real family, like gukina, umukino and umukinnyi.',
      'About this word, under a card: its family, and memory hints in English, and in Swahili or German if you choose them in Profile.',
      'Sounds wrong now asks for the recording to be made again, in the same tap.',
    ],
  },
  {
    version: '0.13.0',
    date: '2026-11-27',
    changes: [
      'Sound Pairs: tell apart words that look and sound almost the same, like umwana (child) and umwaka (year). Read a meaning and pick the word, or hear a word and pick the one that was said.',
    ],
  },
  {
    version: '0.12.0',
    date: '2026-11-27',
    changes: [
      '75 more phrases: 50 for everyday life, from asking the time to wishing a happy birthday, then 25 Kinyarwanda proverbs with what they mean.',
      'The new phrases have no audio yet; it comes once they’ve been checked.',
    ],
  },
  {
    version: '0.11.0',
    date: '2026-11-27',
    changes: [
      'The back of a card shows a noun’s class prefix in its class’s colour (1/2 blue, 3/4 green, 7/8 orange, 9/10 red, and so on) and underlines the stem.',
      'Tap the stem to see what the prefix means and which words you’ve learned share the stem.',
      'Streak freezes: earn more with perfect rounds of 20, and keep as many as you earn. The next freeze takes one more perfect round in a row than the freezes you have. You still get one free each week when you have none.',
    ],
  },
  {
    version: '0.10.0',
    date: '2026-11-27',
    changes: [
      'A cleaner finish screen: tap a block on the wall to see how that round went, or a gray one to see the rounds still to come. The gray blocks now fade out softly, in dark mode too.',
      'Recording sounds wrong? Say so under the card, front or back. Its play button turns red and it only plays when you tap it.',
      'A re-record request stays shown the next time you meet the card.',
    ],
  },
  {
    version: '0.9.0',
    date: '2026-11-27',
    changes: [
      'Review timing: try FSRS, the scheduler Anki uses, in Profile, Settings. It fits each card’s wait to how well you know it. Switch back any time: your cards are rescheduled from your answers.',
      'With FSRS, Review shows how often each card comes back (“every 3.4 days”) and when it comes back after each answer.',
      'Verb Builder asks about the verbs you haven’t mastered yet, instead of the ones you already know.',
    ],
  },
  {
    version: '0.8.0',
    date: '2026-11-27',
    changes: [
      'Review: tapped the wrong button? “Undo last answer” takes it back for a few seconds after you answer.',
      'Cards with audio ask whether the recording sounds right. Once you confirm it, the play button turns green.',
      'Today’s wall shows the rounds still to come as gray blocks: dark gray for what is due now, light gray for later today.',
      'Fewer reviews: a card you still know after a long gap moves up further, to match how long you remembered it.',
      'Dark mode. It follows your phone, or choose Light or Dark in Profile, Settings.',
    ],
  },
  {
    version: '0.7.0',
    date: '2026-11-27',
    changes: [
      'Learn comes in batches of 20 answers. Each batch adds a blue block to today’s wall, which starts empty every day.',
      'Stories: you can play a story with each line in English after it, in your phone’s own voice.',
      'Card audio plays on its own more reliably, especially on iPhone.',
      'New installs since 0.5.0 had no card audio. Fixed: it downloads the next time the app checks for course changes.',
      'Debug mode asks before anything that costs money, with an estimate: writing a story, or making its audio.',
    ],
  },
  {
    version: '0.6.0',
    date: '2026-11-27',
    changes: [
      'Review: a round starts when 20 cards are due. With fewer due, Review says when the round starts, unless fewer than 20 are due by the end of the day.',
      'Review: the wall is centred, and it shows missed words in the form you saw them.',
      'After 25 minutes of practice without a break, the app suggests a short break.',
      'Home: how many you’ve reviewed today has its own line.',
    ],
  },
  {
    version: '0.5.0',
    date: '2026-11-27',
    changes: [
      'Emoji on the back of about half the course’s cards, where one shows the meaning.',
      'Review: the finish screen shows today’s rounds as a wall of blocks, coloured from red to green by how many you knew. Tap a block to see its missed words.',
      'Debug mode in Profile, Settings: a dot in the corner shows whether your time is being counted, and Verb Builder shows what is left to master at your level.',
      'Review: answering quickly while the app updated in the background could repeat a card and stop the round. Fixed.',
    ],
  },
  {
    version: '0.4.0',
    date: '2026-11-27',
    changes: [
      'Review comes in rounds of 20. The count only goes up: cards that come due during a round wait for the next one.',
      'After each round you see what you did, and you can start another round or stop there.',
      'Home shows how long the next round takes, and how many you’ve reviewed today. The full number waiting is in small print.',
      'With a big pile, the first round starts with words you’re likely to know, and words you just missed.',
      'With more than 100 reviews waiting, Learn suggests a review round first. You can still learn.',
    ],
  },
  {
    version: '0.3.0',
    date: '2026-11-26',
    changes: [
      'Review: a word you miss comes back in the same form you missed, not an easier one.',
      'Review: due cards come in a random order, so you can’t answer by remembering the order.',
      'Review: the back of the card shows when the card comes back if you knew it and if you didn’t, and the header shows how often it comes now.',
      'Review: a singular noun shows its plural on the back of the card.',
      'Quick Recall: the wrong answers are meanings of words you’ve learned, so the right one doesn’t stand out.',
      'Stories: a rating you give when reading an older story again now counts for the next story.',
      'Profile: Download my progress saves your words, reviews, stories and settings as one file.',
    ],
  },
  {
    version: '0.2.0',
    date: '2026-11-26',
    changes: [
      'Audio speed: slow down words, phrases and stories to 0.85×, 0.7× or 0.5× in Profile, Settings, or with the speed button in a story. The voice keeps its pitch.',
      'Stories: the audio is made the first time you press Play the story, so wait a few seconds the first time.',
      'Stories are now at most 200 words long.',
      'Stories: you can ask for 10 new stories a day, and one at a time. A story that fails to be written counts towards the 10.',
      'Profile shows the app’s version, with this list of changes.',
    ],
  },
  {
    version: '0.1.0',
    date: null,
    changes: ['The first test version.'],
  },
];
