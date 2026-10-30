// Builds src/data/seed/content.json from the AI drafts below: the first 100 words in rank order
// with their forms, and the first 50 phrases in usefulness order.
//
// AI DRAFT. Written by Claude, not yet checked by a native speaker. Every row is marked
// status "ai_draft". Run once to make the seed; after that the Supabase tables are the source of
// truth and admins edit there.
//
//   node scripts/draft-content.ts
//
// IDs already in the snapshot are kept (matched by kind and base, and forms by text), so
// learners keep their progress when the drafts are rebuilt.

import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { syllables } from '../src/engine/pronunciation.ts';

const VERB_TABLE = new URL('../src/data/seed/verbs.json', import.meta.url);
const OUT = new URL('../src/data/seed/content.json', import.meta.url);
const SOURCE = 'ai:claude-opus-5-5';
const STAMP = '2026-10-30T00:00:00.000Z';

type Ex = [rw: string, en: string];

// [base, meaning, example]
const OTHER: Record<string, [string, Ex]> = {
  muraho: ['hello', ['Muraho, amakuru?', 'Hello, how are things?']],
  murakoze: ['thank you', ['Murakoze cyane!', 'Thank you very much!']],
  yego: ['yes', ['Yego, ni byo.', "Yes, that's right."]],
  oya: ['no', ['Oya, murakoze.', 'No, thank you.']],
  ni: ['is, it is', ['Ni umwana.', 'It is a child.']],
  na: ['and, with', ["Umugabo n'umugore.", 'The man and the woman.']],
  iki: ['what?', ['Ni iki?', 'What is it?']],
  nde: ['who?', ['Uri nde?', 'Who are you?']],
  he: ['where?', ['Uri he?', 'Where are you?']],
  ryari: ['when?', ['Uzaza ryari?', 'When will you come?']],
  kuki: ['why?', ['Kuki useka?', 'Why are you laughing?']],
  angahe: ['how many? how much?', ['Ni angahe?', 'How much is it?']],
  ubu: ['now', ['Ubu ndi mu rugo.', "Now I'm at home."]],
  ejo: ['yesterday, tomorrow', ['Tuzabonana ejo.', 'See you tomorrow.']],
  cyane: ['very, a lot', ['Araseka cyane.', 'He or she laughs a lot.']],
  neza: ['well', ['Ndi neza.', 'I am well.']],
  kandi: ['and, also', ['Ndiga kandi ndakora.', 'I study and I work.']],
  ariko: ['but', ['Ndashaka kugenda, ariko ndarushye.', "I want to go, but I'm tired."]],
  cyangwa: ['or', ['Icyayi cyangwa amata?', 'Tea or milk?']],
  hano: ['here', ['Ngwino hano.', 'Come here.']],
  hariya: ['there, over there', ['Isoko riri hariya.', 'The market is over there.']],
  njye: ['I, me', ['Njye ndi umunyeshuri.', 'I am a student.']],
  wowe: ['you', ['Wowe witwa nde?', "And you, what's your name?"]],
  we: ['he, she; him, her', ['We ni umwarimu.', 'He or she is a teacher.']],
  twe: ['we, us', ['Twe turi abanyeshuri.', 'We are students.']],
  mwe: ['you all', ['Mwe muri he?', 'Where are you all?']],
  bo: ['they, them', ['Bo ni inshuti zanjye.', 'They are my friends.']],
  rimwe: ['one; once', ['Rimwe, kabiri, gatatu.', 'One, two, three.']],
  kabiri: ['two; twice', ['Rimwe, kabiri, gatatu.', 'One, two, three.']],
  gatatu: ['three', ['Rimwe, kabiri, gatatu.', 'One, two, three.']],
  kane: ['four', ['Kane, gatanu, gatandatu.', 'Four, five, six.']],
  gatanu: ['five', ['Kane, gatanu, gatandatu.', 'Four, five, six.']],
  gatandatu: ['six', ['Kane, gatanu, gatandatu.', 'Four, five, six.']],
  karindwi: ['seven', ['Karindwi, umunani, icyenda, icumi.', 'Seven, eight, nine, ten.']],
  umunani: ['eight', ['Karindwi, umunani, icyenda, icumi.', 'Seven, eight, nine, ten.']],
  icyenda: ['nine', ['Karindwi, umunani, icyenda, icumi.', 'Seven, eight, nine, ten.']],
  icumi: ['ten', ['Karindwi, umunani, icyenda, icumi.', 'Seven, eight, nine, ten.']],
};

