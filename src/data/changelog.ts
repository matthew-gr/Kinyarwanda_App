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
