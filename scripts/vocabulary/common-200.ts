// Common 200: ranks 101 to 200, in clusters. Chosen from the most frequent stems in Common
// Voice (docs/data/word-frequency.tsv) that the first 100 don't cover, weighed for everyday
// use, and ordered as GPA suggests: picturable clusters first, each with a verb or two and a
// function word so example sentences can be made from it.
//
// AI DRAFT. Written by Claude, not yet checked by a native speaker.

import { n, o, v, type Cluster } from './words.ts';

export const COMMON_200: Cluster[] = [
  {
    topic: 'body',
    picturable: true,
    words: [
      n('umutwe', '3/4', 'head', 'imitwe', 'heads', ['Ndwaye umutwe.', 'I have a headache.']),
      n('ukuboko', '15/6', 'arm, hand', 'amaboko', 'arms, hands', [
        'Zamura ukuboko.',
        'Raise your hand.',
      ]),
      n('ukuguru', '15/6', 'leg, foot', 'amaguru', 'legs, feet', [
        'Ukuguru kurambabaza.',
        'My leg hurts.',
      ]),
      n('ijisho', '5/6', 'eye', 'amaso', 'eyes', [
        'Afite amaso meza.',
        'He or she has beautiful eyes.',
      ]),
      n('akanwa', '12/13', 'mouth', 'utunwa', 'mouths', ['Funga akanwa.', 'Close your mouth.']),
      n('ugutwi', '15/6', 'ear', 'amatwi', 'ears', ['Ugutwi kwanjye kurababara.', 'My ear hurts.']),
      n('iryinyo', '5/6', 'tooth', 'amenyo', 'teeth', ['Ndwaye iryinyo.', 'I have a toothache.']),
      n('umusatsi', '3/4', 'hair', 'imisatsi', 'hair (many strands)', [
        'Afite umusatsi muremure.',
        'He or she has long hair.',
      ]),
      n('umutima', '3/4', 'heart', 'imitima', 'hearts', [
        'Umutima we ni mwiza.',
        'He or she has a good heart.',
      ]),
      v('kureba', 'reb', 'to look, to see', 'look', 'looks', ['Reba hano!', 'Look here!']),
      v('kubabara', 'babar', 'to hurt, to be sad', 'hurt', 'hurts', [
        'Ndababara cyane.',
        "I'm in a lot of pain.",
      ]),
    ],
  },
  {
    topic: 'family',
    picturable: true,
    words: [
      n('umubyeyi', '1/2', 'parent', 'ababyeyi', 'parents', [
        'Ababyeyi banjye bari mu rugo.',
        'My parents are at home.',
      ]),
      n(
        'umuvandimwe',
        '1/2',
        'brother or sister, relative',
        'abavandimwe',
        'brothers and sisters, relatives',
        ['Mfite abavandimwe batatu.', 'I have three brothers and sisters.'],
      ),
      n('mushiki', '1a/2', "sister (a man's)", 'bashiki', "sisters (a man's)", [
        'Mushiki wanjye arakora.',
        'My sister is working.',
      ]),
      n('musaza', '1a/2', "brother (a woman's)", 'basaza', "brothers (a woman's)", [
        'Musaza wanjye ni umunyeshuri.',
        'My brother is a student.',
      ]),
      n('sogokuru', '1a', 'grandfather', null, null, [
        'Sogokuru aba mu cyaro.',
        'Grandfather lives in the countryside.',
      ]),
      n('nyogokuru', '1a', 'grandmother', null, null, [
        'Nyogokuru arateka.',
        'Grandmother is cooking.',
      ]),
      n('umusore', '1/2', 'young man', 'abasore', 'young men', [
        'Uwo musore ni inshuti yanjye.',
        'That young man is my friend.',
      ]),
      n('umukecuru', '1/2', 'old woman', 'abakecuru', 'old women', [
        'Umukecuru aricaye.',
        'The old woman is sitting down.',
      ]),
      n('umusaza', '1/2', 'old man', 'abasaza', 'old men', [
        'Umusaza aragenda buhoro.',
        'The old man walks slowly.',
      ]),
      n('ubukwe', '14', 'wedding', null, null, ['Tugiye mu bukwe.', "We're going to a wedding."]),
      v('kubyara', 'byar', 'to give birth, to have a child', 'give birth', 'gives birth', [
        'Yabyaye umuhungu.',
        'She had a boy.',
      ]),
      o(
        'wanjye',
        'my (with a person)',
        ['Uyu ni umugore wanjye.', 'This is my wife.'],
        ['function'],
      ),
    ],
  },
  {
    topic: 'house',
    picturable: true,
    words: [
      n('icyumba', '7/8', 'room', 'ibyumba', 'rooms', [
        'Icyumba cyanjye ni gito.',
        'My room is small.',
      ]),
      n('urugi', '11/10', 'door', 'inzugi', 'doors', ['Urugi rurafunze.', 'The door is closed.']),
      n('idirishya', '5/6', 'window', 'amadirishya', 'windows', [
        'Idirishya rirakinguye.',
        'The window is open.',
      ]),
      n('intebe', '9/10', 'chair', 'intebe', 'chairs', ['Icara ku ntebe.', 'Sit on the chair.']),
      n('ameza', '6', 'table', null, null, ['Ibiryo biri ku meza.', 'The food is on the table.']),
      n('igitanda', '7/8', 'bed', 'ibitanda', 'beds', [
        'Igitanda cyanjye ni kinini.',
        'My bed is big.',
      ]),
      n('itara', '5/6', 'lamp, light', 'amatara', 'lamps, lights', [
        'Cana itara.',
        'Turn on the light.',
      ]),
      n('umuriro', '3/4', 'fire, electricity', 'imiriro', 'fires', [
        'Nta muriro uhari.',
        "There's no electricity.",
      ]),
      v('gukingura', 'kingur', 'to open', 'open', 'opens', ['Kingura urugi.', 'Open the door.']),
      v('gufunga', 'fung', 'to close, to shut', 'close', 'closes', [
        'Funga idirishya.',
        'Close the window.',
      ]),
      o('mu', 'in, inside', ['Ari mu nzu.', 'He or she is in the house.'], ['function']),
    ],
  },
  {
    topic: 'food',
    picturable: true,
    words: [
      n('ikirayi', '7/8', 'potato', 'ibirayi', 'potatoes', [
        'Ndashaka ibirayi.',
        'I want potatoes.',
      ]),
      n('umuceri', '3', 'rice', null, null, [
        "Turarya umuceri n'ibishyimbo.",
        'We eat rice and beans.',
      ]),
      n('igishyimbo', '7/8', 'bean', 'ibishyimbo', 'beans', [
        'Ibishyimbo birahiye.',
        'The beans are cooked.',
      ]),
      n('imboga', '10', 'vegetables', null, null, [
        'Imboga ni nziza ku buzima.',
        'Vegetables are good for your health.',
      ]),
      n('urubuto', '11/10', 'fruit, seed', 'imbuto', 'fruits, seeds', [
        'Imbuto zirahenze.',
        'Fruit is expensive.',
      ]),
      n('umunyu', '3', 'salt', null, null, ['Shyiramo umunyu muke.', 'Put in a little salt.']),
      n('isukari', '9', 'sugar', null, null, [
        'Icyayi kirimo isukari.',
        'The tea has sugar in it.',
      ]),
      n('igi', '5/6', 'egg', 'amagi', 'eggs', ['Ndashaka amagi abiri.', 'I want two eggs.']),
      n('igitoki', '7/8', 'banana, plantain', 'ibitoki', 'bananas, plantains', [
        'Turateka ibitoki.',
        "We're cooking plantains.",
      ]),
      n('amavuta', '6', 'oil, butter', null, null, ['Amavuta yashize.', 'The oil has run out.']),
      v(
        'kugurisha',
        'gurish',
        'to sell',
        'sell',
        'sells',
        ['Agurisha imboga ku isoko.', 'He or she sells vegetables at the market.'],
        ['shopping'],
      ),
      n(
        'igiciro',
        '7/8',
        'price',
        'ibiciro',
        'prices',
        ['Igiciro ni angahe?', 'What is the price?'],
        ['shopping'],
      ),
    ],
  },
  {
    topic: 'places',
    picturable: true,
    words: [
      n('ahantu', '16', 'place', null, null, ['Ni ahantu heza.', "It's a nice place."]),
      n('ikibuga', '7/8', 'field, pitch', 'ibibuga', 'fields, pitches', [
        'Abana bakinira ku kibuga.',
        'The children play on the field.',
      ]),
      n(
        'ibitaro',
        '8',
        'hospital',
        null,
        null,
        ['Ari mu bitaro.', 'He or she is in hospital.'],
        ['health'],
      ),
      n(
        'iduka',
        '5/6',
        'shop',
        'amaduka',
        'shops',
        ['Iduka rirafunze.', 'The shop is closed.'],
        ['shopping'],
      ),
      n(
        'banki',
        '9',
        'bank',
        null,
        null,
        ['Ngiye kuri banki.', "I'm going to the bank."],
        ['shopping'],
      ),
      n('umusozi', '3/4', 'hill, mountain', 'imisozi', 'hills, mountains', [
        "U Rwanda ni igihugu cy'imisozi igihumbi.",
        'Rwanda is the land of a thousand hills.',
      ]),
      n('inzira', '9/10', 'path, way, road', 'inzira', 'paths, ways', [
        'Iyi nzira ijya he?',
        'Where does this road go?',
      ]),
      n('indege', '9/10', 'plane', 'indege', 'planes', [
        'Indege irahaguruka.',
        'The plane is taking off.',
      ]),
      v('kujya', 'jy', 'to go (to)', 'go', 'goes', [
        'Njya ku isoko buri munsi.',
        'I go to the market every day.',
      ]),
      o('ku', 'on, at, to', ['Igitabo kiri ku meza.', 'The book is on the table.'], ['function']),
      o('kure', 'far', ['Ishuri riri kure.', 'The school is far away.'], ['function']),
      o('hafi', 'near, nearly', ['Isoko riri hafi.', 'The market is near.'], ['function']),
    ],
  },
  {
    topic: 'time',
    picturable: false,
    words: [
      n('isaha', '9/6', 'hour, clock, watch', 'amasaha', 'hours, clocks, watches', [
        'Nakoze amasaha abiri.',
        'I worked for two hours.',
      ]),
      n('ijoro', '5/6', 'night', 'amajoro', 'nights', ['Ijoro ryiza!', 'Good night!']),
      o('nimugoroba', 'in the evening', ['Tuzahura nimugoroba.', "We'll meet this evening."]),
      o('none', 'today', ['None ni ku wa mbere.', 'Today is Monday.']),
      o('vuba', 'soon, quickly', ['Ngwino vuba!', 'Come quickly!']),
      n('imvura', '9', 'rain', null, null, ['Imvura iragwa.', "It's raining."], ['weather']),
      n(
        'izuba',
        '5',
        'sun',
        null,
        null,
        ['Uyu munsi hari izuba.', "It's sunny today."],
        ['weather'],
      ),
      n('ubukonje', '14', 'cold', null, null, ['Hari ubukonje.', "It's cold."], ['weather']),
      v('kugwa', 'gw', 'to fall', 'fall', 'falls', ['Umwana yaguye.', 'The child fell.']),
      o(
        'mbere',
        'before, first',
        ['Karaba intoki mbere yo kurya.', 'Wash your hands before eating.'],
        ['function'],
      ),
      o('nyuma', 'after, later', ['Tuzavugana nyuma.', "We'll talk later."], ['function']),
    ],
  },
  {
    topic: 'work',
    picturable: true,
    words: [
      n('umukozi', '1/2', 'worker, employee', 'abakozi', 'workers, employees', [
        'Ni umukozi mwiza.',
        'He or she is a good worker.',
      ]),
      n(
        'umuganga',
        '1/2',
        'doctor',
        'abaganga',
        'doctors',
        ['Umuganga arafasha abarwayi.', 'The doctor helps the sick.'],
        ['health'],
      ),
      n('umurimo', '3/4', 'work, job, task', 'imirimo', 'jobs, tasks', [
        'Afite imirimo myinshi.',
        'He or she has a lot of work.',
      ]),
      n(
        'isomo',
        '5/6',
        'lesson',
        'amasomo',
        'lessons',
        ['Isomo ritangira saa tatu.', 'The lesson starts at nine o’clock.'],
        ['school'],
      ),
      n(
        'ikaramu',
        '9/6',
        'pen, pencil',
        'amakaramu',
        'pens, pencils',
        ['Mfite ikaramu.', 'I have a pen.'],
        ['school'],
      ),
      n(
        'urupapuro',
        '11/10',
        'sheet of paper, page',
        'impapuro',
        'sheets of paper, pages',
        ['Andika ku rupapuro.', 'Write on the paper.'],
        ['school'],
      ),
      n(
        'ikibazo',
        '7/8',
        'question, problem',
        'ibibazo',
        'questions, problems',
        ['Nta kibazo.', 'No problem.'],
        ['school'],
      ),
      n(
        'igisubizo',
        '7/8',
        'answer',
        'ibisubizo',
        'answers',
        ['Igisubizo ni yego.', 'The answer is yes.'],
        ['school'],
      ),
      v(
        'kwishyura',
        'ishyur',
        'to pay',
        'pay',
        'pays',
        ['Ugomba kwishyura ubu.', 'You must pay now.'],
        ['shopping'],
      ),
      v('kubaza', 'baz', 'to ask', 'ask', 'asks', [
        'Ndashaka kukubaza ikibazo.',
        'I want to ask you a question.',
      ]),
      v('gusubiza', 'subiz', 'to answer, to give back', 'answer', 'answers', [
        'Subiza ikibazo.',
        'Answer the question.',
      ]),
      o('niba', 'if, whether', ['Niba ushaka, ngwino.', 'If you want, come.'], ['function']),
    ],
  },
  {
    topic: 'church',
    picturable: false,
    words: [
      n('ijuru', '5/6', 'heaven, sky', 'amajuru', 'heavens', [
        'Data wa twese uri mu ijuru.',
        'Our Father, who art in heaven.',
      ]),
      n('Yesu', '1a', 'Jesus', null, null, ['Yesu ni Umwami.', 'Jesus is Lord.']),
      n('Bibiliya', '9', 'Bible', null, null, [
        'Ndasoma Bibiliya buri gitondo.',
        'I read the Bible every morning.',
      ]),
      n('itorero', '5/6', 'church (the congregation)', 'amatorero', 'churches, denominations', [
        'Itorero ryacu ni rinini.',
        'Our church is big.',
      ]),
      n('indirimbo', '9/10', 'song, hymn', 'indirimbo', 'songs, hymns', [
        'Turaririmba indirimbo.',
        "We're singing a song.",
      ]),
      n('isengesho', '5/6', 'prayer', 'amasengesho', 'prayers', [
        'Isengesho rya mu gitondo.',
        'Morning prayer.',
      ]),
      n('umupasiteri', '1/2', 'pastor', 'abapasiteri', 'pastors', [
        'Umupasiteri arabwiriza.',
        'The pastor is preaching.',
      ]),
      v('gusenga', 'seng', 'to pray', 'pray', 'prays', ['Dusenge.', "Let's pray."]),
      v('kwizera', 'izer', 'to believe, to trust', 'believe', 'believes', [
        'Ndizera Imana.',
        'I believe in God.',
      ]),
      n('urukundo', '11', 'love', null, null, ['Imana ni urukundo.', 'God is love.'], ['feelings']),
    ],
  },
  {
    topic: 'feelings',
    picturable: false,
    words: [
      n('ibyishimo', '8', 'joy, happiness', null, null, ['Ndi mu byishimo.', "I'm full of joy."]),
      n('ubwoba', '14', 'fear', null, null, ['Mfite ubwoba.', "I'm afraid."]),
      v('kwishima', 'ishim', 'to be happy, to rejoice', 'rejoice', 'rejoices', [
        'Ndishimye cyane.',
        "I'm very happy.",
      ]),
      o(
        'kuko',
        'because',
        ['Sinaje kuko nari ndwaye.', "I didn't come because I was sick."],
        ['function'],
      ),
      o('buri', 'every, each', ['Buri munsi.', 'Every day.'], ['function']),
      o('gusa', 'only, just', ['Ndashaka amazi gusa.', 'I only want water.'], ['function']),
      o('ntabwo', 'not', ['Ntabwo mbizi.', "I don't know."], ['function']),
      o('hamwe', 'together', ['Tujye hamwe.', "Let's go together."], ['function']),
      o('nta', 'there is no, no', ['Nta mazi ahari.', "There's no water."], ['function']),
    ],
  },
];
