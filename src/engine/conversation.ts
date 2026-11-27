// Conversations (decision 215; learner feedback: rule-based conversation practice with no paid
// services). Pure functions: no React, no storage, no clock.
//
// Each level is a short exchange: the app speaks, the learner replies. Levels build on each
// other twice over: the topics grow from greetings to a whole conversation, reusing what came
// before, and the replies go from picking one (levels 1 and 2), to building it from word tiles
// (3 and 4), to typing it (5 on). A role card (name, home town, job, children, what to buy)
// is dealt each time, and the replies have to fit it, so a level plays out differently each
// time.
//
// AI DRAFT. Written by Claude from the course's phrases where it could, not yet checked by a
// native speaker.

import { pickOne, shuffle, type Rng } from './random';

export type ReplyMode = 'choose' | 'build' | 'type';

/** Facts of the learner's role, dealt for each play. */
export interface Role {
  name: string;
  otherName: string;
  place: string;
  otherPlace: string;
  children: { rw: string; en: string };
  job: { rw: string; en: string };
  item: { rw: string; en: string };
}

/** A turn as written, with {name}-style slots filled from the role. */
interface TurnSpec {
  them: string;
  themEn: string;
  /** Accepted replies; the first is the one shown and built from tiles. */
  replies: string[];
  replyEn: string;
  /** Wrong replies to pick from (choose), and whose words become extra tiles (build). */
  wrong: string[];
}

export interface Level {
  number: number;
  title: string;
  /** What it practises. */
  goal: string;
  mode: ReplyMode;
  turns: TurnSpec[];
}

export interface Turn {
  them: string;
  themEn: string;
  replies: string[];
  replyEn: string;
  wrong: string[];
}

const NAMES = ['Aline', 'Eric', 'Grace', 'Jean', 'Diane', 'Patrick', 'Claudine', 'Olivier'];
const PLACES = ['Kigali', 'Huye', 'Musanze', 'Rubavu', 'Rusizi', 'Nyagatare'];
const CHILDREN = [
  { rw: 'umwana umwe', en: 'one child' },
  { rw: 'abana babiri', en: 'two children' },
  { rw: 'abana batatu', en: 'three children' },
];
const JOBS = [
  { rw: 'umwarimu', en: 'a teacher' },
  { rw: 'umuganga', en: 'a doctor' },
  { rw: 'umuhinzi', en: 'a farmer' },
  { rw: 'umunyeshuri', en: 'a student' },
];
const ITEMS = [
  { rw: 'umugati', en: 'bread' },
  { rw: 'amazi', en: 'water' },
  { rw: 'icyayi', en: 'tea' },
  { rw: 'amata', en: 'milk' },
];

export function dealRole(rng: Rng): Role {
  const [name, otherName] = shuffle(NAMES, rng) as [string, string];
  const [place, otherPlace] = shuffle(PLACES, rng) as [string, string];
  return {
    name,
    otherName,
    place,
    otherPlace,
    children: pickOne(CHILDREN, rng),
    job: pickOne(JOBS, rng),
    item: pickOne(ITEMS, rng),
  };
}

/** The role in English, for the card shown before a level. */
export const roleText = (r: Role) =>
  `You are ${r.name}, from ${r.place}. You are ${r.job.en}, with ${r.children.en}. You want to buy ${r.item.en}.`;

const GREETINGS: TurnSpec[] = [
  {
    them: 'Mwaramutse!',
    themEn: 'Good morning!',
    replies: ['Mwaramutse!', 'Mwaramutse neza!'],
    replyEn: 'Good morning!',
    wrong: ['Murabeho!', 'Ijoro ryiza!'],
  },
  {
    them: 'Amakuru yawe?',
    themEn: 'How are you?',
    replies: ['Ni meza, murakoze.', 'Ni meza.', 'Ni byiza.'],
    replyEn: 'Fine, thank you.',
    wrong: ['Ni kure.', 'Sinzi.'],
  },
];

