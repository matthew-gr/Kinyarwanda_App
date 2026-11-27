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
