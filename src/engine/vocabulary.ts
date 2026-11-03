// The vocabulary plan's bands and topics (docs/vocabulary-plan.md, decisions 157 to 159).
// A word's band comes from its recommended order (its rank), so it can never sit in the
// wrong band. Pure: the draft scripts import it too.

export interface Band {
  /** 1 to 6, stored as the item's tier. */
  number: number;
  /** "Common 200" */
  name: string;
  /** Ranks first..last. */
  first: number;
  last: number;
}

/** The bands' last ranks (Matt, 3 November 2026). Beyond 2,000 the last band continues. */
const ENDS = [100, 200, 500, 800, 1200, 2000];

export const BANDS: Band[] = ENDS.map((last, i) => ({
  number: i + 1,
  name: `Common ${last}`,
  first: (ENDS[i - 1] ?? 0) + 1,
  last,
}));

/** Band sizes in rank order, for Learn's tiers. */
export const BAND_SIZES = BANDS.map((b) => b.last - b.first + 1);

export function bandFor(rank: number): Band {
  return BANDS.find((b) => rank <= b.last) ?? BANDS[BANDS.length - 1]!;
}

/** The topic tags, in the order the Topics screen lists them. */
export const TOPICS = [
  { key: 'people', label: 'People' },
  { key: 'family', label: 'Family' },
  { key: 'body', label: 'Body' },
  { key: 'food', label: 'Food and drink' },
  { key: 'house', label: 'House' },
  { key: 'clothes', label: 'Clothes' },
  { key: 'animals', label: 'Animals' },
  { key: 'farming', label: 'Farming' },
  { key: 'numbers', label: 'Numbers' },
  { key: 'time', label: 'Time and dates' },
  { key: 'weather', label: 'Weather' },
  { key: 'places', label: 'Places and travel' },
  { key: 'shopping', label: 'Shopping and money' },
  { key: 'health', label: 'Health' },
  { key: 'school', label: 'School' },
  { key: 'church', label: 'Church and faith' },
  { key: 'work', label: 'Business and work' },
  { key: 'government', label: 'Government' },
  { key: 'feelings', label: 'Feelings' },
  { key: 'colours', label: 'Colours and sizes' },
  { key: 'actions', label: 'Actions' },
  { key: 'function', label: 'Question and function words' },
] as const;

export type TopicKey = (typeof TOPICS)[number]['key'];

export const topicLabel = (key: string) => TOPICS.find((t) => t.key === key)?.label ?? key;

/**
 * Where a word sits, as shown on its card: "Common 200 · Family". The first tag is the
 * cluster's topic.
 */
export function placeLabel(item: { rank: number; tags?: readonly string[] }): string {
  const band = bandFor(item.rank).name;
  const topic = item.tags?.[0];
  return topic ? `${band} · ${topicLabel(topic)}` : band;
}