const FAREWELL: TurnSpec = {
  them: 'Tuzabonana!',
  themEn: 'See you later!',
  replies: ['Murabeho!', 'Tuzabonana!'],
  replyEn: 'Goodbye!',
  wrong: ['Mwaramutse!', 'Ndaje.'],
};

const INTRODUCTIONS: TurnSpec[] = [
  {
    them: 'Witwa nde?',
    themEn: 'What is your name?',
    replies: ['Nitwa {name}.'],
    replyEn: 'My name is {name}.',
    wrong: ['Nitwa {otherName}.', 'Ntuye i {place}.'],
  },
  {
    them: 'Uturuka he?',
    themEn: 'Where are you from?',
    replies: ['Nturuka i {place}.'],
    replyEn: 'I come from {place}.',
    wrong: ['Nturuka i {otherPlace}.', 'Nitwa {name}.'],
  },
];

const FAMILY: TurnSpec[] = [
  {
    them: 'Ufite abana?',
    themEn: 'Do you have children?',
    replies: ['Mfite {children}.', 'Yego, mfite {children}.'],
    replyEn: 'I have {childrenEn}.',
    wrong: ['Ndi {job}.', 'Ntuye i {place}.'],
  },
  {
    them: 'Ukora iki?',
    themEn: 'What do you do (for work)?',
    replies: ['Ndi {job}.'],
    replyEn: 'I am {jobEn}.',
    wrong: ['Mfite {children}.', 'Nitwa {name}.'],
  },
  {
    them: 'Utuye he?',
    themEn: 'Where do you live?',
    replies: ['Ntuye i {place}.'],
    replyEn: 'I live in {place}.',
    wrong: ['Ntuye i {otherPlace}.', 'Ndi {job}.'],
  },
];

const SHOPPING: TurnSpec[] = [
  {
    them: 'Murakaza neza! Mushaka iki?',
    themEn: 'Welcome! What would you like?',
    replies: ['Ndashaka {item}.'],
    replyEn: 'I want {itemEn}.',
    wrong: ['Ndashaka kujya i {place}.', 'Ndahaze.'],
  },
  {
    them: 'Ni amafaranga igihumbi.',
    themEn: 'It’s a thousand francs.',
    replies: ['Birahenze. Gabanyaho gato.', 'Birahenze.', 'Gabanyaho gato.'],
    replyEn: 'That’s expensive. Bring the price down a little.',
    wrong: ['Ni hafi.', 'Mfite inyota.'],
  },
  {
    them: 'Ni byiza. Ni magana atanu.',
    themEn: 'All right. It’s five hundred.',
    replies: ['Ndashaka kwishyura.', 'Ni byiza, ndashaka kwishyura.'],
    replyEn: 'I want to pay.',
    wrong: ['Nta kibazo mfite.', 'Ndarwaye.'],
  },
  {
    them: 'Murakoze cyane!',
    themEn: 'Thank you very much!',
    replies: ['Murakoze namwe!', 'Murakoze!'],
    replyEn: 'Thank you too!',
    wrong: ['Mbabarira!', 'Sinumva.'],
  },
];

const GETTING_AROUND: TurnSpec[] = [
  {
    them: 'Ushaka kujya he?',
    themEn: 'Where do you want to go?',
    replies: ['Ndashaka kujya i {otherPlace}.', 'Unjyane i {otherPlace}.'],
    replyEn: 'I want to go to {otherPlace}.',
    wrong: ['Ntuye i {place}.', 'Ndashaka {item}.'],
  },
  {
    them: 'Ni kure.',
    themEn: 'It’s far.',
    replies: ['Ni angahe?', 'Ni amafaranga angahe?'],
    replyEn: 'How much is it?',
    wrong: ['Ni hafi.', 'Ndahaze.'],
  },
  {
    them: 'Ni amafaranga ibihumbi bitanu.',
    themEn: 'It’s five thousand francs.',
    replies: ['Ni byiza.', 'Yego.', 'Ni byo.'],
    replyEn: 'All right.',
    wrong: ['Ni meza.', 'Mfite abana.'],
  },
  {
    them: 'Twageze. Duhagarare he?',
    themEn: 'We’re here. Where shall we stop?',
    replies: ['Hagarara hano.'],
    replyEn: 'Stop here.',
    wrong: ['Kata ibumoso.', 'Jya imbere.'],
  },
];