// [base, noun class, singular meaning, plural or null, plural meaning, example]
const NOUNS: Record<string, [string, string, string | null, string | null, Ex]> = {
  umuntu: [
    '1/2',
    'person',
    'abantu',
    'people',
    ['Ni umuntu mwiza.', 'He or she is a good person.'],
  ],
  umwana: ['1/2', 'child', 'abana', 'children', ['Umwana arakina.', 'The child is playing.']],
  umugabo: [
    '1/2',
    'man, husband',
    'abagabo',
    'men, husbands',
    ['Umugabo arakora.', 'The man is working.'],
  ],
  umugore: [
    '1/2',
    'woman, wife',
    'abagore',
    'women, wives',
    ['Umugore arateka.', 'The woman is cooking.'],
  ],
  umukobwa: ['1/2', 'girl', 'abakobwa', 'girls', ['Umukobwa arasoma.', 'The girl is reading.']],
  umuhungu: ['1/2', 'boy', 'abahungu', 'boys', ['Umuhungu arakina.', 'The boy is playing.']],
  umwarimu: [
    '1/2',
    'teacher',
    'abarimu',
    'teachers',
    ['Umwarimu wacu ni mwiza.', 'Our teacher is good.'],
  ],
  umunyeshuri: [
    '1/2',
    'student',
    'abanyeshuri',
    'students',
    ['Ndi umunyeshuri.', 'I am a student.'],
  ],
  inshuti: [
    '9/10',
    'friend, friends',
    null,
    null,
    ['Ni inshuti yanjye.', 'He or she is my friend.'],
  ],
  mama: ['1a', 'mother, mum', null, null, ['Mama arateka.', 'Mum is cooking.']],
  papa: ['1a', 'father, dad', null, null, ['Papa ari ku kazi.', 'Dad is at work.']],
  umuryango: [
    '3/4',
    'family; door',
    'imiryango',
    'families; doors',
    ['Umuryango wanjye ni munini.', 'My family is big.'],
  ],
  urugo: [
    '11/10',
    'home, household',
    'ingo',
    'homes, households',
    ['Ndi mu rugo.', 'I am at home.'],
  ],
  inzu: ['9/6', 'house', 'amazu', 'houses', ['Inzu yanjye ni nini.', 'My house is big.']],
  amazi: ['6', 'water', null, null, ['Ndashaka amazi.', 'I want water.']],
  ibiryo: ['8', 'food', null, null, ['Ibiryo ni byiza.', 'The food is good.']],
  akazi: ['12', 'work, job', null, null, ['Ndi ku kazi.', "I'm at work."]],
  amafaranga: ['6', 'money', null, null, ['Nta mafaranga mfite.', 'I have no money.']],
  izina: ['5/6', 'name', 'amazina', 'names', ['Izina ryawe ni irihe?', 'What is your name?']],
  umunsi: ['3/4', 'day', 'iminsi', 'days', ['Umunsi mwiza!', 'Have a good day!']],
  icyumweru: ['7/8', 'week; Sunday', 'ibyumweru', 'weeks', ['Icyumweru gitaha.', 'Next week.']],
  ukwezi: ['15/6', 'month; moon', 'amezi', 'months', ['Ukwezi gutaha.', 'Next month.']],
  umwaka: ['3/4', 'year', 'imyaka', 'years', ['Umwaka mushya muhire!', 'Happy New Year!']],
  igitondo: [
    '7',
    'morning',
    null,
    null,
    ['Mu gitondo nywa icyayi.', 'In the morning I drink tea.'],
  ],
  Ikinyarwanda: [
    '7',
    'Kinyarwanda (the language)',
    null,
    null,
    ['Ikinyarwanda ni cyiza.', 'Kinyarwanda is beautiful.'],
  ],
  ijambo: [
    '5/6',
    'word',
    'amagambo',
    'words',
    ['Iri jambo risobanura iki?', 'What does this word mean?'],
  ],
  igitabo: ['7/8', 'book', 'ibitabo', 'books', ['Iki ni igitabo cyanjye.', 'This is my book.']],
  ishuri: [
    '5/6',
    'school',
    'amashuri',
    'schools',
    ['Abana bari ku ishuri.', 'The children are at school.'],
  ],
  isoko: ['5/6', 'market', 'amasoko', 'markets', ['Ngiye ku isoko.', "I'm going to the market."]],
  umugati: [
    '3/4',
    'bread, a loaf',
    'imigati',
    'loaves of bread',
    ['Umugati ni angahe?', 'How much is the bread?'],
  ],
  inyama: ['9/10', 'meat', null, null, ['Sinkunda inyama.', "I don't like meat."]],
  icyayi: ['7', 'tea', null, null, ['Icyayi kirashyushye.', 'The tea is hot.']],
  amata: ['6', 'milk', null, null, ['Ndashaka amata.', 'I want milk.']],
  umujyi: [
    '3/4',
    'city, town',
    'imijyi',
    'cities, towns',
    ['Kigali ni umujyi mwiza.', 'Kigali is a beautiful city.'],
  ],
  igihugu: [
    '7/8',
    'country',
    'ibihugu',
    'countries',
    ['U Rwanda ni igihugu cyiza.', 'Rwanda is a beautiful country.'],
  ],
  umuhanda: [
    '3/4',
    'road',
    'imihanda',
    'roads',
    ['Uyu muhanda ujya he?', 'Where does this road go?'],
  ],
  imodoka: ['9/10', 'car, cars', null, null, ['Imodoka yanjye iri hano.', 'My car is here.']],
  inka: ['9/10', 'cow, cows', null, null, ['Inka zirarya ubwatsi.', 'The cows are eating grass.']],
  urusengero: [
    '11/10',
    'church (the building)',
    'insengero',
    'churches',
    ['Tujya mu rusengero ku cyumweru.', 'We go to church on Sunday.'],
  ],
  Imana: ['9', 'God', null, null, ['Imana ishimwe!', 'Praise God!']],
};

