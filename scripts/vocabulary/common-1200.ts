// Common 1200, second part: ranks 1001 to 1200, in clusters, drafted like Common 1000 (see
// common-1000.ts). These go deeper into everyday concrete life (the kitchen and the house, food
// and cooking, the body, clothes, animals, farming, weather, family and people, colours, sizes
// and qualities, and common verbs), avoid every word in the first 1,000, and picturable
// clusters lead each hundred.
//
// AI DRAFT. Written by Claude, not yet checked by a native speaker.

import { n, o, v, type Cluster } from './words.ts';

const F = ['function'];

export const COMMON_1200: Cluster[] = [
  // Ranks 1001 to 1100.
  {
    topic: 'house',
    picturable: true,
    words: [
      n('ikanya', '9/6', 'fork', 'amakanya', 'forks', [
        'Ndya umuceri n’ikanya.',
        'I eat rice with a fork.',
      ]),
      n('ikirahure', '7/8', 'drinking glass; glass', 'ibirahure', 'glasses', [
        'Mpa ikirahure cy’amazi.',
        'Give me a glass of water.',
      ]),
      n('ijerekani', '9/6', 'jerrycan', 'amajerekani', 'jerrycans', [
        'Ijerekani yuzuye amazi.',
        'The jerrycan is full of water.',
      ]),
      n('urusyo', '11/10', 'grinding stone', 'insyo', 'grinding stones', [
        'Nyirakuru asya ku rusyo.',
        'Grandmother grinds on the grinding stone.',
      ]),
      n('isekuru', '9/10', 'mortar (for pounding)', 'isekuru', 'mortars', [
        'Shyira ibishyimbo mu isekuru.',
        'Put the beans in the mortar.',
      ]),
      n('umuhini', '3/4', 'pestle; handle (of a hoe)', 'imihini', 'pestles; handles', [
        'Fata umuhini usekure.',
        'Take the pestle and pound.',
      ]),
      n('umufuniko', '3/4', 'lid', 'imifuniko', 'lids', [
        'Shyira umufuniko ku nkono.',
        'Put the lid on the pot.',
      ]),
      n('ishyiga', '5/6', 'hearthstone, cooking stove', 'amashyiga', 'hearthstones, stoves', [
        'Inkono iri ku ishyiga.',
        'The pot is on the stove.',
      ]),
      n('firigo', '9/10', 'fridge', 'firigo', 'fridges', [
        'Amata ari muri firigo.',
        'The milk is in the fridge.',
      ]),
      n('ikibindi', '7/8', 'clay pot, water jar', 'ibibindi', 'clay pots', [
        'Amazi yo mu kibindi arakonje.',
        'The water in the clay pot is cool.',
      ]),
      o('hasi', 'down, on the ground, on the floor', ['Icara hasi.', 'Sit down on the floor.'], F),
      v('gusya', 'sy', 'to grind (flour)', 'grind', 'grinds', [
        'Turasya amasaka.',
        "We're grinding sorghum.",
      ]),
      v('guhata', 'hat', 'to peel', 'peel', 'peels', ['Hata ibirayi.', 'Peel the potatoes.']),
    ],
  },
  {
    topic: 'food',
    picturable: true,
    words: [
      n('irandazi', '5/6', 'doughnut (fried dough)', 'amandazi', 'doughnuts', [
        'Nanyoye icyayi n’irandazi.',
        'I had tea with a doughnut.',
      ]),
      n('igisheke', '7/8', 'sugar cane', 'ibisheke', 'sugar canes', [
        'Abana bakunda igisheke.',
        'Children love sugar cane.',
      ]),
      n('ipera', '5/6', 'guava', 'amapera', 'guavas', ['Amapera yeze.', 'The guavas are ripe.']),
      n('intoryi', '9/10', 'small aubergine, garden egg', 'intoryi', 'small aubergines', [
        'Duteka intoryi n’inyama.',
        'We cook garden eggs with meat.',
      ]),
      n('igihumyo', '7/8', 'mushroom', 'ibihumyo', 'mushrooms', [
        'Ibihumyo bimera mu ishyamba.',
        'Mushrooms grow in the forest.',
      ]),
      n('dodo', '9', 'amaranth (leafy vegetable)', null, null, [
        'Dodo ni imboga nziza.',
        'Amaranth is a good vegetable.',
      ]),
      n('igikoma', '7', 'porridge', null, null, [
        'Umwana anywa igikoma mu gitondo.',
        'The child drinks porridge in the morning.',
      ]),
      n('ikigage', '7', 'sorghum beer', null, null, [
        'Ikigage gikorwa mu masaka.',
        'Sorghum beer is made from sorghum.',
      ]),
      n('ikivuguto', '7', 'fermented milk, yoghurt', null, null, [
        'Nkunda kunywa ikivuguto.',
        'I like drinking fermented milk.',
      ]),
      n('pome', '9/10', 'apple', 'pome', 'apples', [
        'Naguze pome eshatu.',
        'I bought three apples.',
      ]),
      n('ifiriti', '5/6', 'chip, French fry', 'amafiriti', 'chips', [
        'Twariye amafiriti n’inkoko.',
        'We ate chips and chicken.',
      ]),
      n('foromaje', '9', 'cheese', null, null, [
        'Foromaje ikorwa mu mata.',
        'Cheese is made from milk.',
      ]),
      v('kubira', 'bir', 'to boil', 'boil', 'boils', ['Amazi arabira.', 'The water is boiling.']),
    ],
  },
  {
    topic: 'body',
    picturable: true,
    words: [
      n('ingohe', '9/10', 'eyebrow', 'ingohe', 'eyebrows', [
        'Ingohe ze ni nziza.',
        'His or her eyebrows are nice.',
      ]),
      n('ubwanwa', '14', 'beard', null, null, [
        'Sogokuru afite ubwanwa bwera.',
        'Grandfather has a white beard.',
      ]),
      n('urwara', '11/10', 'fingernail, toenail', 'inzara', 'nails', [
        'Ca inzara zawe.',
        'Cut your nails.',
      ]),
      n('inkokora', '9/10', 'elbow', 'inkokora', 'elbows', [
        'Nakomeretse ku nkokora.',
        'I hurt my elbow.',
      ]),
      n('ikibuno', '7/8', 'waist, hip', 'ibibuno', 'waists, hips', [
        'Ndababara mu kibuno.',
        'My lower back aches.',
      ]),
      n('igufwa', '5/6', 'bone', 'amagufwa', 'bones', [
        'Imbwa irya igufwa.',
        'The dog is eating a bone.',
      ]),
      n('igihaha', '7/8', 'lung', 'ibihaha', 'lungs', [
        'Itabi ryangiza ibihaha.',
        'Tobacco damages the lungs.',
      ]),
      n('impyiko', '9/10', 'kidney', 'impyiko', 'kidneys', [
        'Arwaye impyiko.',
        'He or she has kidney disease.',
      ]),
      n('umutsi', '3/4', 'vein; muscle, tendon', 'imitsi', 'veins; muscles', [
        'Umuganga yamuteye urushinge mu mutsi.',
        'The doctor gave him or her an injection in the vein.',
      ]),
      n('agatsinsino', '12/13', 'heel', 'udutsinsino', 'heels', [
        'Ndababara ku gatsinsino.',
        'My heel hurts.',
      ]),
      v('guhekenya', 'hekeny', 'to chew', 'chew', 'chews', [
        'Hekenya neza mbere yo kumira.',
        'Chew well before swallowing.',
      ]),
      v('kumira', 'mir', 'to swallow', 'swallow', 'swallows', [
        'Mira ikinini n’amazi.',
        'Swallow the tablet with water.',
      ]),
    ],
  },
  {
    topic: 'animals',
    picturable: true,
    words: [
      n('intwiga', '9/10', 'giraffe', 'intwiga', 'giraffes', [
        'Intwiga ifite ijosi rirerire.',
        'The giraffe has a long neck.',
      ]),
      n('impongo', '9/10', 'antelope', 'impongo', 'antelopes', [
        'Impongo ziriruka cyane.',
        'Antelopes run very fast.',
      ]),
      n('inkura', '9/10', 'rhinoceros', 'inkura', 'rhinos', [
        'Twabonye inkura mu Kagera.',
        'We saw a rhino in Akagera.',
      ]),
      n('ikimonyo', '7/8', 'ant', 'ibimonyo', 'ants', [
        'Ibimonyo biri ku isukari.',
        'There are ants on the sugar.',
      ]),
      n('imbata', '9/10', 'duck', 'imbata', 'ducks', [
        'Imbata ziroga mu kiyaga.',
        'The ducks are swimming in the lake.',
      ]),
      n('kagoma', '9/10', 'eagle', 'kagoma', 'eagles', [
        'Kagoma iguruka hejuru cyane.',
        'The eagle flies very high.',
      ]),
      n('igikona', '7/8', 'crow', 'ibikona', 'crows', [
        'Igikona kiri ku giti.',
        'The crow is in the tree.',
      ]),
      n('inyambo', '9/10', 'long-horned cow (Inyambo)', 'inyambo', 'long-horned cows', [
        'Inyambo zifite amahembe maremare.',
        'Inyambo cows have long horns.',
      ]),
      n('icyana', '7/8', 'young (of an animal)', 'ibyana', 'young', [
        'Injangwe yabyaye ibyana bitatu.',
        'The cat had three kittens.',
      ]),
      n('ihembe', '5/6', 'horn', 'amahembe', 'horns', [
        'Ihene ifite amahembe abiri.',
        'The goat has two horns.',
      ]),
      n('umurizo', '3/4', 'tail', 'imirizo', 'tails', [
        'Imbwa irazunguza umurizo.',
        'The dog is wagging its tail.',
      ]),
      v('kumoka', 'mok', 'to bark', 'bark', 'barks', [
        'Imbwa iramoka nijoro.',
        'The dog barks at night.',
      ]),
    ],
  },
  {
    topic: 'clothes',
    picturable: true,
    words: [
      n('ikariso', '9/6', 'underpants', 'amakariso', 'underpants', [
        'Gura amakariso mashya.',
        'Buy new underpants.',
      ]),
      n('igikomo', '7/8', 'bracelet, bangle', 'ibikomo', 'bracelets', [
        'Yambaye igikomo cya zahabu.',
        'She is wearing a gold bracelet.',
      ]),
      n('iherena', '5/6', 'earring', 'amaherena', 'earrings', [
        'Amaherena ye ni meza.',
        'Her earrings are pretty.',
      ]),
      n('ikotomoni', '9/6', 'wallet, purse', 'amakotomoni', 'wallets', [
        'Nataye ikotomoni yanjye.',
        'I lost my wallet.',
      ]),
      n(
        'umushanana',
        '3/4',
        'umushanana (traditional dress)',
        'imishanana',
        'traditional dresses',
        ['Abagore bambaye imishanana mu bukwe.', 'The women wore umushanana at the wedding.'],
      ),
      n('agapfukamunwa', '12/13', 'face mask', 'udupfukamunwa', 'face masks', [
        'Ambara agapfukamunwa.',
        'Wear a face mask.',
      ]),
      n('isume', '9/6', 'towel', 'amasume', 'towels', [
        'Isume iri ku mugozi.',
        'The towel is on the line.',
      ]),
      n('buto', '9/10', 'button', 'buto', 'buttons', [
        'Ishati yanjye yatakaje buto.',
        'My shirt has lost a button.',
      ]),
      n('agatimba', '12/13', 'bridal veil', 'udutimba', 'bridal veils', [
        'Umugeni yambaye agatimba.',
        'The bride is wearing a veil.',
      ]),
      n('uburoso', '14/6', 'brush, toothbrush', 'amaroso', 'brushes', [
        'Oza amenyo n’uburoso.',
        'Brush your teeth with a toothbrush.',
      ]),
      v('gucika', 'cik', 'to tear, to get torn', 'tear', 'tears', [
        'Ipantaro yanjye yacitse.',
        'My trousers have torn.',
      ]),
      v('gukuramo', 'kuramo', 'to take off (clothes, shoes)', 'take off', 'takes off', [
        'Kuramo inkweto mbere yo kwinjira.',
        'Take off your shoes before going in.',
      ]),
    ],
  },
  {
    topic: 'colours',
    picturable: true,
    words: [
      n('iroza', '9', 'pink', null, null, ['Ikanzu ye ni iroza.', 'Her dress is pink.']),
      n('ivu', '5', 'ash; grey', null, null, [
        'Ivu ry’amakara riri mu mbabura.',
        'The charcoal ash is in the stove.',
      ]),
      n('zahabu', '9', 'gold', null, null, ['Impeta ye ni iya zahabu.', 'Her ring is gold.']),
      n('irangi', '5/6', 'paint', 'amarangi', 'paints', [
        'Inzu yasizwe irangi ry’umweru.',
        'The house was painted white.',
      ]),
      o(
        'bibisi',
        'raw, unripe; fresh (things)',
        ['Ibitoki bibisi.', 'Unripe bananas.'],
        ['colours'],
      ),
      o('bihiye', 'cooked, ripe (things)', ['Ibiryo bihiye.', 'Cooked food.'], ['colours']),
      o('byumye', 'dry (things)', ['Ibiti byumye.', 'Dry wood.'], ['colours']),
      o('bitose', 'wet (things)', ['Ibitambaro bitose.', 'Wet cloths.'], ['colours']),
      o('bityaye', 'sharp (things)', ['Ibyuma bityaye.', 'Sharp knives.'], ['colours']),
      o('bigari', 'wide, broad (things)', ['Ibyumba bigari.', 'Wide rooms.'], ['colours']),
      o('byuzuye', 'full (things)', ['Ibikombe byuzuye.', 'Full cups.'], ['colours']),
      o('nabi', 'badly, wrongly', ['Yanditse nabi.', 'He or she wrote it badly.'], F),
      v('gusiga', 'sig', 'to paint, to smear; to leave behind', 'paint', 'paints', [
        'Turasiga inzu irangi.',
        "We're painting the house.",
      ]),
    ],
  },
  {
    topic: 'actions',
    picturable: true,
    words: [
      v('guhagarara', 'hagarar', 'to stand; to stop', 'stand', 'stands', [
        'Hagarara hano.',
        'Stand here.',
      ]),
      v('gupfukama', 'pfukam', 'to kneel', 'kneel', 'kneels', [
        'Apfukama asenga.',
        'He or she kneels to pray.',
      ]),
      v('kwegama', 'egam', 'to lean (against)', 'lean', 'leans', [
        'Ntiwegame ku rukuta.',
        "Don't lean on the wall.",
      ]),
      v('gukandagira', 'kandagir', 'to step on, to tread', 'step on', 'steps on', [
        'Wikandagira indabo.',
        "Don't step on the flowers.",
      ]),
      v('kunyerera', 'nyerer', 'to slip, to slide', 'slip', 'slips', [
        'Witonde, hano haranyerera.',
        "Careful, it's slippery here.",
      ]),
      v('kwikorera', 'ikorer', 'to carry on the head', 'carry on the head', 'carries on the head', [
        'Yikoreye igitebo cy’imboga.',
        'She is carrying a basket of vegetables on her head.',
      ]),
      v('guheka', 'hek', 'to carry on the back', 'carry on the back', 'carries on the back', [
        'Mama aheka umwana.',
        'Mum carries the baby on her back.',
      ]),
      v('kurekura', 'rekur', 'to let go, to release', 'let go', 'lets go', [
        'Rekura ukuboko kwanjye.',
        'Let go of my arm.',
      ]),
      v('gutwika', 'twik', 'to burn (something)', 'burn', 'burns', [
        'Ntugatwike imyanda.',
        "Don't burn rubbish.",
      ]),
      v('guhobera', 'hober', 'to hug, to embrace', 'hug', 'hugs', [
        'Yahobeye inshuti ye.',
        'He or she hugged his or her friend.',
      ]),
      v('kubyuka', 'byuk', 'to wake up, to get up', 'get up', 'gets up', [
        'Mbyuka saa kumi n’imwe.',
        'I get up at five.',
      ]),
      v('kwiyuhagira', 'iyuhagir', 'to bathe, to shower', 'bathe', 'bathes', [
        'Niyuhagira buri gitondo.',
        'I bathe every morning.',
      ]),
    ],
  },
  {
    topic: 'family',
    picturable: false,
    words: [
      n('umufasha', '1/2', 'spouse; helper', 'abafasha', 'spouses; helpers', [
        'Uyu ni umufasha wanjye.',
        'This is my spouse.',
      ]),
      n('umuramu', '1/2', 'brother-in-law (a spouse’s brother)', 'abaramu', 'brothers-in-law', [
        'Umuramu wanjye aba i Musanze.',
        'My brother-in-law lives in Musanze.',
      ]),
      n('muramukazi', '1/2', 'sister-in-law (a spouse’s sister)', 'baramukazi', 'sisters-in-law', [
        'Muramukazi wanjye yaje kudusura.',
        'My sister-in-law came to visit us.',
      ]),
      n('imfura', '9/10', 'firstborn; noble person', 'imfura', 'firstborns', [
        'Ni imfura mu muryango wacu.',
        'He or she is the firstborn in our family.',
      ]),
      n('bucura', '1', 'last-born child', null, null, [
        'Bucura wacu afite imyaka itanu.',
        'Our youngest is five years old.',
      ]),
      n('umukurambere', '1/2', 'ancestor, forebear', 'abakurambere', 'ancestors', [
        'Abakurambere bacu babaga hano.',
        'Our ancestors lived here.',
      ]),
      n('inkwano', '9/10', 'bride price, dowry', 'inkwano', 'bride prices', [
        'Inkwano yari inka ebyiri.',
        'The bride price was two cows.',
      ]),
      n('uruhinja', '11/10', 'newborn baby', 'impinja', 'newborn babies', [
        'Uruhinja rurasinziriye.',
        'The newborn is asleep.',
      ]),
      n('umuhango', '3/4', 'ceremony, custom', 'imihango', 'ceremonies', [
        'Umuhango wo gusaba uzaba ejo.',
        'The betrothal ceremony will be tomorrow.',
      ]),
      v('gukwa', 'kw', 'to pay the bride price', 'pay the bride price', 'pays the bride price', [
        'Bakoye inka eshatu.',
        'They paid three cows as bride price.',
      ]),
      v(
        'gushyingira',
        'shyingir',
        'to give in marriage, to marry off',
        'marry off',
        'marries off',
        ['Bashyingiye umukobwa wabo.', 'They married off their daughter.'],
      ),
      v('konsa', 'ons', 'to breastfeed', 'breastfeed', 'breastfeeds', [
        'Arimo konsa umwana.',
        'She is breastfeeding the baby.',
      ]),
      o('bombi', 'both (people)', ['Bombi ni abarimu.', 'They are both teachers.'], F),
    ],
  },

  // Ranks 1101 to 1200.
  {
    topic: 'farming',
    picturable: true,
    words: [
      n('soya', '9', 'soya beans', null, null, [
        'Dutera soya mu murima.',
        'We plant soya in the field.',
      ]),
      n('ishoka', '9/6', 'axe', 'amashoka', 'axes', [
        'Atema igiti n’ishoka.',
        'He or she cuts the tree with an axe.',
      ]),
      n('igitiyo', '7/8', 'spade, shovel', 'ibitiyo', 'spades', [
        'Fata igitiyo ucukure.',
        'Take the spade and dig.',
      ]),
      n('umugozi', '3/4', 'rope, string; line', 'imigozi', 'ropes', [
        'Zirika ihene n’umugozi.',
        'Tie the goat with a rope.',
      ]),
      n('umuzi', '3/4', 'root', 'imizi', 'roots', [
        'Igiti gifite imizi miremire.',
        'The tree has long roots.',
      ]),
      n('ishami', '5/6', 'branch', 'amashami', 'branches', [
        'Inyoni iri ku ishami.',
        'The bird is on the branch.',
      ]),
      n('ikibabi', '7/8', 'leaf', 'ibibabi', 'leaves', [
        'Ibibabi by’iki giti ni binini.',
        "This tree's leaves are big.",
      ]),
      n('ururabo', '11/10', 'flower', 'indabo', 'flowers', [
        'Indabo zo mu busitani ni nziza.',
        'The flowers in the garden are beautiful.',
      ]),
      n('urubingo', '11/10', 'elephant grass (fodder)', 'imbingo', 'elephant grass', [
        'Inka zirya urubingo.',
        'The cows eat elephant grass.',
      ]),
      n('ingorofani', '9/10', 'wheelbarrow', 'ingorofani', 'wheelbarrows', [
        'Dutwara ifumbire mu ngorofani.',
        'We carry the manure in a wheelbarrow.',
      ]),
      v('gucukura', 'cukur', 'to dig (a hole)', 'dig', 'digs', [
        'Turacukura umwobo.',
        "We're digging a hole.",
      ]),
      v('gusoroma', 'sorom', 'to pick (tea, coffee, fruit)', 'pick', 'picks', [
        'Asoroma icyayi buri munsi.',
        'He or she picks tea every day.',
      ]),
      v('kugaburira', 'gaburir', 'to feed', 'feed', 'feeds', [
        'Ngaburira inkoko mu gitondo.',
        'I feed the chickens in the morning.',
      ]),
    ],
  },
  {
    topic: 'house',
    picturable: true,
    words: [
      n('ishuka', '9/6', 'bedsheet', 'amashuka', 'bedsheets', [
        'Hindura amashuka ku buriri.',
        'Change the sheets on the bed.',
      ]),
      n('ingazi', '9/10', 'stairs, steps; ladder', 'ingazi', 'stairs', [
        'Zamuka ingazi buhoro.',
        'Go up the stairs slowly.',
      ]),
      n('inkingi', '9/10', 'pillar, post', 'inkingi', 'pillars', [
        'Inzu ifite inkingi enye.',
        'The house has four pillars.',
      ]),
      n('uruzitiro', '11/10', 'fence', 'inzitiro', 'fences', [
        'Uruzitiro rw’urugo ni rurerure.',
        'The fence around the home is tall.',
      ]),
      n('igorofa', '9/6', 'multi-storey building; floor (storey)', 'amagorofa', 'storeys', [
        'Atuye mu igorofa ya gatatu.',
        'He or she lives on the third floor.',
      ]),
      n('sima', '9', 'cement', null, null, [
        'Bubaka n’amatafari na sima.',
        'They build with bricks and cement.',
      ]),
      n('ibati', '5/6', 'iron roofing sheet', 'amabati', 'iron sheets', [
        'Igisenge ni icy’amabati.',
        'The roof is made of iron sheets.',
      ]),
      n('robine', '9/10', 'tap', 'robine', 'taps', ['Funga robine.', 'Turn off the tap.']),
      n('umusarani', '3/4', 'pit latrine, toilet', 'imisarani', 'latrines', [
        'Umusarani uri inyuma y’inzu.',
        'The latrine is behind the house.',
      ]),
      n('ikimoteri', '7/8', 'rubbish bin, rubbish dump', 'ibimoteri', 'rubbish bins', [
        'Jugunya imyanda mu kimoteri.',
        'Throw the rubbish in the bin.',
      ]),
      n('inzitiramibu', '9/10', 'mosquito net', 'inzitiramibu', 'mosquito nets', [
        'Turyama mu nzitiramibu.',
        'We sleep under a mosquito net.',
      ]),
      v('kwimuka', 'imuk', 'to move (house)', 'move', 'moves', [
        'Twimukiye mu nzu nshya.',
        "We've moved into a new house.",
      ]),
      v('gusana', 'san', 'to repair, to mend', 'repair', 'repairs', [
        'Arasana igisenge.',
        'He or she is repairing the roof.',
      ]),
    ],
  },
  {
    topic: 'weather',
    picturable: true,
    words: [
      n('isi', '9', 'earth, world', null, null, [
        'Isi izenguruka izuba.',
        'The earth goes round the sun.',
      ]),
      n('icyondo', '7', 'mud', null, null, [
        'Nyuma y’imvura hari icyondo.',
        "After the rain there's mud.",
      ]),
      n('umukungugu', '3', 'dust', null, null, [
        'Mu mpeshyi haba umukungugu mwinshi.',
        "In the dry season there's a lot of dust.",
      ]),
      n('ikirunga', '7/8', 'volcano', 'ibirunga', 'volcanoes', [
        'Ingagi ziba mu birunga.',
        'Gorillas live in the volcanoes.',
      ]),
      n('isumo', '5/6', 'waterfall', 'amasumo', 'waterfalls', [
        'Twagiye kureba isumo.',
        'We went to see the waterfall.',
      ]),
      n('ibuye', '5/6', 'stone', 'amabuye', 'stones', [
        'Ntimutere amabuye.',
        "Don't throw stones.",
      ]),
      n('umucanga', '3', 'sand', null, null, [
        'Abana bakinira mu mucanga.',
        'The children play in the sand.',
      ]),
      n('urutare', '11/10', 'rock, boulder', 'intare', 'rocks', [
        'Twicaye ku rutare.',
        'We sat on a rock.',
      ]),
      n('igicucu', '7/8', 'shade, shadow', 'ibicucu', 'shadows', [
        'Twicare mu gicucu cy’igiti.',
        "Let's sit in the shade of the tree.",
      ]),
      o(
        'rimwe na rimwe',
        'sometimes, now and then',
        ['Rimwe na rimwe imvura igwa nijoro.', 'Sometimes it rains at night.'],
        F,
      ),
      v('guhinda', 'hind', 'to thunder, to rumble', 'rumble', 'rumbles', [
        'Inkuba irahinda.',
        "It's thundering.",
      ]),
      v('gushira', 'shir', 'to end, to run out, to be used up', 'run out', 'runs out', [
        'Imvura yashize.',
        'The rain has stopped.',
      ]),
    ],
  },
  {
    topic: 'food',
    picturable: true,
    words: [
      n('isambaza', '9/10', 'small lake fish (sambaza)', 'isambaza', 'sambaza', [
        'Isambaza ziva mu kiyaga cya Kivu.',
        'Sambaza come from Lake Kivu.',
      ]),
      n('indagara', '9/10', 'small dried fish', 'indagara', 'small dried fish', [
        'Duteka indagara n’inyanya.',
        'We cook dried fish with tomatoes.',
      ]),
      n('fanta', '9/10', 'soda, soft drink', 'fanta', 'sodas', [
        'Mpa fanta ikonje.',
        'Give me a cold soda.',
      ]),
      n('makaroni', '9', 'pasta, macaroni', null, null, [
        'Uyu munsi turarya makaroni.',
        "Today we're eating pasta.",
      ]),
      n('inzabibu', '9/10', 'grape', 'inzabibu', 'grapes', [
        'Inzabibu ziraryoshye.',
        'The grapes are sweet.',
      ]),
      n('agatogo', '12', 'agatogo (plantain stew)', null, null, [
        'Mama yatetse agatogo.',
        'Mum made plantain stew.',
      ]),
      n('umufa', '3', 'broth, stock', null, null, [
        'Umufa w’inkoko uraryoshye.',
        'Chicken broth is tasty.',
      ]),
      n('ubushera', '14', 'sorghum drink (sweet, unfermented)', null, null, [
        'Abashyitsi bahawe ubushera.',
        'The guests were given ubushera.',
      ]),
      n('keke', '9/10', 'cake', 'keke', 'cakes', [
        'Twaguze keke y’isabukuru.',
        'We bought a birthday cake.',
      ]),
      n('bombo', '9/10', 'sweet, candy', 'bombo', 'sweets', [
        'Abana bakunda bombo.',
        'Children love sweets.',
      ]),
      n('omoleti', '9/10', 'omelette', 'omoleti', 'omelettes', [
        'Nariye omoleti mu gitondo.',
        'I had an omelette in the morning.',
      ]),
      v('guhaga', 'hag', 'to be full (after eating)', 'be full', 'is full', [
        'Murakoze, narahaze.',
        "Thank you, I'm full.",
      ]),
    ],
  },
  {
    topic: 'body',
    picturable: true,
    words: [
      n('ubwoya', '14', 'body hair; fur, wool', null, null, [
        'Intama ifite ubwoya bwinshi.',
        'The sheep has a lot of wool.',
      ]),
      n('igikumwe', '7/8', 'thumb', 'ibikumwe', 'thumbs', [
        'Shyira igikumwe hano.',
        'Put your thumbprint here.',
      ]),
      n('ino', '5/6', 'toe', 'amano', 'toes', [
        'Nakubise ino ku ibuye.',
        'I stubbed my toe on a stone.',
      ]),
      n('urubavu', '11/10', 'rib; side (of the body)', 'imbavu', 'ribs', [
        'Ndababara mu rubavu.',
        'My side hurts.',
      ]),
      n('icyuya', '7', 'sweat', null, null, [
        'Nyuma yo kwiruka yari yuzuye icyuya.',
        'After running he or she was covered in sweat.',
      ]),
      n('amacandwe', '6', 'saliva, spit', null, null, [
        'Ntucire amacandwe hasi.',
        "Don't spit on the ground.",
      ]),
      n('uruhara', '11', 'baldness, bald head', null, null, [
        'Data afite uruhara.',
        'My father is bald.',
      ]),
      n('ibere', '5/6', 'breast', 'amabere', 'breasts', [
        'Umwana yonka ibere.',
        'The baby is breastfeeding.',
      ]),
      n('urugingo', '11/10', 'limb; joint; body part', 'ingingo', 'limbs, joints', [
        'Ingingo zanjye zirababara.',
        'My joints ache.',
      ]),
      v('kwitsamura', 'itsamur', 'to sneeze', 'sneeze', 'sneezes', [
        'Aritsamura cyane.',
        'He or she is sneezing a lot.',
      ]),
      v('guhumbya', 'humby', 'to blink', 'blink', 'blinks', [
        'Ntiyahumbye.',
        "He or she didn't blink.",
      ]),
      v('kunuka', 'nuk', 'to smell (bad), to stink', 'smell', 'smells', [
        'Iyi fi iranuka.',
        'This fish smells.',
      ]),
    ],
  },
  {
    topic: 'colours',
    picturable: true,
    words: [
      n('ishusho', '9/6', 'picture, image; shape', 'amashusho', 'pictures', [
        'Iyi shusho ni nziza.',
        'This picture is beautiful.',
      ]),
      n('uruziga', '11/10', 'circle; wheel', 'inziga', 'circles', [
        'Abana bicaye mu ruziga.',
        'The children are sitting in a circle.',
      ]),
      n('umurongo', '3/4', 'line, row; queue', 'imirongo', 'lines, queues', [
        'Tonda umurongo.',
        'Stand in line.',
      ]),
      o('binanutse', 'thin (things)', ['Ibiti binanutse.', 'Thin sticks.'], ['colours']),
      o(
        'bibyibushye',
        'fat, thick (things)',
        ['Ibitabo bibyibushye.', 'Thick books.'],
        ['colours'],
      ),
      o(
        'bifunganye',
        'narrow, tight (things)',
        ['Ibyumba bifunganye.', 'Narrow rooms.'],
        ['colours'],
      ),
      o(
        'bizima',
        'whole, alive, healthy (things)',
        ['Ibigori bizima.', 'Whole maize cobs.'],
        ['colours'],
      ),
      o(
        'bisanzwe',
        'ordinary, usual (things)',
        ['Ni ibintu bisanzwe.', "It's ordinary stuff."],
        ['colours'],
      ),
      o(
        'bitandukanye',
        'different, various (things)',
        ['Ibintu bitandukanye.', 'Different things.'],
        ['colours'],
      ),
      o(
        'bigoramye',
        'bent, crooked (things)',
        ['Ibiti bigoramye.', 'Crooked sticks.'],
        ['colours'],
      ),
      o(
        'bigororotse',
        'straight (things)',
        ['Ibiti bigororotse.', 'Straight sticks.'],
        ['colours'],
      ),
      v('kurabagirana', 'rabagiran', 'to shine, to sparkle', 'shine', 'shines', [
        'Inyenyeri zirarabagirana.',
        'The stars are sparkling.',
      ]),
    ],
  },
  {
    topic: 'actions',
    picturable: true,
    words: [
      v('kumwenyura', 'mwenyur', 'to smile', 'smile', 'smiles', [
        'Ahora amwenyura.',
        'He or she is always smiling.',
      ]),
      v('kuzimira', 'zimir', 'to get lost, to disappear', 'get lost', 'gets lost', [
        'Urufunguzo rwanjye rwazimiye.',
        'My key has disappeared.',
      ]),
      v('kunyeganyeza', 'nyeganyez', 'to shake (something)', 'shake', 'shakes', [
        'Nyeganyeza icupa mbere yo kurifungura.',
        'Shake the bottle before opening it.',
      ]),
      v('kuzunguza', 'zunguz', 'to wave, to swing', 'wave', 'waves', [
        'Azunguza ukuboko.',
        'He or she is waving.',
      ]),
      v('gukoma', 'kom', 'to clap (amashyi)', 'clap', 'claps', [
        'Bakoma amashyi.',
        "They're clapping.",
      ]),
      v('kubyina', 'byin', 'to dance', 'dance', 'dances', [
        'Abana barabyina.',
        'The children are dancing.',
      ]),
      v('kubumba', 'bumb', 'to mould (clay), to make pottery', 'mould', 'moulds', [
        'Abumba inkono.',
        'He or she makes clay pots.',
      ]),
      v('gusiba', 'sib', 'to rub out, to delete; to miss (school, work)', 'rub out', 'rubs out', [
        'Siba ku kibaho.',
        'Wipe the board.',
      ]),
      v('gukanda', 'kand', 'to press; to massage', 'press', 'presses', [
        'Kanda hano.',
        'Press here.',
      ]),
      v('kurambura', 'rambur', 'to stretch out, to spread out', 'stretch out', 'stretches out', [
        'Rambura amaguru.',
        'Stretch out your legs.',
      ]),
      v('kuvuza', 'vuz', 'to sound, to play (a drum, a horn)', 'sound', 'sounds', [
        'Avuza ingoma.',
        'He or she plays the drum.',
      ]),
      v('gupima', 'pim', 'to measure, to weigh; to test', 'measure', 'measures', [
        'Pima uburebure bw’ameza.',
        'Measure the length of the table.',
      ]),
      o('gato', 'a little, a bit', ['Tegereza gato.', 'Wait a bit.'], F),
    ],
  },
  {
    topic: 'people',
    picturable: false,
    words: [
      n('umusinzi', '1/2', 'drunkard', 'abasinzi', 'drunkards', [
        'Umusinzi yaguye mu muhanda.',
        'The drunkard fell in the road.',
      ]),
      n('umunebwe', '1/2', 'lazy person', 'abanebwe', 'lazy people', [
        'Ntukabe umunebwe.',
        "Don't be lazy.",
      ]),
      n('umusazi', '1/2', 'mad person, lunatic', 'abasazi', 'mad people', [
        'Ntumwite umusazi.',
        "Don't call him or her mad.",
      ]),
      n('impumyi', '9/10', 'blind person', 'impumyi', 'blind people', [
        'Impumyi igendana inkoni.',
        'The blind person walks with a stick.',
      ]),
      n('umugome', '1/2', 'cruel, wicked person', 'abagome', 'wicked people', [
        'Yari umugome cyane.',
        'He or she was very cruel.',
      ]),
      n('intore', '9/10', 'traditional dancer; chosen one', 'intore', 'traditional dancers', [
        'Intore zabyinnye neza.',
        'The dancers danced well.',
      ]),
      n('umunyamuryango', '1/2', 'member', 'abanyamuryango', 'members', [
        'Ndi umunyamuryango wa koperative.',
        "I'm a member of the cooperative.",
      ]),
      n('itsinda', '5/6', 'group', 'amatsinda', 'groups', [
        'Twigira mu matsinda.',
        'We study in groups.',
      ]),
      n('umufana', '1/2', 'fan, supporter', 'abafana', 'fans', [
        'Ndi umufana wa APR.',
        "I'm an APR fan.",
      ]),
      n('umuzunguzayi', '1/2', 'street vendor', 'abazunguzayi', 'street vendors', [
        'Umuzunguzayi agurisha imineke.',
        'The street vendor sells bananas.',
      ]),
      v('gutongana', 'tongan', 'to quarrel, to scold', 'quarrel', 'quarrels', [
        'Ntimugatongane.',
        "Don't quarrel.",
      ]),
      v('kurwana', 'rwan', 'to fight', 'fight', 'fights', [
        'Abana barwanye ku ishuri.',
        'The children fought at school.',
      ]),
      o('bamwe', 'some (people)', ['Bamwe baje, abandi ntibaje.', "Some came, others didn't."], F),
    ],
  },
];