const VISITING: TurnSpec[] = [
  {
    them: 'Murakaza neza! Murisanga.',
    themEn: 'Welcome! Make yourself at home.',
    replies: ['Murakoze cyane.', 'Murakoze.'],
    replyEn: 'Thank you very much.',
    wrong: ['Murabeho.', 'Ndarwaye.'],
  },
  {
    them: 'Ushaka icyayi?',
    themEn: 'Would you like tea?',
    replies: ['Yego, ndashaka icyayi.', 'Yego.', 'Ndashaka icyayi.', 'Yego, murakoze.'],
    replyEn: 'Yes, I’d like tea.',
    wrong: ['Ndashaka kwishyura.', 'Ni kure.'],
  },
  {
    them: 'Ibiryo biraryoshye?',
    themEn: 'Is the food good?',
    replies: ['Ibiryo biraryoshye.', 'Yego, biraryoshye.', 'Biraryoshye.'],
    replyEn: 'The food is delicious.',
    wrong: ['Birahenze.', 'Mfite inzara.'],
  },
  {
    them: 'Ushaka ibindi?',
    themEn: 'Would you like more?',
    replies: ['Oya, murakoze. Ndahaze.', 'Oya, murakoze.', 'Ndahaze.', 'Oya, ndahaze.'],
    replyEn: 'No, thank you. I’m full.',
    wrong: ['Mfite inzara.', 'Ndaje.'],
  },
];

const HEALTH: TurnSpec[] = [
  {
    them: 'Amakuru yawe?',
    themEn: 'How are you?',
    replies: ['Ndarwaye.', 'Si meza, ndarwaye.'],
    replyEn: 'I’m sick.',
    wrong: ['Ni meza.', 'Ndishimye.'],
  },
  {
    them: 'Urwaye iki?',
    themEn: 'What’s wrong with you?',
    replies: ['Ndarwaye umutwe.'],
    replyEn: 'I have a headache.',
    wrong: ['Ndashaka icyayi.', 'Ndi umwarimu.'],
  },
  {
    them: 'Ihangane. Ushaka umuganga?',
    themEn: 'I’m sorry. Do you want a doctor?',
    replies: ['Yego, ndashaka umuganga.', 'Ndashaka umuganga.', 'Yego.'],
    replyEn: 'Yes, I need a doctor.',
    wrong: ['Oya, ndahaze.', 'Ndashaka kwishyura.'],
  },
  {
    them: 'Komera!',
    themEn: 'Get well! (Be strong!)',
    replies: ['Murakoze.', 'Murakoze cyane.'],
    replyEn: 'Thank you.',
    wrong: ['Murabeho.', 'Mbabarira.'],
  },
];

