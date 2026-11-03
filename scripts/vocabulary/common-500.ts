// Common 500: ranks 201 to 500, in clusters, drafted like Common 200 (see common-200.ts). Each
// topic returns at a harder level, and picturable clusters lead each hundred.
//
// AI DRAFT. Written by Claude, not yet checked by a native speaker.

import { n, o, v, type Cluster } from './words.ts';

const F = ['function'];

export const COMMON_500: Cluster[] = [
  // Ranks 201 to 300.
  {
    topic: 'clothes',
    picturable: true,
    words: [
      n('umwenda', '3/4', 'piece of clothing, cloth', 'imyenda', 'clothes', [
        'Imyenda yanjye irimo kuma.',
        'My clothes are drying.',
      ]),
      n('ishati', '5/6', 'shirt', 'amashati', 'shirts', [
        'Yambaye ishati nshya.',
        'He or she is wearing a new shirt.',
      ]),
      n('ipantaro', '5/6', 'trousers', 'amapantaro', 'pairs of trousers', [
        'Iyi pantaro ni nini.',
        'These trousers are big.',
      ]),
      n('ikanzu', '9/6', 'dress, gown', 'amakanzu', 'dresses', [
        'Yaguze ikanzu nziza.',
        'She bought a beautiful dress.',
      ]),
      n('urukweto', '11/10', 'shoe', 'inkweto', 'shoes', [
        'Kuramo inkweto.',
        'Take off your shoes.',
      ]),
      n('ingofero', '9/10', 'hat, cap', 'ingofero', 'hats, caps', [
        'Ambara ingofero, hari izuba.',
        "Put on a hat, it's sunny.",
      ]),
      n('ikoti', '5/6', 'coat, jacket', 'amakoti', 'coats, jackets', [
        'Hari imbeho, ambara ikoti.',
        "It's cold, put on a jacket.",
      ]),
      n('igitambaro', '7/8', 'cloth, towel, scarf', 'ibitambaro', 'cloths, towels', [
        'Mpa igitambaro.',
        'Give me the towel.',
      ]),
      v('kwambara', 'ambar', 'to wear, to get dressed', 'wear', 'wears', [
        'Ambara neza.',
        'Dress well.',
      ]),
      v('gukaraba', 'karab', 'to wash (hands or body)', 'wash', 'washes', [
        'Karaba intoki.',
        'Wash your hands.',
      ]),
      v('kumesa', 'mes', 'to wash clothes', 'wash clothes', 'washes clothes', [
        'Ndamesa imyenda ku wa gatandatu.',
        'I wash clothes on Saturday.',
      ]),
    ],
  },
  {
    topic: 'animals',
    picturable: true,
    words: [
      n('imbwa', '9/10', 'dog', 'imbwa', 'dogs', ['Imbwa iramoka.', 'The dog is barking.']),
      n('injangwe', '9/10', 'cat', 'injangwe', 'cats', [
        'Injangwe iraryamye.',
        'The cat is lying down.',
      ]),
      n('inkoko', '9/10', 'chicken', 'inkoko', 'chickens', [
        'Inkoko yateye amagi.',
        'The chicken laid eggs.',
      ]),
      n(
        'ihene',
        '9/10',
        'goat',
        'ihene',
        'goats',
        ['Afite ihene eshatu.', 'He or she has three goats.'],
        ['farming'],
      ),
      n(
        'intama',
        '9/10',
        'sheep',
        'intama',
        'sheep (many)',
        ['Intama zirarisha.', 'The sheep are grazing.'],
        ['farming'],
      ),
      n(
        'ingurube',
        '9/10',
        'pig',
        'ingurube',
        'pigs',
        ['Ingurube irarya cyane.', 'The pig eats a lot.'],
        ['farming'],
      ),
      n(
        'ifi',
        '5/6',
        'fish',
        'amafi',
        'fish (many)',
        ['Turarya amafi uyu munsi.', "We're eating fish today."],
        ['food'],
      ),
      n('inyoni', '9/10', 'bird', 'inyoni', 'birds', [
        'Inyoni ziraririmba.',
        'The birds are singing.',
      ]),
      n('inzoka', '9/10', 'snake', 'inzoka', 'snakes', [
        'Witondere inzoka.',
        'Watch out for snakes.',
      ]),
      n('intare', '9/10', 'lion', 'intare', 'lions', [
        'Intare iba mu ishyamba.',
        'The lion lives in the wild.',
      ]),
      n('inzovu', '9/10', 'elephant', 'inzovu', 'elephants', [
        'Inzovu ni nini cyane.',
        'The elephant is very big.',
      ]),
      n('inyamaswa', '9/10', 'animal (wild)', 'inyamaswa', 'animals', [
        'Twabonye inyamaswa nyinshi muri Pariki.',
        'We saw many animals in the park.',
      ]),
      v(
        'kuragira',
        'ragir',
        'to herd, to graze (animals)',
        'herd',
        'herds',
        ['Umuhungu araragira inka.', 'The boy is herding the cows.'],
        ['farming'],
      ),
    ],
  },
  {
    topic: 'farming',
    picturable: true,
    words: [
      n('umurima', '3/4', 'field (for crops)', 'imirima', 'fields', [
        'Ari mu murima.',
        'He or she is in the field.',
      ]),
      n('ubutaka', '14', 'land, soil', null, null, [
        'Ubutaka bwacu ni bwiza.',
        'Our land is good.',
      ]),
      n('umuhinzi', '1/2', 'farmer', 'abahinzi', 'farmers', [
        'Data ni umuhinzi.',
        'My father is a farmer.',
      ]),
      n('isuka', '9/10', 'hoe', 'amasuka', 'hoes', [
        'Fata isuka tujye guhinga.',
        "Take the hoe and let's go and dig.",
      ]),
      n(
        'ikigori',
        '7/8',
        'maize, corn cob',
        'ibigori',
        'maize, corn',
        ['Twahinze ibigori.', 'We grew maize.'],
        ['food'],
      ),
      n(
        'ikawa',
        '9',
        'coffee',
        null,
        null,
        ['U Rwanda rufite ikawa nziza.', 'Rwanda has good coffee.'],
        ['food'],
      ),
      n('igiti', '7/8', 'tree, wood', 'ibiti', 'trees', [
        'Twicaye munsi y’igiti.',
        "We're sitting under the tree.",
      ]),
      n('icyatsi', '7/8', 'grass, plant', 'ibyatsi', 'grass, plants', [
        'Inka zirya ibyatsi.',
        'Cows eat grass.',
      ]),
      v('guhinga', 'hing', 'to farm, to dig', 'farm', 'farms', [
        'Bahinga ibishyimbo.',
        'They grow beans.',
      ]),
      v('gutera', 'ter', 'to plant', 'plant', 'plants', [
        'Turatera ibiti.',
        "We're planting trees.",
      ]),
      v('gusarura', 'sarur', 'to harvest', 'harvest', 'harvests', [
        'Tuzasarura mu kwezi gutaha.',
        "We'll harvest next month.",
      ]),
      n('umusaruro', '3/4', 'harvest, produce, result', 'imisaruro', 'harvests, results', [
        'Umusaruro wabaye mwiza.',
        'The harvest was good.',
      ]),
    ],
  },
  {
    topic: 'health',
    picturable: true,
    words: [
      n('indwara', '9/10', 'illness, disease', 'indwara', 'illnesses', [
        'Malariya ni indwara mbi.',
        'Malaria is a bad disease.',
      ]),
      n('umurwayi', '1/2', 'sick person, patient', 'abarwayi', 'patients', [
        'Umurwayi ari mu bitaro.',
        'The patient is in hospital.',
      ]),
      n('umuti', '3/4', 'medicine', 'imiti', 'medicines', [
        'Nywa umuti wawe.',
        'Take your medicine.',
      ]),
      n('ivuriro', '5/6', 'clinic, health centre', 'amavuriro', 'clinics', [
        'Ivuriro riri hafi.',
        'The clinic is near.',
      ]),
      n('umuforomo', '1/2', 'nurse', 'abaforomo', 'nurses', [
        'Umuforomo arafasha abarwayi.',
        'The nurse helps the patients.',
      ]),
      n(
        'amaraso',
        '6',
        'blood',
        null,
        null,
        ['Yatanze amaraso.', 'He or she gave blood.'],
        ['body'],
      ),
      n(
        'inda',
        '9/10',
        'belly, stomach; pregnancy',
        'inda',
        'bellies',
        ['Ndwaye mu nda.', 'I have a stomach ache.'],
        ['body'],
      ),
      n('malariya', '9', 'malaria', null, null, ['Yarwaye malariya.', 'He or she had malaria.']),
      n('isuku', '9', 'cleanliness, hygiene', null, null, [
        'Isuku ni isoko y’ubuzima.',
        'Cleanliness is the source of health.',
      ]),
      v('kurwara', 'rwar', 'to fall ill, to be ill', 'get sick', 'gets sick', [
        'Umwana yarwaye.',
        'The child is sick.',
      ]),
      v('kuvura', 'vur', 'to treat, to heal', 'treat', 'treats', [
        'Abaganga baravura abarwayi.',
        'Doctors treat the sick.',
      ]),
      v('gukira', 'kir', 'to get better, to recover', 'get better', 'gets better', [
        'Ndizera ko uzakira vuba.',
        'I hope you get better soon.',
      ]),
    ],
  },
  {
    topic: 'colours',
    picturable: true,
    words: [
      n('ibara', '5/6', 'colour', 'amabara', 'colours', [
        'Ukunda irihe bara?',
        'Which colour do you like?',
      ]),
      n('umweru', '3', 'white', null, null, [
        'Yambaye umwenda w’umweru.',
        'He or she is wearing white clothes.',
      ]),
      n('umukara', '3', 'black', null, null, [
        'Imodoka ye ni umukara.',
        'His or her car is black.',
      ]),
      n('umutuku', '3', 'red', null, null, ['Ndashaka ishati y’umutuku.', 'I want a red shirt.']),
      n('ubururu', '14', 'blue', null, null, ['Ikirere ni ubururu.', 'The sky is blue.']),
      n('umuhondo', '3', 'yellow', null, null, [
        'Igitoki gihiye ni umuhondo.',
        'A ripe banana is yellow.',
      ]),
      o('munini', 'big (a person, as in umuntu munini)', [
        'Ni umugabo munini.',
        'He is a big man.',
      ]),
      o('muto', 'small, young (a person)', [
        'Murumuna wanjye ni muto.',
        'My younger brother or sister is small.',
      ]),
      o('mwiza', 'good, beautiful (a person)', ['Ni umugore mwiza.', 'She is a beautiful woman.']),
      o('mubi', 'bad, ugly (a person)', ['Si umuntu mubi.', "He or she isn't a bad person."]),
      o('muremure', 'tall, long (a person)', ['Umuhungu wanjye ni muremure.', 'My son is tall.']),
      o('mugufi', 'short (a person)', ['Ni mugufi kundusha.', 'He or she is shorter than me.']),
    ],
  },
  {
    topic: 'time',
    picturable: false,
    words: [
      n('igihe', '7/8', 'time, period, season', 'ibihe', 'times, seasons', [
        'Nta gihe mfite.',
        "I don't have time.",
      ]),
      n('umwanya', '3/4', 'time, space, chance', 'imyanya', 'spaces, places', [
        'Ufite umwanya?',
        'Do you have time?',
      ]),
      o('saa', "o'clock (before the hour: saa tatu, nine o'clock)", [
        'Ni saa ngahe?',
        'What time is it?',
      ]),
      n('amanywa', '6', 'daytime', null, null, [
        'Akora ku manywa.',
        'He or she works during the day.',
      ]),
      o('kare', 'early', ['Nabyutse kare.', 'I woke up early.']),
      o('ubutaha', 'next time', ['Ubutaha nzaza.', "Next time I'll come."]),
      o('ubushize', 'last time', ['Ubushize twaraganiriye.', 'Last time we talked.']),
      o('iteka', 'always, forever', ['Imana ni nziza iteka.', 'God is good, always.']),
      o('kenshi', 'often', ['Tuvugana kenshi.', 'We talk often.']),
      v('gutinda', 'tind', 'to be late, to take long', 'run late', 'runs late', [
        'Mbabarira, natinze.',
        "Sorry, I'm late.",
      ]),
      v('gutangira', 'tangir', 'to begin, to start', 'begin', 'begins', [
        'Ishuri ritangira ejo.',
        'School starts tomorrow.',
      ]),
      v(
        'kurangiza',
        'rangiz',
        'to finish',
        'finish',
        'finishes',
        ['Narangije akazi.', "I've finished the work."],
        ['work'],
      ),
    ],
  },
  {
    topic: 'places',
    picturable: true,
    words: [
      o(
        'hejuru',
        'above, on top, up',
        ['Igitabo kiri hejuru y’ameza.', 'The book is on the table.'],
        F,
      ),
      o(
        'munsi',
        'under, below',
        ['Injangwe iri munsi y’intebe.', 'The cat is under the chair.'],
        F,
      ),
      o(
        'inyuma',
        'behind, outside, after',
        ['Ari inyuma y’inzu.', 'He or she is behind the house.'],
        F,
      ),
      o(
        'imbere',
        'in front, inside, ahead',
        ['Hagarara imbere yanjye.', 'Stand in front of me.'],
        F,
      ),
      o(
        'hagati',
        'between, in the middle',
        ['Yicaye hagati yacu.', 'He or she is sitting between us.'],
        F,
      ),
      o('hanze', 'outside', ['Abana bari hanze.', 'The children are outside.'], F),
      v('gushyira', 'shyir', 'to put, to place', 'put', 'puts', [
        'Shyira igitabo ku meza.',
        'Put the book on the table.',
      ]),
      v('kuzana', 'zan', 'to bring', 'bring', 'brings', ['Zana amazi.', 'Bring water.']),
      v('gutwara', 'twar', 'to carry, to take, to drive', 'carry', 'carries', [
        'Atwara imodoka.',
        'He or she drives a car.',
      ]),
    ],
  },
  {
    topic: 'numbers',
    picturable: false,
    words: [
      o('makumyabiri', 'twenty', ['Mfite imyaka makumyabiri.', "I'm twenty years old."]),
      n('ijana', '5/6', 'hundred', 'amajana', 'hundreds', [
        'Ni amafaranga ijana.',
        "It's a hundred francs.",
      ]),
      n('igihumbi', '7/8', 'thousand', 'ibihumbi', 'thousands', [
        'Ni ibihumbi bibiri.',
        "It's two thousand.",
      ]),
      n('miliyoni', '9/10', 'million', 'miliyoni', 'millions', [
        'Hari abantu miliyoni cumi na bitatu.',
        'There are thirteen million people.',
      ]),
      n('igice', '7/8', 'part, piece, half', 'ibice', 'parts, pieces', [
        'Mpa igice cy’umugati.',
        'Give me a piece of bread.',
      ]),
      n('umubare', '3/4', 'number, amount', 'imibare', 'numbers; maths', [
        'Umubare w’abanyeshuri ni munini.',
        'The number of students is large.',
      ]),
      n('inshuro', '9/10', 'time (as in twice)', 'inshuro', 'times', [
        'Nahamagaye inshuro ebyiri.',
        'I called twice.',
      ]),
      v('kubara', 'bar', 'to count', 'count', 'counts', [
        'Bara kuva kuri rimwe kugeza ku icumi.',
        'Count from one to ten.',
      ]),
      o('cumi', 'ten (in eleven to nineteen: cumi na rimwe, eleven)', [
        'Mfite imyaka cumi n’itanu.',
        "I'm fifteen years old.",
      ]),
      o('mirongo', 'tens (mirongo itatu, thirty)', [
        'Ni amafaranga mirongo itanu.',
        "It's fifty francs.",
      ]),
    ],
  },
  {
    topic: 'function',
    picturable: false,
    words: [
      o('ese', '(starts a yes-or-no question)', ['Ese uraza?', 'Are you coming?']),
      o('uko', 'how, the way that', ['Sinzi uko bikorwa.', "I don't know how it's done."]),
      o('aho', 'where (that), the place where', ['Aho ntuye ni kure.', 'Where I live is far.']),
      o('iyo', 'if, when; that one', [
        'Iyo imvura iguye, turaguma mu nzu.',
        'When it rains, we stay inside.',
      ]),
      o('nyamara', 'however, and yet', [
        'Nyamara yari yabivuze.',
        'And yet he or she had said it.',
      ]),
      o('ngo', 'that (reporting what is said); so that', [
        'Yavuze ngo azaza.',
        'He or she said that he or she will come.',
      ]),
      o('nka', 'like, such as, about', [
        'Avuga nka mama we.',
        'He or she talks like his or her mother.',
      ]),
      o('kugeza', 'until, up to', ['Ndakora kugeza saa kumi.', "I work until four o'clock."]),
      o('kuva', 'from, since', ['Kuva ejo ntiyaje.', "He or she hasn't come since yesterday."]),
      o('ndetse', 'even, and also', ['Ndetse n’abana baraje.', 'Even the children came.']),
      o('rero', 'so, then', ['Ngwino rero.', 'Come, then.']),
    ],
  },

  // Ranks 301 to 400.
  {
    topic: 'house',
    picturable: true,
    words: [
      n('igikoni', '7/8', 'kitchen', 'ibikoni', 'kitchens', [
        'Mama ari mu gikoni.',
        'Mum is in the kitchen.',
      ]),
      n('ubwiherero', '14', 'toilet, bathroom', null, null, [
        'Ubwiherero buri he?',
        'Where is the toilet?',
      ]),
      n(
        'inkono',
        '9/10',
        'cooking pot',
        'inkono',
        'pots',
        ['Shyira inkono ku muriro.', 'Put the pot on the fire.'],
        ['food'],
      ),
      n('icupa', '5/6', 'bottle', 'amacupa', 'bottles', [
        'Mpa icupa ry’amazi.',
        'Give me a bottle of water.',
      ]),
      n('indobo', '9/10', 'bucket', 'indobo', 'buckets', [
        'Voma amazi mu ndobo.',
        'Fetch water in the bucket.',
      ]),
      n('urufunguzo', '11/10', 'key', 'imfunguzo', 'keys', [
        'Nabuze urufunguzo.',
        "I've lost the key.",
      ]),
      n('irembo', '5/6', 'gate, entrance', 'amarembo', 'gates', [
        'Fungura irembo.',
        'Open the gate.',
      ]),
      n('urukuta', '11/10', 'wall', 'inkuta', 'walls', [
        'Ifoto iri ku rukuta.',
        'The photo is on the wall.',
      ]),
      n('isabune', '9', 'soap', null, null, ['Karaba n’isabune.', 'Wash with soap.']),
      v('gukubura', 'kubur', 'to sweep', 'sweep', 'sweeps', [
        'Ndakubura inzu buri gitondo.',
        'I sweep the house every morning.',
      ]),
      v('gusukura', 'sukur', 'to clean', 'clean', 'cleans', [
        'Dusukure icyumba.',
        "Let's clean the room.",
      ]),
      v('kubaka', 'ubak', 'to build', 'build', 'builds', [
        'Barubaka inzu nshya.',
        "They're building a new house.",
      ]),
    ],
  },
  {
    topic: 'food',
    picturable: true,
    words: [
      n('ifunguro', '5/6', 'meal', 'amafunguro', 'meals', [
        'Ifunguro rya nimugoroba ryiteguye.',
        'Dinner is ready.',
      ]),
      n('inzoga', '9/10', 'alcohol, beer', 'inzoga', 'drinks (alcoholic)', [
        'Sinywa inzoga.',
        "I don't drink alcohol.",
      ]),
      n('umutobe', '3/4', 'juice', 'imitobe', 'juices', [
        'Ndashaka umutobe w’imbuto.',
        'I want fruit juice.',
      ]),
      n('ubuki', '14', 'honey', null, null, ['Ubuki buraryoshye.', 'Honey is tasty.']),
      n('ifu', '9', 'flour', null, null, ['Dukeneye ifu y’ibigori.', 'We need maize flour.']),
      n('umwumbati', '3/4', 'cassava plant', 'imyumbati', 'cassava', [
        'Imyumbati irera hano.',
        'Cassava grows well here.',
      ]),
      n('igitunguru', '7/8', 'onion', 'ibitunguru', 'onions', [
        'Shyiramo igitunguru.',
        'Put in an onion.',
      ]),
      n('avoka', '9/10', 'avocado', 'avoka', 'avocados', [
        'Avoka ni nziza cyane.',
        'Avocados are very good.',
      ]),
      n('inyota', '9', 'thirst', null, null, ['Mfite inyota.', "I'm thirsty."]),
      n('inzara', '9', 'hunger; famine', null, null, ['Mfite inzara.', "I'm hungry."]),
      v('kuryoha', 'ryoh', 'to taste good', 'taste good', 'tastes good', [
        'Ibiryo biraryoshye.',
        'The food is tasty.',
      ]),
      v('gukaranga', 'karang', 'to fry', 'fry', 'fries', [
        'Ndakaranga ibirayi.',
        "I'm frying potatoes.",
      ]),
    ],
  },
  {
    topic: 'places',
    picturable: true,
    words: [
      n('icyaro', '7/8', 'countryside, rural area', 'ibyaro', 'rural areas', [
        'Ababyeyi banjye baba mu cyaro.',
        'My parents live in the countryside.',
      ]),
      n('umudugudu', '3/4', 'village', 'imidugudu', 'villages', [
        'Umudugudu wacu ni muto.',
        'Our village is small.',
      ]),
      n(
        'akarere',
        '12/13',
        'district',
        'uturere',
        'districts',
        ['Ntuye mu karere ka Huye.', 'I live in Huye district.'],
        ['government'],
      ),
      n(
        'intara',
        '9/10',
        'province',
        'intara',
        'provinces',
        [
          'U Rwanda rufite intara enye n’Umujyi wa Kigali.',
          'Rwanda has four provinces and the City of Kigali.',
        ],
        ['government'],
      ),
      n('umupaka', '3/4', 'border', 'imipaka', 'borders', [
        'Twambutse umupaka.',
        'We crossed the border.',
      ]),
      n('ishyamba', '5/6', 'forest', 'amashyamba', 'forests', [
        'Ishyamba rya Nyungwe ni rinini.',
        'Nyungwe Forest is big.',
      ]),
      n('uruzi', '11/10', 'river', 'inzuzi', 'rivers', ['Uruzi rwuzuye.', 'The river is full.']),
      n('inyanja', '9/10', 'sea, ocean', 'inyanja', 'seas', [
        'U Rwanda nta nyanja rufite.',
        'Rwanda has no sea.',
      ]),
      n('ikiraro', '7/8', 'bridge', 'ibiraro', 'bridges', [
        'Twambuka ikiraro.',
        'We cross the bridge.',
      ]),
      n('gare', '9', 'bus station', null, null, [
        'Bisi zihagarara muri gare.',
        'Buses stop at the bus station.',
      ]),
      n('bisi', '9/10', 'bus', 'bisi', 'buses', [
        'Fata bisi ijya i Musanze.',
        'Take the bus to Musanze.',
      ]),
      v('gutembera', 'tember', 'to travel, to go for a walk', 'travel', 'travels', [
        'Dukunda gutembera.',
        'We like to travel.',
      ]),
      v('kugera', 'ger', 'to arrive, to reach', 'arrive', 'arrives', [
        'Nageze mu rugo.',
        "I've arrived home.",
      ]),
    ],
  },
  {
    topic: 'people',
    picturable: true,
    words: [
      n('umuturage', '1/2', 'resident, citizen', 'abaturage', 'residents, the people', [
        'Abaturage barakora umuganda.',
        'The residents are doing community work.',
      ]),
      n('umuturanyi', '1/2', 'neighbour', 'abaturanyi', 'neighbours', [
        'Umuturanyi wanjye ni mwiza.',
        'My neighbour is nice.',
      ]),
      n('umushyitsi', '1/2', 'guest, visitor', 'abashyitsi', 'guests', [
        'Dufite abashyitsi.',
        'We have guests.',
      ]),
      n('umuzungu', '1/2', 'white person, foreigner', 'abazungu', 'white people, foreigners', [
        'Umuzungu avuga Ikinyarwanda!',
        'The foreigner speaks Kinyarwanda!',
      ]),
      n('umunyamahanga', '1/2', 'foreigner', 'abanyamahanga', 'foreigners', [
        'Abanyamahanga benshi basura u Rwanda.',
        'Many foreigners visit Rwanda.',
      ]),
      n('umujura', '1/2', 'thief', 'abajura', 'thieves', [
        'Umujura yibye telefoni.',
        'The thief stole a phone.',
      ]),
      n('umukire', '1/2', 'rich person', 'abakire', 'rich people', [
        'Si umukire.',
        "He or she isn't rich.",
      ]),
      n('umukene', '1/2', 'poor person', 'abakene', 'poor people', [
        'Dufashe abakene.',
        "Let's help the poor.",
      ]),
      n('umugenzi', '1/2', 'traveller, passenger', 'abagenzi', 'travellers, passengers', [
        'Bisi yuzuye abagenzi.',
        'The bus is full of passengers.',
      ]),
      n('urubyiruko', '11', 'young people, youth', null, null, [
        'Urubyiruko ni ejo hazaza.',
        'Young people are the future.',
      ]),
      v('gusura', 'sur', 'to visit', 'visit', 'visits', [
        'Nzagusura ejo.',
        "I'll visit you tomorrow.",
      ]),
      v('kwakira', 'akir', 'to receive, to welcome', 'welcome', 'welcomes', [
        'Batwakiriye neza.',
        'They welcomed us well.',
      ]),
    ],
  },
  {
    topic: 'shopping',
    picturable: false,
    words: [
      n(
        'ubucuruzi',
        '14',
        'trade, business',
        null,
        null,
        ['Akora ubucuruzi.', 'He or she is in business.'],
        ['work'],
      ),
      n('umucuruzi', '1/2', 'trader, shopkeeper', 'abacuruzi', 'traders', [
        'Umucuruzi agurisha imyenda.',
        'The trader sells clothes.',
      ]),
      n('umukiriya', '1/2', 'customer', 'abakiriya', 'customers', [
        'Iduka rifite abakiriya benshi.',
        'The shop has many customers.',
      ]),
      n('ideni', '5/6', 'debt', 'amadeni', 'debts', ['Mfite ideni.', 'I have a debt.']),
      n('igiceri', '7/8', 'coin', 'ibiceri', 'coins', [
        'Nta biceri mfite.',
        "I don't have any coins.",
      ]),
      n('inoti', '9/10', 'banknote', 'inoti', 'banknotes', [
        'Ni inoti y’ibihumbi bitanu.',
        "It's a five-thousand note.",
      ]),
      n('ubuntu', '14', 'free of charge; kindness, grace', null, null, [
        'Ni ubuntu.',
        "It's free.",
      ]),
      n('ikarita', '9/6', 'card, map', 'amakarita', 'cards, maps', [
        'Nishyura n’ikarita.',
        "I'll pay by card.",
      ]),
      v('guhenda', 'hend', 'to be expensive', 'cost a lot', 'costs a lot', [
        'Ibi birahenze cyane.',
        'This is very expensive.',
      ]),
      v('kugabanya', 'gabany', 'to reduce, to lower (a price)', 'reduce', 'reduces', [
        'Ese wagabanya igiciro?',
        'Could you lower the price?',
      ]),
      v('kuguza', 'guz', 'to borrow, to lend', 'borrow', 'borrows', [
        'Ndashaka kuguza amafaranga.',
        'I want to borrow money.',
      ]),
    ],
  },
  {
    topic: 'work',
    picturable: false,
    words: [
      n('ibiro', '8', 'office; kilograms', null, null, [
        'Ari ku biro.',
        'He or she is at the office.',
      ]),
      n(
        'umuyobozi',
        '1/2',
        'leader, manager',
        'abayobozi',
        'leaders',
        ['Umuyobozi w’ikigo arahari.', 'The head of the organisation is here.'],
        ['government'],
      ),
      n('umukoresha', '1/2', 'employer, boss', 'abakoresha', 'employers', [
        'Umukoresha wanjye ni mwiza.',
        'My boss is good.',
      ]),
      n('umushahara', '3/4', 'salary, wages', 'imishahara', 'salaries', [
        'Umushahara uza ku mpera z’ukwezi.',
        'The salary comes at the end of the month.',
      ]),
      n('inama', '9/10', 'meeting; advice', 'inama', 'meetings', [
        'Dufite inama saa yine.',
        "We have a meeting at ten o'clock.",
      ]),
      n('umushinga', '3/4', 'project', 'imishinga', 'projects', [
        'Uyu mushinga ni ingenzi.',
        'This project is important.',
      ]),
      n('mudasobwa', '9/10', 'computer', 'mudasobwa', 'computers', [
        'Nkoresha mudasobwa buri munsi.',
        'I use a computer every day.',
      ]),
      n('telefoni', '9/10', 'phone', 'telefoni', 'phones', [
        'Telefoni yanjye yazimye.',
        'My phone has died.',
      ]),
      n('imashini', '9/10', 'machine', 'imashini', 'machines', [
        'Imashini irapfuye.',
        'The machine is broken.',
      ]),
      v('gukoresha', 'koresh', 'to use; to employ', 'use', 'uses', [
        'Ukoresha iyi telefoni?',
        'Do you use this phone?',
      ]),
      v('gutegura', 'tegur', 'to prepare, to organise', 'prepare', 'prepares', [
        'Turategura ubukwe.',
        "We're preparing a wedding.",
      ]),
      v('kohereza', 'oherez', 'to send', 'send', 'sends', [
        'Nzakoherereza ubutumwa.',
        "I'll send you a message.",
      ]),
    ],
  },
  {
    topic: 'school',
    picturable: false,
    words: [
      n('ikizamini', '7/8', 'exam, test', 'ibizamini', 'exams', [
        'Ejo dufite ikizamini.',
        'Tomorrow we have an exam.',
      ]),
      n('amanota', '6', 'marks, grades', null, null, [
        'Yabonye amanota meza.',
        'He or she got good marks.',
      ]),
      n('ururimi', '11/10', 'language; tongue', 'indimi', 'languages', [
        'Uvuga indimi zingahe?',
        'How many languages do you speak?',
      ]),
      n('Icyongereza', '7', 'English (the language)', null, null, [
        'Uvuga Icyongereza?',
        'Do you speak English?',
      ]),
      n('Igifaransa', '7', 'French (the language)', null, null, [
        'Yiga Igifaransa.',
        'He or she is learning French.',
      ]),
      n('kaminuza', '9/10', 'university', 'kaminuza', 'universities', [
        'Yiga muri kaminuza.',
        'He or she studies at university.',
      ]),
      n('ubumenyi', '14', 'knowledge', null, null, [
        'Ubumenyi ni ubukungu.',
        'Knowledge is wealth.',
      ]),
      n('igitekerezo', '7/8', 'idea, opinion', 'ibitekerezo', 'ideas', [
        'Ni igitekerezo cyiza.',
        "It's a good idea.",
      ]),
      v('kwigisha', 'igish', 'to teach', 'teach', 'teaches', [
        'Yigisha imibare.',
        'He or she teaches maths.',
      ]),
      v('gutsinda', 'tsind', 'to pass, to win', 'win', 'wins', [
        'Yatsinze ikizamini.',
        'He or she passed the exam.',
      ]),
      v('gutsindwa', 'tsindw', 'to fail, to lose', 'lose', 'loses', [
        'Ikipe yacu yatsinzwe.',
        'Our team lost.',
      ]),
      v('gusobanura', 'sobanur', 'to explain', 'explain', 'explains', [
        'Sobanura neza.',
        'Explain clearly.',
      ]),
    ],
  },
  {
    topic: 'church',
    picturable: false,
    words: [
      n('umukristo', '1/2', 'Christian', 'abakristo', 'Christians', [
        'Ni umukristo.',
        'He or she is a Christian.',
      ]),
      n('umumarayika', '1/2', 'angel', 'abamarayika', 'angels', [
        'Umumarayika w’Imana.',
        'An angel of God.',
      ]),
      n('icyaha', '7/8', 'sin', 'ibyaha', 'sins', [
        'Imana itubabarira ibyaha.',
        'God forgives us our sins.',
      ]),
      n('imbabazi', '10', 'forgiveness, mercy', null, null, [
        'Ndagusaba imbabazi.',
        'I ask your forgiveness.',
      ]),
      n('umugisha', '3/4', 'blessing', 'imigisha', 'blessings', [
        'Imana iguhe umugisha.',
        'May God bless you.',
      ]),
      n('umwuka', '3/4', 'breath, spirit, air', 'imyuka', 'spirits', [
        'Umwuka Wera.',
        'The Holy Spirit.',
      ]),
      n('ituro', '5/6', 'offering', 'amaturo', 'offerings', [
        'Dutanga amaturo.',
        'We give offerings.',
      ]),
      n('ubutumwa', '14', 'message', null, null, ['Ubutumwa bwiza.', 'The good news, the gospel.']),
      v('kubabarira', 'babarir', 'to forgive', 'forgive', 'forgives', [
        'Mbabarira.',
        'Forgive me; sorry.',
      ]),
      v('gushima', 'shim', 'to thank, to praise', 'thank', 'thanks', [
        'Turashima Imana.',
        'We thank God.',
      ]),
      v('kubwiriza', 'bwiriz', 'to preach', 'preach', 'preaches', [
        'Pasiteri arabwiriza.',
        'The pastor is preaching.',
      ]),
    ],
  },

  // Ranks 401 to 500.
  {
    topic: 'body',
    picturable: true,
    words: [
      n('isura', '9/6', 'face', 'amasura', 'faces', [
        'Afite isura nziza.',
        'He or she has a nice face.',
      ]),
      n('ijosi', '5/6', 'neck', 'amajosi', 'necks', ['Ijosi rirambabaza.', 'My neck hurts.']),
      n(
        'igifu',
        '7/8',
        'stomach',
        'ibifu',
        'stomachs',
        ['Igifu kirambabaza.', 'My stomach hurts.'],
        ['health'],
      ),
      n('umugongo', '3/4', 'back', 'imigongo', 'backs', ['Umugongo urambabaza.', 'My back hurts.']),
      n('urutoki', '11/10', 'finger', 'intoki', 'fingers, hands', [
        'Karaba intoki.',
        'Wash your hands.',
      ]),
      n('uruhu', '11/10', 'skin, hide', 'impu', 'skins', [
        'Uruhu rwe ruroroshye.',
        'His or her skin is soft.',
      ]),
      n('ikirenge', '7/8', 'foot (the sole)', 'ibirenge', 'feet', [
        'Ibirenge byanjye birarushye.',
        'My feet are tired.',
      ]),
      n('ubwonko', '14', 'brain', null, null, ['Ubwonko bukora cyane.', 'The brain works hard.']),
      n(
        'amarira',
        '6',
        'tears',
        null,
        null,
        ['Yarize amarira menshi.', 'He or she cried a lot.'],
        ['feelings'],
      ),
      v('guhumeka', 'humek', 'to breathe; to rest', 'breathe', 'breathes', [
        'Humeka buhoro.',
        'Breathe slowly.',
      ]),
      v('kuruha', 'ruh', 'to get tired', 'get tired', 'gets tired', [
        'Ndarushye cyane.',
        "I'm very tired.",
      ]),
      v('gusinzira', 'sinzir', 'to sleep, to fall asleep', 'sleep', 'sleeps', [
        'Umwana arasinziriye.',
        'The baby is asleep.',
      ]),
    ],
  },
  {
    topic: 'family',
    picturable: true,
    words: [
      n('umwuzukuru', '1/2', 'grandchild', 'abuzukuru', 'grandchildren', [
        'Nyogokuru akunda abuzukuru be.',
        'Grandmother loves her grandchildren.',
      ]),
      n('nyirarume', '1a', "uncle (mother's brother)", null, null, [
        'Nyirarume aba i Rubavu.',
        'My uncle lives in Rubavu.',
      ]),
      n('nyirasenge', '1a', "aunt (father's sister)", null, null, [
        'Nyirasenge yaje kudusura.',
        'My aunt came to visit us.',
      ]),
      n('mubyara', '1a/2', 'cousin', 'babyara', 'cousins', [
        'Mubyara wanjye yashatse.',
        'My cousin got married.',
      ]),
      n('umukwe', '1/2', 'son-in-law, groom', 'abakwe', 'sons-in-law', [
        'Umukwe yaje.',
        'The groom has come.',
      ]),
      n('umugeni', '1/2', 'bride', 'abageni', 'brides', [
        'Umugeni ni mwiza.',
        'The bride is beautiful.',
      ]),
      n('impanga', '9/10', 'twin', 'impanga', 'twins', ['Yabyaye impanga.', 'She had twins.']),
      n('imfubyi', '9/10', 'orphan', 'imfubyi', 'orphans', [
        'Barera imfubyi.',
        'They raise orphans.',
      ]),
      n('umupfakazi', '1/2', 'widow, widower', 'abapfakazi', 'widows', [
        'Itorero rifasha abapfakazi.',
        'The church helps widows.',
      ]),
      v('kurera', 'rer', 'to raise, to bring up (a child)', 'raise', 'raises', [
        'Kurera abana ni akazi.',
        'Raising children is work.',
      ]),
      v('kurongora', 'rongor', 'to marry (said of the man)', 'marry', 'marries', [
        'Azarongora umwaka utaha.',
        "He'll get married next year.",
      ]),
      v('kubana', 'ban', 'to live together, to get along', 'live with', 'lives with', [
        'Tubana neza.',
        'We get along well.',
      ]),
    ],
  },
  {
    topic: 'weather',
    picturable: true,
    words: [
      n('ikirere', '7/8', 'sky, weather, atmosphere', 'ibirere', 'skies', [
        'Ikirere kimeze neza uyu munsi.',
        'The weather is nice today.',
      ]),
      n('igicu', '7/8', 'cloud', 'ibicu', 'clouds', ['Hari ibicu byinshi.', "It's very cloudy."]),
      n('inkuba', '9/10', 'thunder, lightning', 'inkuba', 'thunderstorms', [
        'Inkuba irakubita.',
        "It's thundering.",
      ]),
      n('ubushyuhe', '14', 'heat, warmth', null, null, [
        'Hari ubushyuhe bwinshi.',
        "It's very hot.",
      ]),
      n('imbeho', '9', 'cold; the cold season', null, null, ['Mfite imbeho.', "I'm cold."]),
      n('urubura', '11', 'hail', null, null, [
        'Urubura rwangije imyaka.',
        'The hail damaged the crops.',
      ]),
      n('itumba', '5', 'the long rainy season (March to May)', null, null, [
        'Itumba rizana imvura nyinshi.',
        'The long rainy season brings a lot of rain.',
      ]),
      n('impeshyi', '9', 'the dry season (June to August)', null, null, [
        'Mu mpeshyi nta mvura igwa.',
        "In the dry season it doesn't rain.",
      ]),
      n('inyenyeri', '9/10', 'star', 'inyenyeri', 'stars', [
        'Inyenyeri ziraka.',
        'The stars are shining.',
      ]),
      n('umwijima', '3', 'darkness', null, null, [
        'Hari umwijima, cana itara.',
        "It's dark, turn on the light.",
      ]),
      n('urumuri', '11', 'light', null, null, ['Urumuri rw’izuba.', 'Sunlight.']),
      v('gushyuha', 'shyuh', 'to get hot', 'get hot', 'gets hot', [
        'Amazi arashyushye.',
        'The water is hot.',
      ]),
      v('gukonja', 'konj', 'to get cold', 'get cold', 'gets cold', [
        'Icyayi cyakonje.',
        'The tea has gone cold.',
      ]),
    ],
  },
  {
    topic: 'government',
    picturable: false,
    words: [
      n('leta', '9', 'the government, the state', null, null, [
        'Leta yubatse ishuri.',
        'The government built a school.',
      ]),
      n('perezida', '1a/2', 'president', 'baperezida', 'presidents', [
        'Perezida yavuze ijambo.',
        'The president gave a speech.',
      ]),
      n('minisitiri', '1a/2', 'minister', 'baminisitiri', 'ministers', [
        'Minisitiri w’Uburezi.',
        'The Minister of Education.',
      ]),
      n('itegeko', '5/6', 'law, rule', 'amategeko', 'laws', [
        'Twubahe amategeko.',
        "Let's respect the laws.",
      ]),
      n('amatora', '6', 'election', null, null, [
        'Amatora azaba mu kwezi gutaha.',
        'The election will be next month.',
      ]),
      n('umupolisi', '1/2', 'police officer', 'abapolisi', 'police officers', [
        'Umupolisi araturinda.',
        'The police officer protects us.',
      ]),
      n('umusirikare', '1/2', 'soldier', 'abasirikare', 'soldiers', [
        'Umusirikare arinda igihugu.',
        'A soldier protects the country.',
      ]),
      n('urukiko', '11/10', 'court', 'inkiko', 'courts', [
        'Urubanza ruri mu rukiko.',
        'The case is in court.',
      ]),
      n('amahoro', '6', 'peace', null, null, ['Amahoro y’Imana.', 'The peace of God.']),
      n('umutekano', '3', 'security, safety', null, null, [
        'Hano hari umutekano.',
        "It's safe here.",
      ]),
      n('umusoro', '3/4', 'tax', 'imisoro', 'taxes', ['Twishyura imisoro.', 'We pay taxes.']),
      v('gutora', 'tor', 'to vote, to choose, to pick up', 'vote', 'votes', [
        'Abaturage baratora uyu munsi.',
        'The people are voting today.',
      ]),
      v('kuyobora', 'yobor', 'to lead, to guide', 'lead', 'leads', [
        'Ayobora ikigo.',
        'He or she runs the organisation.',
      ]),
    ],
  },
  {
    topic: 'feelings',
    picturable: false,
    words: [
      n('umujinya', '3', 'anger', null, null, ['Afite umujinya.', 'He or she is angry.']),
      n('agahinda', '12', 'sorrow, grief', null, null, ['Mfite agahinda.', "I'm sad."]),
      n('isoni', '10', 'shame, shyness', null, null, ['Afite isoni.', 'He or she is shy.']),
      n('ishyari', '5', 'jealousy, envy', null, null, ['Ishyari ni ribi.', 'Jealousy is bad.']),
      n('umunezero', '3', 'happiness, delight', null, null, [
        'Twagize umunezero mwinshi.',
        'We were very happy.',
      ]),
      n('ibyiringiro', '8', 'hope', null, null, ['Dufite ibyiringiro.', 'We have hope.']),
      v('kurakara', 'rakar', 'to get angry', 'get angry', 'gets angry', [
        'Ntukarakare.',
        "Don't be angry.",
      ]),
      v('gutinya', 'tiny', 'to fear, to be afraid of', 'fear', 'fears', [
        'Atinya imbwa.',
        'He or she is afraid of dogs.',
      ]),
      v('kurira', 'rir', 'to cry', 'cry', 'cries', ['Umwana ararira.', 'The baby is crying.']),
      v('kubabaza', 'babaz', 'to hurt, to upset (someone)', 'hurt', 'hurts', [
        'Wambabaje.',
        'You hurt me.',
      ]),
      v('kwibuka', 'ibuk', 'to remember', 'remember', 'remembers', [
        'Ndakwibuka.',
        'I remember you.',
      ]),
      v('kwibagirwa', 'ibagirw', 'to forget', 'forget', 'forgets', [
        'Nibagiwe izina rye.',
        "I've forgotten his or her name.",
      ]),
    ],
  },
  {
    topic: 'actions',
    picturable: true,
    words: [
      v('gutegereza', 'tegerez', 'to wait', 'wait', 'waits', [
        'Ndagutegereje.',
        "I'm waiting for you.",
      ]),
      v('gukurikira', 'kurikir', 'to follow', 'follow', 'follows', ['Nkurikira.', 'Follow me.']),
      v('kwemera', 'emer', 'to agree, to accept, to believe', 'agree', 'agrees', [
        'Ndabyemera.',
        'I agree.',
      ]),
      v('kwanga', 'ang', 'to refuse, to dislike', 'refuse', 'refuses', [
        'Yanze kurya.',
        'He or she refused to eat.',
      ]),
      v('gufata', 'fat', 'to take, to hold, to catch', 'take', 'takes', [
        'Fata iki.',
        'Take this.',
      ]),
      v('gutanga', 'tang', 'to give, to hand out', 'give', 'gives', [
        'Atanga amafaranga ku itorero.',
        'He or she gives money to the church.',
      ]),
      v('guha', 'h', 'to give (to someone)', 'give', 'gives', ['Mpa amazi.', 'Give me water.']),
      v('kubwira', 'bwir', 'to tell', 'tell', 'tells', ['Mbwira ukuri.', 'Tell me the truth.']),
      v('guhamagara', 'hamagar', 'to call', 'call', 'calls', [
        'Uzampamagare ejo.',
        'Call me tomorrow.',
      ]),
      v('kugaruka', 'garuk', 'to come back, to return', 'come back', 'comes back', [
        'Nzagaruka vuba.',
        "I'll be back soon.",
      ]),
      v('gusohoka', 'sohok', 'to go out, to come out', 'go out', 'goes out', [
        'Yasohotse.',
        'He or she has gone out.',
      ]),
      v('kwinjira', 'injir', 'to enter, to come in', 'come in', 'comes in', [
        'Injira!',
        'Come in!',
      ]),
      v('guhura', 'hur', 'to meet', 'meet', 'meets', ['Tuzahura ejo.', "We'll meet tomorrow."]),
      v('kubura', 'bur', 'to lack, to lose, to be missing', 'lose', 'loses', [
        'Nabuze telefoni yanjye.',
        "I've lost my phone.",
      ]),
    ],
  },
  {
    topic: 'colours',
    picturable: false,
    words: [
      o('byiza', 'good, nice (things)', ['Ni byiza cyane.', "It's very good."]),
      o('bibi', 'bad (things)', ['Ibyo ni bibi.', "That's bad."]),
      o('bishya', 'new (things)', ['Ibi bitabo ni bishya.', 'These books are new.']),
      o('bishaje', 'old, worn out (things)', [
        'Inkweto zanjye zirashaje.',
        'My shoes are worn out.',
      ]),
      o('byoroshye', 'easy; soft', ['Ikinyarwanda ntabwo cyoroshye.', "Kinyarwanda isn't easy."]),
      o('bigoye', 'hard, difficult', ['Ibi birakomeye, biragoye.', 'This is hard, difficult.']),
      o('bike', 'few, a little (things)', ['Mfite ibitabo bike.', 'I have a few books.']),
      o('byinshi', 'many, a lot (things)', [
        'Afite ibintu byinshi.',
        'He or she has a lot of things.',
      ]),
      o('buhoro', 'slowly, gently', ['Vuga buhoro.', 'Speak slowly.']),
      n('ukuri', '15', 'truth', null, null, ['Vuga ukuri.', 'Tell the truth.']),
      v('gukomera', 'komer', 'to be strong, to be hard', 'grow strong', 'grows strong', [
        'Komera!',
        'Be strong!',
      ]),
      v('kunanirwa', 'nanirw', 'to fail, to be unable', 'fail', 'fails', [
        'Nananiwe.',
        "I can't manage; I'm worn out.",
      ]),
      v('kuremera', 'remer', 'to be heavy', 'weigh a lot', 'weighs a lot', [
        'Iki gikapu kiraremereye.',
        'This bag is heavy.',
      ]),
    ],
  },
  {
    topic: 'function',
    picturable: false,
    words: [
      o('gute', 'how?', ['Bimeze gute?', 'How is it going?']),
      o('koko', 'really, truly', ['Ni koko?', 'Really?']),
      o('ahari', 'perhaps, maybe', ['Ahari azaza ejo.', 'Perhaps he or she will come tomorrow.']),
      o('noneho', 'now then, so now', ['Noneho tugende.', "Now let's go."]),
      o('ubwo', 'then, at that time; so', ['Ubwo nari mu rugo.', 'At that time I was at home.']),
      o('nanone', 'again, also', ['Uzagaruke nanone.', 'Come again.']),
      o('byose', 'everything, all (things)', ['Byose ni byiza.', 'Everything is good.']),
      o('bose', 'everyone, all (people)', ['Bose baraje.', 'Everyone came.']),
      o('undi', 'another (person), someone else', ['Hari undi muntu?', 'Is there anyone else?']),
      o('ikindi', 'another (thing), something else', [
        'Ushaka ikindi?',
        'Do you want anything else?',
      ]),
      o('nanjye', 'me too, and I', ['Nanjye ndashaka.', 'I want some too.']),
      o('ntacyo', 'nothing; it doesn’t matter', ['Ntacyo bitwaye.', "It doesn't matter."]),
      o('kimwe', 'the same; one (thing)', ['Ni kimwe.', "It's the same."]),
      o('niko', 'that is how; indeed', ['Niko bimeze.', "That's how it is."]),
    ],
  },
];