// [base, meaning, English verb (I/you/we/they), English verb (he or she), forms, example]
// Forms are present tense, level 1, in the order I, you, he or she, we, you all, they.
const VERBS: Record<string, [string, string, string, string[], Ex]> = {
  kugenda: [
    'to go',
    'go',
    'goes',
    ['ndagenda', 'uragenda', 'aragenda', 'turagenda', 'muragenda', 'baragenda'],
    ['Ndagenda ubu.', "I'm going now."],
  ],
  kuza: [
    'to come',
    'come',
    'comes',
    ['ndaza', 'uraza', 'araza', 'turaza', 'muraza', 'baraza'],
    ['Araza ubu.', 'He or she is coming now.'],
  ],
  gushaka: [
    'to want, to look for',
    'want',
    'wants',
    ['ndashaka', 'urashaka', 'arashaka', 'turashaka', 'murashaka', 'barashaka'],
    ['Ndashaka icyayi.', 'I want tea.'],
  ],
  kurya: [
    'to eat',
    'eat',
    'eats',
    ['ndarya', 'urarya', 'ararya', 'turarya', 'murarya', 'bararya'],
    ['Abana bararya.', 'The children are eating.'],
  ],
  kunywa: [
    'to drink',
    'drink',
    'drinks',
    ['ndanywa', 'uranywa', 'aranywa', 'turanywa', 'muranywa', 'baranywa'],
    ['Unywa icyayi?', 'Do you drink tea?'],
  ],
  kuvuga: [
    'to speak, to say',
    'speak',
    'speaks',
    ['ndavuga', 'uravuga', 'aravuga', 'turavuga', 'muravuga', 'baravuga'],
    ['Uvuga Ikinyarwanda?', 'Do you speak Kinyarwanda?'],
  ],
  kumva: [
    'to hear, to understand',
    'understand',
    'understands',
    ['ndumva', 'urumva', 'arumva', 'turumva', 'murumva', 'barumva'],
    ['Urumva?', 'Do you understand?'],
  ],
  kubona: [
    'to see, to find',
    'see',
    'sees',
    ['ndabona', 'urabona', 'arabona', 'turabona', 'murabona', 'barabona'],
    ['Urabona?', 'Do you see?'],
  ],
  gukora: [
    'to work, to do',
    'work',
    'works',
    ['ndakora', 'urakora', 'arakora', 'turakora', 'murakora', 'barakora'],
    ['Ukora iki?', 'What do you do?'],
  ],
  gukunda: [
    'to love, to like',
    'love',
    'loves',
    ['ndakunda', 'urakunda', 'arakunda', 'turakunda', 'murakunda', 'barakunda'],
    ['Ndagukunda.', 'I love you.'],
  ],
  kwiga: [
    'to learn, to study',
    'learn',
    'learns',
    ['ndiga', 'uriga', 'ariga', 'turiga', 'muriga', 'bariga'],
    ['Ndiga Ikinyarwanda.', 'I am learning Kinyarwanda.'],
  ],
  gusoma: [
    'to read',
    'read',
    'reads',
    ['ndasoma', 'urasoma', 'arasoma', 'turasoma', 'murasoma', 'barasoma'],
    ['Ukunda gusoma?', 'Do you like to read?'],
  ],
  kwandika: [
    'to write',
    'write',
    'writes',
    ['ndandika', 'urandika', 'arandika', 'turandika', 'murandika', 'barandika'],
    ['Andika izina ryawe.', 'Write your name.'],
  ],
  kugura: [
    'to buy',
    'buy',
    'buys',
    ['ndagura', 'uragura', 'aragura', 'turagura', 'muragura', 'baragura'],
    ['Ndashaka kugura umugati.', 'I want to buy bread.'],
  ],
  guteka: [
    'to cook',
    'cook',
    'cooks',
    ['ndateka', 'urateka', 'arateka', 'turateka', 'murateka', 'barateka'],
    ['Uzi guteka?', 'Do you know how to cook?'],
  ],
  gutaha: [
    'to go home',
    'go home',
    'goes home',
    ['ndataha', 'urataha', 'arataha', 'turataha', 'murataha', 'barataha'],
    ['Ngiye gutaha.', "I'm going home."],
  ],
  kuryama: [
    'to sleep, to lie down',
    'sleep',
    'sleeps',
    ['ndaryama', 'uraryama', 'araryama', 'turaryama', 'muraryama', 'bararyama'],
    ['Ngiye kuryama.', "I'm going to bed."],
  ],
  kwicara: [
    'to sit down',
    'sit down',
    'sits down',
    ['ndicara', 'uricara', 'aricara', 'turicara', 'muricara', 'baricara'],
    ['Icara hano.', 'Sit here.'],
  ],
  gufasha: [
    'to help',
    'help',
    'helps',
    ['ndafasha', 'urafasha', 'arafasha', 'turafasha', 'murafasha', 'barafasha'],
    ['Wamfasha?', 'Could you help me?'],
  ],
  gukina: [
    'to play',
    'play',
    'plays',
    ['ndakina', 'urakina', 'arakina', 'turakina', 'murakina', 'barakina'],
    ['Abana barakina.', 'The children are playing.'],
  ],
  kuririmba: [
    'to sing',
    'sing',
    'sings',
    ['ndaririmba', 'uraririmba', 'araririmba', 'turaririmba', 'muraririmba', 'bararirimba'],
    ['Ndakunda kuririmba.', 'I love to sing.'],
  ],
  guseka: [
    'to laugh',
    'laugh',
    'laughs',
    ['ndaseka', 'uraseka', 'araseka', 'turaseka', 'muraseka', 'baraseka'],
    ['Abana baraseka.', 'The children are laughing.'],
  ],
  kwiruka: [
    'to run',
    'run',
    'runs',
    ['ndiruka', 'uriruka', 'ariruka', 'turiruka', 'muriruka', 'bariruka'],
    ['Ariruka vuba.', 'He or she runs fast.'],
  ],
};