export const LEVELS: readonly Level[] = [
  {
    number: 1,
    title: 'Greetings',
    goal: 'Greet someone, say how you are, and say goodbye.',
    mode: 'choose',
    turns: [
      ...GREETINGS,
      {
        them: 'Murakaza neza.',
        themEn: 'Welcome.',
        replies: ['Murakoze.', 'Murakoze cyane.'],
        replyEn: 'Thank you.',
        wrong: ['Mbabarira.', 'Ni kure.'],
      },
      FAREWELL,
    ],
  },
  {
    number: 2,
    title: 'Meeting someone',
    goal: 'Greet, then give your name and where you are from.',
    mode: 'choose',
    turns: [
      ...GREETINGS,
      ...INTRODUCTIONS,
      {
        them: 'Nishimiye kukumenya.',
        themEn: 'Nice to meet you.',
        replies: ['Nanjye nishimiye kukumenya.', 'Nanjye.'],
        replyEn: 'Nice to meet you too.',
        wrong: ['Ni kure?', 'Ndahaze.'],
      },
    ],
  },
  {
    number: 3,
    title: 'Family, work and home',
    goal: 'Say your name, your children, your work and where you live.',
    mode: 'build',
    turns: [INTRODUCTIONS[0]!, ...FAMILY, FAREWELL],
  },
  {
    number: 4,
    title: 'At the market',
    goal: 'Greet the seller, ask for something, bargain and pay.',
    mode: 'build',
    turns: [GREETINGS[0]!, ...SHOPPING],
  },
  {
    number: 5,
    title: 'Taking a moto',
    goal: 'Say where you want to go, ask the price and say where to stop.',
    mode: 'type',
    turns: [GREETINGS[0]!, ...GETTING_AROUND],
  },
  {
    number: 6,
    title: 'Visiting a family',
    goal: 'Thank your hosts, accept tea, praise the food and say you are full.',
    mode: 'type',
    turns: [GREETINGS[1]!, ...VISITING, FAREWELL],
  },
  {
    number: 7,
    title: 'Feeling unwell',
    goal: 'Say you are sick, what hurts, and ask for a doctor.',
    mode: 'type',
    turns: HEALTH,
  },
  {
    number: 8,
    title: 'A whole conversation',
    goal: 'Everything so far: greet, introduce yourself, talk about family and work, say goodbye.',
    mode: 'type',
    turns: [...GREETINGS, ...INTRODUCTIONS, ...FAMILY, FAREWELL],
  },
];

/** Fills a line's slots from the role. */
export function fill(text: string, r: Role): string {
  return text
    .replaceAll('{name}', r.name)
    .replaceAll('{otherName}', r.otherName)
    .replaceAll('{place}', r.place)
    .replaceAll('{otherPlace}', r.otherPlace)
    .replaceAll('{childrenEn}', r.children.en)
    .replaceAll('{children}', r.children.rw)
    .replaceAll('{jobEn}', r.job.en)
    .replaceAll('{job}', r.job.rw)
    .replaceAll('{itemEn}', r.item.en)
    .replaceAll('{item}', r.item.rw);
}

/** A level's turns with the role filled in. */
export const levelTurns = (level: Level, r: Role): Turn[] =>
  level.turns.map((t) => ({
    them: fill(t.them, r),
    themEn: fill(t.themEn, r),
    replies: t.replies.map((x) => fill(x, r)),
    replyEn: fill(t.replyEn, r),
    wrong: t.wrong.map((x) => fill(x, r)),
  }));

/** A reply as compared: lower case, one kind of apostrophe, no punctuation, single spaces. */
export const normalize = (s: string) =>
  s
    .toLowerCase()
    .replaceAll('’', "'")
    .replace(/[.,!?;:…]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Whether a typed or built reply is one of the accepted ones. */
export const accepts = (turn: Turn, reply: string) =>
  turn.replies.some((r) => normalize(r) === normalize(reply));

/** The replies to pick from: the first accepted one and the wrong ones. */
export const choices = (turn: Turn, rng: Rng) => shuffle([turn.replies[0]!, ...turn.wrong], rng);

/** Word tiles for building the reply: its words, and two from the wrong replies. */
export function tiles(turn: Turn, rng: Rng): string[] {
  const words = turn.replies[0]!.split(' ');
  const own = new Set(words.map(normalize));
  const extra = shuffle(
    [...new Set(turn.wrong.flatMap((w) => w.split(' ')))].filter((w) => !own.has(normalize(w))),
    rng,
  ).slice(0, 2);
  return shuffle([...words, ...extra], rng);
}

/** A level is passed with this share of replies right first time. */
export const PASS_SHARE = 0.8;