/** Most useful first: greetings and courtesy, people, food and drink, then the rest. */
const WORD_ORDER = `
muraho murakoze yego oya ni na umuntu umwana amazi kugenda kuza njye wowe iki nde he gushaka
ibiryo kurya kunywa inzu neza cyane ubu ejo umugabo umugore rimwe kabiri gatatu kuvuga kumva
kubona we twe mwe bo akazi gukora amafaranga kandi ariko cyangwa hano hariya kane gatanu umunsi
izina inshuti gukunda mama papa umuryango urugo umukobwa umuhungu ryari kuki angahe gatandatu
karindwi umunani icyenda icumi kwiga Ikinyarwanda ijambo gusoma kwandika igitabo ishuri umwarimu
umunyeshuri isoko kugura umugati inyama icyayi amata guteka umujyi igihugu umuhanda imodoka
gutaha kuryama kwicara gufasha icyumweru ukwezi umwaka igitondo inka urusengero Imana gukina
kuririmba guseka kwiruka
`
  .trim()
  .split(/\s+/);

// [phrase, meaning, word-by-word breakdown or null]
type Breakdown = [rw: string, en: string][] | null;
const PHRASES: [string, string, Breakdown][] = [
  // Greetings
  ['Mwaramutse', 'Good morning', null],
  ['Mwiriwe', 'Good afternoon, good evening', null],
  [
    'Amakuru yawe?',
    'How are you?',
    [
      ['amakuru', 'news'],
      ['yawe', 'your'],
    ],
  ],
  [
    'Ni meza',
    "I'm fine",
    [
      ['ni', 'it is'],
      ['meza', 'good'],
    ],
  ],
  ['Bite?', "How's it going? (casual)", null],
  [
    'Ni byiza',
    "It's good",
    [
      ['ni', 'it is'],
      ['byiza', 'good'],
    ],
  ],
  [
    'Murakaza neza',
    'Welcome',
    [
      ['murakaza', 'you come'],
      ['neza', 'well'],
    ],
  ],
  [
    'Umunsi mwiza',
    'Have a good day',
    [
      ['umunsi', 'day'],
      ['mwiza', 'good'],
    ],
  ],
  [
    'Ijoro ryiza',
    'Good night',
    [
      ['ijoro', 'night'],
      ['ryiza', 'good'],
    ],
  ],
  ['Tuzabonana', 'See you later', null],
  ['Murabeho', 'Goodbye', null],
  // Courtesy
  [
    'Murakoze cyane',
    'Thank you very much',
    [
      ['murakoze', 'thank you'],
      ['cyane', 'very much'],
    ],
  ],
  [
    'Nta kibazo',
    'No problem',
    [
      ['nta', 'no'],
      ['ikibazo', 'problem'],
    ],
  ],
  ['Mbabarira', 'Sorry, excuse me', null],
  ['Ndakwinginze', 'Please', null],
  [
    'Ni byo',
    "That's right",
    [
      ['ni', 'it is'],
      ['byo', 'so'],
    ],
  ],
  ['Sinumva', "I don't understand", null],
  [
    'Vuga buhoro',
    'Speak slowly',
    [
      ['vuga', 'speak'],
      ['buhoro', 'slowly'],
    ],
  ],
  [
    'Ongera uvuge',
    'Say it again',
    [
      ['ongera', 'again'],
      ['uvuge', 'say'],
    ],
  ],
  [
    'Witwa nde?',
    'What is your name?',
    [
      ['witwa', 'you are called'],
      ['nde', 'who'],
    ],
  ],
  ['Nitwa ...', 'My name is ...', [['nitwa', 'I am called']]],
  [
    'Nishimiye kukumenya',
    'Nice to meet you',
    [
      ['nishimiye', "I'm glad"],
      ['kukumenya', 'to know you'],
    ],
  ],
  [
    'Uturuka he?',
    'Where are you from?',
    [
      ['uturuka', 'you come from'],
      ['he', 'where'],
    ],
  ],
  [
    'Uvuga Icyongereza?',
    'Do you speak English?',
    [
      ['uvuga', 'you speak'],
      ['Icyongereza', 'English'],
    ],
  ],
  [
    'Ndiga Ikinyarwanda',
    "I'm learning Kinyarwanda",
    [
      ['ndiga', "I'm learning"],
      ['Ikinyarwanda', 'Kinyarwanda'],
    ],
  ],
  // Questions and directions
  [
    'Ubwiherero buri he?',
    'Where is the toilet?',
    [
      ['ubwiherero', 'toilet'],
      ['buri', 'is'],
      ['he', 'where'],
    ],
  ],
  [
    'Ndashaka kujya ...',
    'I want to go to ...',
    [
      ['ndashaka', 'I want'],
      ['kujya', 'to go'],
    ],
  ],
  [
    'Ni kure?',
    'Is it far?',
    [
      ['ni', 'it is'],
      ['kure', 'far'],
    ],
  ],
  [
    'Ni hafi',
    "It's near",
    [
      ['ni', 'it is'],
      ['hafi', 'near'],
    ],
  ],
  [
    'Jya imbere',
    'Go straight ahead',
    [
      ['jya', 'go'],
      ['imbere', 'forward'],
    ],
  ],
  [
    'Kata iburyo',
    'Turn right',
    [
      ['kata', 'turn'],
      ['iburyo', 'right'],
    ],
  ],
  [
    'Kata ibumoso',
    'Turn left',
    [
      ['kata', 'turn'],
      ['ibumoso', 'left'],
    ],
  ],
  [
    'Hagarara hano',
    'Stop here',
    [
      ['hagarara', 'stop'],
      ['hano', 'here'],
    ],
  ],
  [
    'Iki ni iki?',
    'What is this?',
    [
      ['iki', 'this'],
      ['ni', 'is'],
      ['iki', 'what'],
    ],
  ],
  // Shopping
  [
    'Ni angahe?',
    'How much is it?',
    [
      ['ni', 'it is'],
      ['angahe', 'how much'],
    ],
  ],
  [
    'Ndashaka amazi',
    'I want water',
    [
      ['ndashaka', 'I want'],
      ['amazi', 'water'],
    ],
  ],
  ['Birahenze', "It's expensive", null],
  [
    'Gabanyaho gato',
    'Bring the price down a little',
    [
      ['gabanyaho', 'reduce'],
      ['gato', 'a little'],
    ],
  ],
  [
    'Mpa umugati',
    'Give me bread',
    [
      ['mpa', 'give me'],
      ['umugati', 'bread'],
    ],
  ],
  ['Mufite ...?', 'Do you have ...?', [['mufite', 'you have']]],
  [
    'Nta mafaranga mfite',
    'I have no money',
    [
      ['nta', 'no'],
      ['amafaranga', 'money'],
      ['mfite', 'I have'],
    ],
  ],
  [
    'Ndashaka kwishyura',
    'I want to pay',
    [
      ['ndashaka', 'I want'],
      ['kwishyura', 'to pay'],
    ],
  ],
  // Family
  [
    'Ufite abana?',
    'Do you have children?',
    [
      ['ufite', 'you have'],
      ['abana', 'children'],
    ],
  ],
  [
    'Mfite abana babiri',
    'I have two children',
    [
      ['mfite', 'I have'],
      ['abana', 'children'],
      ['babiri', 'two'],
    ],
  ],
  [
    'Uyu ni umugabo wanjye',
    'This is my husband',
    [
      ['uyu', 'this'],
      ['ni', 'is'],
      ['umugabo', 'husband'],
      ['wanjye', 'my'],
    ],
  ],
  [
    'Uyu ni umugore wanjye',
    'This is my wife',
    [
      ['uyu', 'this'],
      ['ni', 'is'],
      ['umugore', 'wife'],
      ['wanjye', 'my'],
    ],
  ],
  [
    'Uyu ni inshuti yanjye',
    'This is my friend',
    [
      ['uyu', 'this'],
      ['ni', 'is'],
      ['inshuti', 'friend'],
      ['yanjye', 'my'],
    ],
  ],
  [
    'Umuryango wawe umeze ute?',
    'How is your family?',
    [
      ['umuryango', 'family'],
      ['wawe', 'your'],
      ['umeze ute', 'is how'],
    ],
  ],
  [
    'Bose ni bazima',
    "They're all well",
    [
      ['bose', 'all of them'],
      ['ni', 'are'],
      ['bazima', 'healthy'],
    ],
  ],
  ['Ndagukunda', 'I love you', null],
];

// ---------------------------------------------------------------------------------------------

interface Snapshot {
  items: { id: string; kind: string; base: string }[];
  item_forms: { id: string; item_id: string; text: string }[];
}

const readSnapshot = (url: URL): Snapshot =>
  existsSync(url)
    ? (JSON.parse(readFileSync(url, 'utf8')) as Snapshot)
    : { items: [], item_forms: [] };

const known = [readSnapshot(OUT)];
const itemId = (kind: string, base: string) =>
  known.flatMap((s) => s.items).find((i) => i.kind === kind && i.base === base)?.id ?? randomUUID();
const formId = (item: string, text: string) =>
  known.flatMap((s) => s.item_forms).find((f) => f.item_id === item && f.text === text)?.id ??
  randomUUID();

// Verb Builder levels 2 and 3 for course verbs that are also starter verbs, copied from the verb
// table (scripts/draft-verbs.ts) so Learn and Review can show them once a learner unlocks them.
// "It" forms stay in the Verb Builder. Object forms are skipped when the course meaning differs:
// the course teaches gusoma as "to read", and its object forms mean "to kiss".
interface VerbTable {
  verbs: { id: string; infinitive: string }[];
  verb_forms: {
    verb_id: string;
    who: string;
    when: string;
    whom: string | null;
    word: string;
    en: string;
    level: number;
  }[];
}
const verbTable = JSON.parse(readFileSync(VERB_TABLE, 'utf8')) as VerbTable;
const OBJECTS_DIFFER = new Set(['gusoma']);
function laterVerbForms(infinitive: string) {
  const verb = verbTable.verbs.find((v) => v.infinitive === infinitive);
  if (!verb) return [];
  return verbTable.verb_forms.filter(
    (f) =>
      f.verb_id === verb.id &&
      f.level > 1 &&
      !f.who.startsWith('it') &&
      !(f.whom && OBJECTS_DIFFER.has(infinitive)),
  );
}

const PERSONS = ['1sg', '2sg', '3sg', '1pl', '2pl', '3pl'] as const;
const SUBJECTS = ['I', 'you', 'he or she', 'we', 'you all', 'they'];

const items: object[] = [];
const forms: object[] = [];
const row = { status: 'ai_draft', source: SOURCE, updated_at: STAMP, retired: false };

function addForm(item: string, f: Record<string, unknown>) {
  forms.push({
    id: formId(item, f.text as string),
    item_id: item,
    number: null,
    person: null,
    tense: null,
    verb_level: null,
    is_base: false,
    audio_path: null,
    audio_source: null,
    ...f,
    ...row,
  });
}

const seen = new Set<string>();
WORD_ORDER.forEach((base, i) => {
  if (seen.has(base)) throw new Error(`Listed twice: ${base}`);
  seen.add(base);
  const id = itemId('word', base);
  const common = {
    id,
    kind: 'word',
    base,
    pronunciation: syllables(base),
    breakdown: null,
    rank: i + 1,
    tier: 1,
    ...row,
  };

  if (OTHER[base]) {
    const [en, [exRw, exEn]] = OTHER[base];
    items.push({
      ...common,
      en,
      word_type: 'other',
      noun_class: null,
      example: { rw: exRw, en: exEn },
    });
    addForm(id, { text: base, en, is_base: true });
  } else if (NOUNS[base]) {
    const [cls, en, plural, pluralEn, [exRw, exEn]] = NOUNS[base];
    items.push({
      ...common,
      en,
      word_type: 'noun',
      noun_class: cls,
      example: { rw: exRw, en: exEn },
    });
    addForm(id, { text: base, en, is_base: true, number: plural ? 'singular' : null });
    if (plural) addForm(id, { text: plural, en: pluralEn, number: 'plural' });
  } else if (VERBS[base]) {
    const [en, plain, third, conj, [exRw, exEn]] = VERBS[base];
    items.push({
      ...common,
      en,
      word_type: 'verb',
      noun_class: null,
      example: { rw: exRw, en: exEn },
    });
    conj.forEach((text, p) => {
      addForm(id, {
        text,
        en: `${SUBJECTS[p]} ${p === 2 ? third : plain}`,
        is_base: p === 2,
        person: PERSONS[p],
        tense: 'present',
        verb_level: 1,
      });
    });
    for (const f of laterVerbForms(base)) {
      addForm(id, {
        text: f.word,
        en: f.en,
        person: f.who,
        tense: f.when === 'now' ? 'present' : f.when,
        verb_level: f.level,
      });
    }
  } else {
    throw new Error(`No draft for ${base}`);
  }
});

const unused = [...Object.keys(OTHER), ...Object.keys(NOUNS), ...Object.keys(VERBS)].filter(
  (b) => !seen.has(b),
);
if (unused.length) throw new Error(`Drafted but not ranked: ${unused.join(', ')}`);

PHRASES.forEach(([text, en, breakdown], i) => {
  const id = itemId('phrase', text);
  items.push({
    id,
    kind: 'phrase',
    base: text,
    en,
    word_type: 'other',
    noun_class: null,
    pronunciation: syllables(text),
    example: null,
    breakdown: breakdown?.map(([rw, e]) => ({ rw, en: e })) ?? null,
    rank: i + 1,
    tier: Math.floor(i / 25) + 1,
    ...row,
  });
  addForm(id, { text, en, is_base: true });
});

writeFileSync(
  OUT,
  JSON.stringify(
    {
      _note:
        'AI DRAFT. Written by Claude, not yet checked by a native speaker. Built by scripts/draft-content.ts.',
      items,
      item_forms: forms,
    },
    null,
    2,
  ) + '\n',
);
console.log(`${items.length} items, ${forms.length} forms`);
