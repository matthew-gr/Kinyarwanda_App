// Common 2000, first part: ranks 1201 to 1500, in clusters, drafted like Common 500 (see
// common-500.ts). These carry on from Common 1200 with words for adult life (work and business,
// government and community, health, school, church, money, travel, time and character, and more
// function words), avoid every word in Common 1200, and picturable clusters lead each hundred.
//
// AI DRAFT. Written by Claude, not yet checked by a native speaker.

import { n, o, v, type Cluster } from './words.ts';

const F = ['function'];

export const COMMON_1500: Cluster[] = [
  // Ranks 1201 to 1300.
  {
    topic: 'places',
    picturable: true,
    words: [
      n('inyubako', '9/10', 'building', 'inyubako', 'buildings', [
        'Iyi nyubako ni ndende cyane.',
        'This building is very tall.',
      ]),
      n('akabari', '12/13', 'bar', 'utubari', 'bars', [
        'Ntajya mu kabari.',
        'He or she never goes to bars.',
      ]),
      n('isangano', '5/6', 'junction, crossroads', 'amasangano', 'junctions', [
        'Duhurire ku isangano.',
        "Let's meet at the junction.",
      ]),
      n('inkengero', '9/10', 'outskirts, edge', 'inkengero', 'outskirts', [
        'Atuye mu nkengero z’umujyi.',
        'He or she lives on the outskirts of town.',
      ]),
      n('sitasiyo', '9/10', 'petrol station', 'sitasiyo', 'petrol stations', [
        'Hagarara kuri sitasiyo.',
        'Stop at the petrol station.',
      ]),
      n('lisansi', '9', 'petrol', null, null, ['Lisansi yahenze.', 'Petrol has got expensive.']),
      n('icyambu', '7/8', 'port, harbour', 'ibyambu', 'ports', [
        'Ubwato bugeze ku cyambu.',
        'The boat has reached the port.',
      ]),
      v('guparika', 'parik', 'to park', 'park', 'parks', [
        'Parika imodoka hano.',
        'Park the car here.',
      ]),
      v('kuyoba', 'yob', 'to get lost, to lose the way', 'get lost', 'gets lost', [
        'Nayobye mu mujyi.',
        'I got lost in town.',
      ]),
      o(
        'hakurya',
        'on the other side, across',
        ['Atuye hakurya y’umugezi.', 'He or she lives across the river.'],
        F,
      ),
    ],
  },
  {
    topic: 'work',
    picturable: true,
    words: [
      n('inyundo', '9/10', 'hammer', 'inyundo', 'hammers', [
        'Mpa inyundo n’imisumari.',
        'Give me the hammer and the nails.',
      ]),
      n('umusumari', '3/4', 'nail', 'imisumari', 'nails', [
        'Kubita umusumari neza.',
        'Hit the nail properly.',
      ]),
      n('urwego', '11/10', 'ladder; level', 'inzego', 'ladders; levels', [
        'Urwego ruri ku rukuta.',
        'The ladder is against the wall.',
      ]),
      n('urukero', '11/10', 'saw', 'inkero', 'saws', [
        'Batema igiti n’urukero.',
        'They cut the tree with a saw.',
      ]),
      n('ikamyo', '9/6', 'lorry, truck', 'amakamyo', 'lorries', [
        'Ikamyo itwara imizigo.',
        'The lorry carries goods.',
      ]),
      n('ipine', '5/6', 'tyre', 'amapine', 'tyres', [
        'Ipine ry’imodoka ryaturitse.',
        "The car's tyre burst.",
      ]),
      n('umufundi', '1/2', 'mason, builder', 'abafundi', 'masons', [
        'Umufundi arimo kubaka urukuta.',
        'The mason is building a wall.',
      ]),
      n('umukarani', '1/2', 'porter', 'abakarani', 'porters', [
        'Umukarani yantwaje umuzigo.',
        'The porter carried my luggage for me.',
      ]),
      n('umumotari', '1/2', 'moto taxi driver', 'abamotari', 'moto taxi drivers', [
        'Umumotari yanjyanye ku isoko.',
        'The moto driver took me to the market.',
      ]),
      n('ikiraka', '7/8', 'casual job, odd job', 'ibiraka', 'casual jobs', [
        'Nabonye ikiraka cy’icyumweru.',
        'I found a week of casual work.',
      ]),
      v('gupakira', 'pakir', 'to load (a vehicle)', 'load', 'loads', [
        'Barapakira ikamyo.',
        "They're loading the lorry.",
      ]),
      v('gusudira', 'sudir', 'to weld', 'weld', 'welds', [
        'Asudira inzugi z’ibyuma.',
        'He or she welds metal doors.',
      ]),
    ],
  },
  {
    topic: 'church',
    picturable: true,
    words: [
      n('kiliziya', '9/10', 'Catholic church (building)', 'kiliziya', 'churches', [
        'Tujya muri kiliziya ku cyumweru.',
        'We go to church on Sunday.',
      ]),
      n('umusigiti', '3/4', 'mosque', 'imisigiti', 'mosques', [
        'Umusigiti uri hafi y’isoko.',
        'The mosque is near the market.',
      ]),
      n('ishapure', '9/6', 'rosary', 'amashapure', 'rosaries', [
        'Asenga afite ishapure.',
        'He or she prays with a rosary.',
      ]),
      n('buji', '9/10', 'candle', 'buji', 'candles', ['Cana buji.', 'Light the candle.']),
      n('inzogera', '9/10', 'bell', 'inzogera', 'bells', [
        'Inzogera ya kiliziya iravuga.',
        'The church bell is ringing.',
      ]),
      n('alitari', '9/6', 'altar', 'amalitari', 'altars', [
        'Padiri ahagaze imbere ya alitari.',
        'The priest stands in front of the altar.',
      ]),
      n('isakaramentu', '5/6', 'sacrament', 'amasakaramentu', 'sacraments', [
        'Umubatizo ni isakaramentu.',
        'Baptism is a sacrament.',
      ]),
      n('umwepiskopi', '1/2', 'bishop', 'abepiskopi', 'bishops', [
        'Umwepiskopi yasuye paruwasi yacu.',
        'The bishop visited our parish.',
      ]),
      n('umushehe', '1/2', 'sheikh, imam', 'abashehe', 'sheikhs', [
        'Umushehe yayoboye isengesho.',
        'The sheikh led the prayer.',
      ]),
      n('umuyisilamu', '1/2', 'Muslim', 'abayisilamu', 'Muslims', [
        'Abayisilamu basenga ku wa gatanu.',
        'Muslims pray on Friday.',
      ]),
      n('umugatolika', '1/2', 'Catholic', 'abagatolika', 'Catholics', [
        'Ndi umugatolika.',
        "I'm Catholic.",
      ]),
      v('kwiyiriza', 'iyiriz', 'to fast (kwiyiriza ubusa)', 'fast', 'fasts', [
        'Twiyiriza ubusa iminsi itatu.',
        "We're fasting for three days.",
      ]),
    ],
  },
  {
    topic: 'shopping',
    picturable: true,
    words: [
      n('butike', '9/6', 'small shop, kiosk', 'amabutike', 'small shops', [
        'Gura umugati kuri butike.',
        'Buy bread at the little shop.',
      ]),
      n('umunzani', '3/4', 'scale (for weighing)', 'iminzani', 'scales', [
        'Pima ibirayi ku munzani.',
        'Weigh the potatoes on the scale.',
      ]),
      n('agatebo', '12/13', 'small basket', 'udutebo', 'small baskets', [
        'Yikoreye agatebo k’imbuto.',
        'She is carrying a small basket of fruit.',
      ]),
      n('ishashi', '9/6', 'plastic bag', 'amashashi', 'plastic bags', [
        'Amashashi arabujijwe mu Rwanda.',
        'Plastic bags are banned in Rwanda.',
      ]),
      n('ikarito', '9/6', 'cardboard box', 'amakarito', 'boxes', [
        'Ibitabo biri mu ikarito.',
        'The books are in the box.',
      ]),
      n('ikofi', '9/6', 'wallet, purse', 'amakofi', 'wallets', [
        'Nataye ikofi yanjye.',
        'I lost my wallet.',
      ]),
      n('isanduku', '9/6', 'trunk, chest, large box', 'amasanduku', 'trunks', [
        'Imyenda iri mu isanduku.',
        'The clothes are in the trunk.',
      ]),
      n('umudandaza', '1/2', 'small trader, hawker', 'abadandaza', 'small traders', [
        'Umudandaza agurisha amandazi.',
        'The trader sells doughnuts.',
      ]),
      n('inyemezabwishyu', '9/10', 'receipt', 'inyemezabwishyu', 'receipts', [
        'Mpa inyemezabwishyu.',
        'Give me a receipt.',
      ]),
      n('ikiguzi', '7/8', 'cost', 'ibiguzi', 'costs', [
        'Ikiguzi cy’urugendo ni kinini.',
        'The cost of the trip is high.',
      ]),
      v('kugemura', 'gemur', 'to supply, to deliver (goods)', 'supply', 'supplies', [
        'Agemura amata mu mujyi.',
        'He or she supplies milk to the town.',
      ]),
      v('gukodesha', 'kodesh', 'to rent', 'rent', 'rents', [
        'Dukodesha inzu i Kigali.',
        'We rent a house in Kigali.',
      ]),
    ],
  },
  {
    topic: 'government',
    picturable: false,
    words: [
      n('intambara', '9/10', 'war', 'intambara', 'wars', [
        'Intambara yarangiye.',
        'The war ended.',
      ]),
      n('ingabo', '9/10', 'army, soldiers; shield', 'ingabo', 'armed forces', [
        'Ingabo zirinda igihugu.',
        'The army defends the country.',
      ]),
      n('ruswa', '9', 'bribery, corruption', null, null, [
        'Ruswa irabujijwe.',
        'Bribery is forbidden.',
      ]),
      n('icyemezo', '7/8', 'decision; certificate', 'ibyemezo', 'decisions', [
        'Twafashe icyemezo.',
        'We made a decision.',
      ]),
      n('umugambi', '3/4', 'plan, intention', 'imigambi', 'plans', [
        'Afite umugambi mwiza.',
        'He or she has a good plan.',
      ]),
      n('ikirego', '7/8', 'complaint, lawsuit', 'ibirego', 'complaints', [
        'Yatanze ikirego mu rukiko.',
        'He or she filed a complaint in court.',
      ]),
      n('imfungwa', '9/10', 'prisoner', 'imfungwa', 'prisoners', [
        'Imfungwa zarekuwe.',
        'The prisoners were released.',
      ]),
      n('umutangabuhamya', '1/2', 'witness', 'abatangabuhamya', 'witnesses', [
        'Umutangabuhamya yavuze ukuri.',
        'The witness told the truth.',
      ]),
      n('ubwiyunge', '14', 'reconciliation', null, null, [
        'Ubwiyunge bwubaka igihugu.',
        'Reconciliation builds the country.',
      ]),
      n('politiki', '9', 'politics; policy', null, null, [
        'Ntakunda kuvuga politiki.',
        "He or she doesn't like talking politics.",
      ]),
      n('umukandida', '1/2', 'candidate', 'abakandida', 'candidates', [
        'Abakandida batatu biyamamaje.',
        'Three candidates stood for election.',
      ]),
      v('kuburana', 'buran', 'to argue a case in court', 'argue a case', 'argues a case', [
        'Bazaburana ejo.',
        'Their case will be heard tomorrow.',
      ]),
      v('kurega', 'reg', 'to sue, to accuse (in court)', 'sue', 'sues', [
        'Yareze umuturanyi we.',
        'He or she sued a neighbour.',
      ]),
      v('kwiba', 'ib', 'to steal', 'steal', 'steals', [
        'Bamwibye telefoni.',
        'Someone stole his or her phone.',
      ]),
    ],
  },
  {
    topic: 'time',
    picturable: false,
    words: [
      n('umuseke', '3', 'dawn', null, null, ['Twahagurutse mu museke.', 'We set off at dawn.']),
      n('igicuku', '7', 'the middle of the night', null, null, [
        'Yageze mu rugo mu gicuku.',
        'He or she got home in the middle of the night.',
      ]),
      n('ikiringo', '7/8', 'period, term (of office)', 'ibiringo', 'terms', [
        'Ikiringo cya perezida ni imyaka itanu.',
        "The president's term is five years.",
      ]),
      n('ahazaza', '16', 'the future', null, null, [
        'Twiga dutegura ahazaza.',
        'We study to prepare for the future.',
      ]),
      n('Ubunani', '14', 'New Year', null, null, ['Ubunani bwiza!', 'Happy New Year!']),
      n('impera', '9/10', 'end (of a period)', 'impera', 'ends', [
        'Tuzahura mu mpera z’icyumweru.',
        "We'll meet at the weekend.",
      ]),
      n('ibirori', '8', 'party, celebration', null, null, [
        'Twatumiwe mu birori.',
        'We were invited to a party.',
      ]),
      v(
        'kuramuka',
        'ramuk',
        'to get through the night (greeting: good morning)',
        'get through the night',
        'gets through the night',
        ['Waramutse ute?', 'Good morning, how are you?'],
      ),
      v(
        'kwirirwa',
        'irirw',
        'to spend the day (greeting: good afternoon)',
        'spend the day',
        'spends the day',
        ['Wiriwe ute?', 'Good afternoon, how has your day been?'],
      ),
      v('gukererwa', 'kererw', 'to be late', 'be late', 'is late', [
        'Nakererewe bisi.',
        'I was late for the bus.',
      ]),
      v('kumara', 'mar', 'to spend (time); to finish', 'spend', 'spends', [
        'Namaze imyaka ibiri i Kigali.',
        'I spent two years in Kigali.',
      ]),
      o(
        'ahagana',
        'around, about (a time or number)',
        ['Nzaza ahagana saa tatu.', "I'll come at about nine in the morning."],
        F,
      ),
      o(
        'hashize',
        'ago, it has been (a time)',
        ['Hashize imyaka itanu tutabonana.', "It's been five years since we saw each other."],
        F,
      ),
      o(
        'amaherezo',
        'in the end, eventually',
        ['Amaherezo yaratsinze.', 'In the end he or she succeeded.'],
        F,
      ),
    ],
  },
  {
    topic: 'feelings',
    picturable: false,
    words: [
      n('urugwiro', '11', 'warmth, friendly welcome', null, null, [
        'Batwakiriye n’urugwiro.',
        'They welcomed us warmly.',
      ]),
      n('ubugwaneza', '14', 'kindness, gentleness', null, null, [
        'Avugana ubugwaneza.',
        'He or she speaks kindly.',
      ]),
      n('ubupfura', '14', 'good manners, decency', null, null, [
        'Uyu mwana afite ubupfura.',
        'This child has good manners.',
      ]),
      n('umururumba', '3', 'greed', null, null, ['Umururumba ni mubi.', 'Greed is bad.']),
      n('agasuzuguro', '12', 'contempt, disrespect', null, null, [
        'Yamuvugishije agasuzuguro.',
        'He or she spoke to him or her with contempt.',
      ]),
      n('impungenge', '9/10', 'worry, concern', 'impungenge', 'worries', [
        'Mfite impungenge z’ikizamini.',
        "I'm worried about the exam.",
      ]),
      n('irungu', '5', 'loneliness, boredom', null, null, [
        'Iyo ndi jyenyine ngira irungu.',
        'When I am alone I feel lonely.',
      ]),
      n('ishema', '5', 'pride (in something good)', null, null, [
        'Dufite ishema ry’igihugu cyacu.',
        'We are proud of our country.',
      ]),
      n('ipfunwe', '5', 'embarrassment', null, null, [
        'Yagize ipfunwe.',
        'He or she was embarrassed.',
      ]),
      v('guhangayika', 'hangayik', 'to worry', 'worry', 'worries', [
        'Ntuhangayike, bizagenda neza.',
        "Don't worry, it will go well.",
      ]),
      v('kwicuza', 'icuz', 'to regret', 'regret', 'regrets', [
        'Nicuza ibyo navuze.',
        'I regret what I said.',
      ]),
      v('kwitonda', 'itond', 'to be careful, to take care', 'be careful', 'is careful', [
        'Witonde, umuhanda uranyerera.',
        'Be careful, the road is slippery.',
      ]),
      o('birashimishije', "that's nice, it's a pleasure", [
        'Birashimishije kukubona.',
        "It's nice to see you.",
      ]),
    ],
  },
  {
    topic: 'function',
    picturable: false,
    words: [
      o(
        'maze',
        'and then, so',
        ['Yariye maze araryama.', 'He or she ate and then went to bed.'],
        F,
      ),
      o('nyine', 'exactly, the very (one)', ['Ni we nyine.', "That's the very one."], F),
      o('erega', 'but, you see, after all', ['Erega nakubwiye!', 'But I told you!'], F),
      o(
        'harya',
        'by the way; remind me (when recalling)',
        ['Harya witwa nde?', "Sorry, what's your name again?"],
        F,
      ),
      o('iyaba', 'if only', ['Iyaba nari mfite amafaranga!', 'If only I had money!'], F),
      o('usibye', 'besides, except', ['Bose baje usibye Yohani.', 'They all came except John.'], F),
      o(
        'bitewe na',
        'because of, depending on',
        ['Igiciro gihinduka bitewe n’igihe.', 'The price changes depending on the season.'],
        F,
      ),
      o(
        'byanze bikunze',
        'no matter what, without fail',
        ['Nzaza byanze bikunze.', "I'll come no matter what."],
        F,
      ),
      o(
        'nk’aho',
        'as if',
        ['Avuga nk’aho ari umwarimu.', 'He or she talks as if he or she were the teacher.'],
        F,
      ),
      o(
        'ni yo mpamvu',
        "that's why",
        ['Imvura yaguye, ni yo mpamvu natinze.', "It rained, that's why I was late."],
        F,
      ),
      o(
        'kangahe',
        'how many times?',
        ['Wagiye i Huye kangahe?', 'How many times have you been to Huye?'],
        F,
      ),
      o(
        'uwuhe',
        'which (one)? (for a person, or a class 1 or 3 noun)',
        ['Ushaka uwuhe?', 'Which one do you want?'],
        F,
      ),
      o(
        'akenshi',
        'often, mostly',
        ['Akenshi tujya mu isoko ku wa gatandatu.', 'We mostly go to the market on Saturday.'],
        F,
      ),
    ],
  },

  // Ranks 1301 to 1400.
  {
    topic: 'school',
    picturable: true,
    words: [
      n('ingwa', '9/10', 'chalk', 'ingwa', 'pieces of chalk', [
        'Umwarimu yandika ku kibaho n’ingwa.',
        'The teacher writes on the board with chalk.',
      ]),
      n('impuzankano', '9/10', 'uniform', 'impuzankano', 'uniforms', [
        'Abanyeshuri bambara impuzankano.',
        'Pupils wear a uniform.',
      ]),
      n('ibahasha', '9/6', 'envelope', 'amabahasha', 'envelopes', [
        'Shyira ibaruwa mu ibahasha.',
        'Put the letter in the envelope.',
      ]),
      n('ikinyamakuru', '7/8', 'newspaper', 'ibinyamakuru', 'newspapers', [
        'Nsoma ikinyamakuru buri munsi.',
        'I read the newspaper every day.',
      ]),
      n('ifoto', '9/6', 'photo', 'amafoto', 'photos', [
        'Iyi foto ni nziza.',
        'This photo is nice.',
      ]),
      n('indangururamajwi', '9/10', 'loudspeaker', 'indangururamajwi', 'loudspeakers', [
        'Bavugira mu ndangururamajwi.',
        'They speak through a loudspeaker.',
      ]),
      n('ifishi', '9/6', 'form (to fill in)', 'amafishi', 'forms', [
        'Uzuza iyi fishi.',
        'Fill in this form.',
      ]),
      n(
        'umukono',
        '3/4',
        'signature',
        'imikono',
        'signatures',
        ['Shyira umukono wawe hano.', 'Put your signature here.'],
        ['work'],
      ),
      n(
        'kashe',
        '9/10',
        'rubber stamp, official stamp',
        'kashe',
        'stamps',
        ['Uru rupapuro rukeneye kashe.', 'This paper needs a stamp.'],
        ['work'],
      ),
      v('gucapa', 'cap', 'to print', 'print', 'prints', [
        'Capa iyi nyandiko.',
        'Print this document.',
      ]),
      v('gufotora', 'fotor', 'to take a photo (of)', 'take a photo', 'takes a photo', [
        'Reka ngufotore.',
        'Let me take your photo.',
      ]),
      v('kuzuza', 'uzuz', 'to fill (up, in)', 'fill', 'fills', [
        'Uzuza icupa amazi.',
        'Fill the bottle with water.',
      ]),
    ],
  },
  {
    topic: 'places',
    picturable: true,
    words: [
      n('umugabane', '3/4', 'continent; share', 'imigabane', 'continents; shares', [
        'Afurika ni umugabane munini.',
        'Africa is a big continent.',
      ]),
      n('Afurika', '9', 'Africa', null, null, [
        'U Rwanda ruri muri Afurika y’Iburasirazuba.',
        'Rwanda is in East Africa.',
      ]),
      n('Uburayi', '14', 'Europe', null, null, [
        'Yagiye kwiga i Burayi.',
        'He or she went to study in Europe.',
      ]),
      n('Amerika', '9', 'America', null, null, [
        'Murumuna we aba muri Amerika.',
        'His or her younger sibling lives in America.',
      ]),
      n('Uburundi', '14', 'Burundi', null, null, [
        'Uburundi buturanye n’u Rwanda.',
        'Burundi borders Rwanda.',
      ]),
      n('Ubugande', '14', 'Uganda', null, null, [
        'Twagiye i Bugande na bisi.',
        'We went to Uganda by bus.',
      ]),
      n('Tanzaniya', '9', 'Tanzania', null, null, [
        'Tanzaniya ifite inyanja.',
        'Tanzania has a coast.',
      ]),
      n('ivarisi', '9/6', 'suitcase', 'amavarisi', 'suitcases', [
        'Ivarisi yanjye iraremereye.',
        'My suitcase is heavy.',
      ]),
      n('viza', '9/10', 'visa', 'viza', 'visas', ['Nasabye viza.', 'I applied for a visa.']),
      n('perimi', '9/10', 'driving licence', 'perimi', 'driving licences', [
        'Afite perimi yo gutwara imodoka.',
        'He or she has a driving licence.',
      ]),
      v('kugonga', 'gong', 'to hit, to crash into (of a vehicle)', 'hit', 'hits', [
        'Imodoka yagonze igiti.',
        'The car hit a tree.',
      ]),
      o('ibumoso', 'on the left, left', ['Kata ibumoso.', 'Turn left.'], F),
      o('iburyo', 'on the right, right', ['Banki iri iburyo.', 'The bank is on the right.'], F),
    ],
  },
  {
    topic: 'health',
    picturable: true,
    words: [
      n('inkoni', '9/10', 'walking stick, stick', 'inkoni', 'sticks', [
        'Sogokuru agenda yitwaje inkoni.',
        'Grandfather walks with a stick.',
      ]),
      n('ingobyi', '9/10', 'stretcher; baby sling', 'ingobyi', 'stretchers', [
        'Bamutwaye mu ngobyi.',
        'They carried him or her on a stretcher.',
      ]),
      n('ikibyimba', '7/8', 'swelling, lump, tumour', 'ibibyimba', 'swellings', [
        'Afite ikibyimba ku kuboko.',
        'He or she has a swelling on the arm.',
      ]),
      n('itabi', '5/6', 'tobacco, cigarette', 'amatabi', 'cigarettes', [
        'Itabi ryangiza ubuzima.',
        'Smoking harms your health.',
      ]),
      n('agakoko', '12/13', 'germ; small insect', 'udukoko', 'germs', [
        'Udukoko dutera indwara.',
        'Germs cause disease.',
      ]),
      n('agakingirizo', '12/13', 'condom', 'udukingirizo', 'condoms', [
        'Agakingirizo karinda SIDA.',
        'A condom protects against AIDS.',
      ]),
      n('igipimo', '7/8', 'measurement; (medical) test', 'ibipimo', 'measurements; tests', [
        'Muganga yafashe ibipimo by’amaraso.',
        'The doctor took blood tests.',
      ]),
      n('ibitotsi', '8', 'sleepiness, sleep', null, null, ['Mfite ibitotsi.', "I'm sleepy."]),
      n('isereri', '9', 'dizziness', null, null, ['Yumva isereri.', 'He or she feels dizzy.']),
      v('gukomereka', 'komerek', 'to get hurt, to be injured', 'get hurt', 'gets hurt', [
        'Yakomeretse mu mpanuka.',
        'He or she was injured in an accident.',
      ]),
      v('kubaga', 'bag', 'to operate on; to slaughter', 'operate on', 'operates on', [
        'Muganga yaramubaze.',
        'The doctor operated on him or her.',
      ]),
      v('gutwita', 'twit', 'to be pregnant', 'be pregnant', 'is pregnant', [
        'Aratwite.',
        'She is pregnant.',
      ]),
    ],
  },
  {
    topic: 'people',
    picturable: false,
    words: [
      n('igikomangoma', '7/8', 'prince', 'ibikomangoma', 'princes', [
        'Igikomangoma cyasuye u Rwanda.',
        'The prince visited Rwanda.',
      ]),
      n('umusifuzi', '1/2', 'referee', 'abasifuzi', 'referees', [
        'Umusifuzi yavugije ifirimbi.',
        'The referee blew the whistle.',
      ]),
      n('umugaragu', '1/2', 'servant', 'abagaragu', 'servants', [
        'Umwami yari afite abagaragu benshi.',
        'The king had many servants.',
      ]),
      n('umusizi', '1/2', 'poet', 'abasizi', 'poets', [
        'Umusizi yahimbye igisigo.',
        'The poet composed a poem.',
      ]),
      n('umukorerabushake', '1/2', 'volunteer', 'abakorerabushake', 'volunteers', [
        'Abakorerabushake bafasha abarwayi.',
        'Volunteers help the sick.',
      ]),
      n('umufatanyabikorwa', '1/2', 'partner (in work)', 'abafatanyabikorwa', 'partners', [
        'Ni umufatanyabikorwa wacu.',
        'He or she is our partner.',
      ]),
      n('impuguke', '9/10', 'expert, specialist', 'impuguke', 'experts', [
        'Impuguke zatanze inama.',
        'The experts gave advice.',
      ]),
      n('umuvugizi', '1/2', 'spokesperson', 'abavugizi', 'spokespeople', [
        'Umuvugizi wa polisi yavuze.',
        'The police spokesperson spoke.',
      ]),
      n('umuyoboke', '1/2', 'follower, member', 'abayoboke', 'followers', [
        'Ni umuyoboke w’iryo dini.',
        'He or she is a follower of that religion.',
      ]),
      n('umwimukira', '1/2', 'migrant, immigrant', 'abimukira', 'migrants', [
        'Abimukira benshi baba mu mujyi.',
        'Many migrants live in the city.',
      ]),
      v('gutumira', 'tumir', 'to invite', 'invite', 'invites', [
        'Ndagutumiye mu bukwe bwanjye.',
        "I'm inviting you to my wedding.",
      ]),
      v('gushyigikira', 'shyigikir', 'to support', 'support', 'supports', [
        'Turagushyigikiye.',
        'We support you.',
      ]),
    ],
  },
  {
    topic: 'work',
    picturable: false,
    words: [
      n('ubushomeri', '14', 'unemployment', null, null, [
        'Ubushomeri bwiyongereye.',
        'Unemployment has risen.',
      ]),
      n('umushoramari', '1/2', 'investor', 'abashoramari', 'investors', [
        'Umushoramari yubatse uruganda.',
        'An investor built a factory.',
      ]),
      n('koperative', '9/10', 'cooperative', 'koperative', 'cooperatives', [
        'Abahinzi bibumbiye muri koperative.',
        'The farmers have formed a cooperative.',
      ]),
      n('serivisi', '9/10', 'service', 'serivisi', 'services', [
        'Iyi resitora itanga serivisi nziza.',
        'This restaurant gives good service.',
      ]),
      n('ikoranabuhanga', '5', 'technology', null, null, [
        'Ikoranabuhanga rirafasha cyane.',
        'Technology helps a lot.',
      ]),
      n('interineti', '9', 'internet', null, null, [
        'Interineti irihuta hano.',
        'The internet is fast here.',
      ]),
      n('imeyili', '9/10', 'email', 'imeyili', 'emails', [
        'Unyoherereze imeyili.',
        'Send me an email.',
      ]),
      n('porogaramu', '9/10', 'programme; app', 'porogaramu', 'programmes; apps', [
        'Shyira iyi porogaramu muri telefoni.',
        'Put this app on your phone.',
      ]),
      n('pansiyo', '9', 'pension', null, null, [
        'Sogokuru abona pansiyo.',
        'Grandfather gets a pension.',
      ]),
      n('umusanzu', '3/4', 'contribution', 'imisanzu', 'contributions', [
        'Buri wese yatanze umusanzu.',
        'Everyone made a contribution.',
      ]),
      n('igikorwa', '7/8', 'act, activity, deed', 'ibikorwa', 'activities', [
        'Ni igikorwa cyiza.',
        "It's a good deed.",
      ]),
      n('irushanwa', '5/6', 'competition, contest', 'amarushanwa', 'competitions', [
        'Yatsinze irushanwa.',
        'He or she won the competition.',
      ]),
      v('gushora', 'shor', 'to invest', 'invest', 'invests', [
        'Yashoye amafaranga mu buhinzi.',
        'He or she invested money in farming.',
      ]),
      v('kwamamaza', 'amamaz', 'to advertise', 'advertise', 'advertises', [
        'Bamamaza ibicuruzwa kuri radiyo.',
        'They advertise products on the radio.',
      ]),
    ],
  },
  {
    topic: 'government',
    picturable: false,
    words: [
      n('Jenoside', '9', 'genocide', null, null, [
        'Twibuka abazize Jenoside yakorewe Abatutsi.',
        'We remember the victims of the Genocide against the Tutsi.',
      ]),
      n('ubwigenge', '14', 'independence', null, null, [
        'U Rwanda rwabonye ubwigenge mu 1962.',
        'Rwanda gained independence in 1962.',
      ]),
      n('demokarasi', '9', 'democracy', null, null, [
        'Demokarasi ishingiye ku matora.',
        'Democracy is based on elections.',
      ]),
      n('umusenateri', '1/2', 'senator', 'abasenateri', 'senators', [
        'Umusenateri yasuye akarere kacu.',
        'A senator visited our district.',
      ]),
      n('itangazo', '5/6', 'announcement, notice', 'amatangazo', 'announcements', [
        'Soma itangazo.',
        'Read the announcement.',
      ]),
      n('umwanzuro', '3/4', 'conclusion, resolution', 'imyanzuro', 'resolutions', [
        'Inama yafashe imyanzuro.',
        'The meeting passed resolutions.',
      ]),
      n('imibereho', '4', 'way of life, living conditions', null, null, [
        'Imibereho y’abaturage yarahindutse.',
        "People's living conditions have changed.",
      ]),
      n('ihohoterwa', '5', 'abuse, violence', null, null, [
        'Ihohoterwa rirahanwa.',
        'Abuse is punished.',
      ]),
      n('uburinganire', '14', 'equality (of women and men)', null, null, [
        'Uburinganire ni ingenzi.',
        'Gender equality is important.',
      ]),
      n(
        'umuco',
        '3/4',
        'culture; custom',
        'imico',
        'cultures; customs',
        ['Umuco nyarwanda urakungahaye.', 'Rwandan culture is rich.'],
        ['people'],
      ),
      v('gushinja', 'shinj', 'to accuse', 'accuse', 'accuses', [
        'Bamushinja ubujura.',
        'They accuse him or her of theft.',
      ]),
      v('kugenzura', 'genzur', 'to inspect, to check', 'inspect', 'inspects', [
        'Polisi igenzura imodoka.',
        'The police check vehicles.',
      ]),
      v('gutangaza', 'tangaz', 'to announce; to amaze', 'announce', 'announces', [
        'Leta yatangaje itegeko rishya.',
        'The government announced a new law.',
      ]),
    ],
  },
  {
    topic: 'church',
    picturable: false,
    words: [
      n('umutagatifu', '1/2', 'saint', 'abatagatifu', 'saints', [
        'Petero ni umutagatifu.',
        'Peter is a saint.',
      ]),
      n('Bikira Mariya', '1', 'the Virgin Mary', null, null, [
        'Bikira Mariya ni nyina wa Yesu.',
        'The Virgin Mary is the mother of Jesus.',
      ]),
      n('Ivanjili', '9/6', 'Gospel', 'Amavanjili', 'Gospels', [
        'Twasomye Ivanjili ya Yohani.',
        "We read John's Gospel.",
      ]),
      n('Zaburi', '9/10', 'psalm', 'Zaburi', 'psalms', [
        'Twasomye Zaburi ya 23.',
        'We read Psalm 23.',
      ]),
      n('paradizo', '9', 'paradise', null, null, [
        'Paradizo ni ahantu heza.',
        'Paradise is a beautiful place.',
      ]),
      n('imperuka', '9', 'the end of the world', null, null, [
        'Nta muntu uzi igihe cy’imperuka.',
        'No one knows when the end of the world will be.',
      ]),
      n('ubuhamya', '14', 'testimony', null, null, [
        'Yatanze ubuhamya mu rusengero.',
        'He or she gave a testimony in church.',
      ]),
      n('Umuremyi', '1', 'the Creator', null, null, [
        'Imana ni Umuremyi w’isi.',
        'God is the Creator of the world.',
      ]),
      n('igisibo', '7', 'Lent; a fast', null, null, [
        'Igisibo kimara iminsi mirongo ine.',
        'Lent lasts forty days.',
      ]),
      v('kuramya', 'ramy', 'to worship', 'worship', 'worships', [
        'Turamya Imana.',
        'We worship God.',
      ]),
      v('gucungura', 'cungur', 'to redeem, to save', 'redeem', 'redeems', [
        'Yesu yaducunguye.',
        'Jesus redeemed us.',
      ]),
      o('Haleluya', 'hallelujah', ['Haleluya, Imana ishimwe!', 'Hallelujah, praise God!']),
    ],
  },
  {
    topic: 'function',
    picturable: false,
    words: [
      o(
        'uyu',
        'this (person, or a class 1 or 3 noun)',
        ['Uyu ni murumuna wanjye.', 'This is my younger brother or sister.'],
        F,
      ),
      o('ibi', 'these (things)', ['Ibi ni ibiki?', 'What are these?'], F),
      o('ibyo', 'those (things), that', ['Ibyo ni ukuri.', "That's true."], F),
      o(
        'ubwe',
        'himself, herself (in person)',
        ['Yabikoze ubwe.', 'He or she did it personally.'],
        F,
      ),
      o('mbega', 'what a …!, how …!', ['Mbega byiza!', 'How lovely!'], F),
      o('ngombwa', 'necessary', ['Ni ngombwa kwiga.', 'It is necessary to study.'], F),
      o(
        'ingenzi',
        'important, essential',
        ['Amazi ni ingenzi mu buzima.', 'Water is essential for life.'],
        F,
      ),
      o(
        'rusange',
        'general, common (to all)',
        ['Inama rusange ni ejo.', 'The general meeting is tomorrow.'],
        F,
      ),
      o(
        'mpuzamahanga',
        'international',
        ['Ni ikibuga cy’indege mpuzamahanga.', "It's an international airport."],
        F,
      ),
      o(
        'byibuze',
        'at least',
        ['Nywa byibuze litiro imwe y’amazi.', 'Drink at least one litre of water.'],
        F,
      ),
      o(
        'mu gihe',
        'while, when',
        ['Mu gihe imvura igwa, tuguma mu nzu.', 'While it rains, we stay indoors.'],
        F,
      ),
      o('bwite', 'own, personal', ['Ni inzu ye bwite.', "It's his or her own house."], F),
    ],
  },

  // Ranks 1401 to 1500.
  {
    topic: 'people',
    picturable: true,
    words: [
      n('televiziyo', '9/10', 'television', 'televiziyo', 'televisions', [
        'Tureba televiziyo nimugoroba.',
        'We watch television in the evening.',
      ]),
      n('radiyo', '9/10', 'radio', 'radiyo', 'radios', [
        'Numva amakuru kuri radiyo.',
        'I listen to the news on the radio.',
      ]),
      n('filime', '9/6', 'film', 'amafilime', 'films', [
        'Twarebye filime nziza.',
        'We watched a good film.',
      ]),
      n('umuziki', '3', 'music', null, null, [
        'Akunda umuziki nyarwanda.',
        'He or she loves Rwandan music.',
      ]),
      n('igitaramo', '7/8', 'concert, evening of music and dance', 'ibitaramo', 'concerts', [
        'Hari igitaramo kuri uyu wa gatandatu.',
        "There's a concert this Saturday.",
      ]),
      n('ikinamico', '7/8', 'play, drama', 'ibinamico', 'plays', [
        'Twumva ikinamico kuri radiyo.',
        'We listen to a radio drama.',
      ]),
      n('kamera', '9/10', 'camera', 'kamera', 'cameras', [
        'Iyi kamera ifata amafoto meza.',
        'This camera takes good photos.',
      ]),
      n('sinema', '9/10', 'cinema', 'sinema', 'cinemas', [
        'Twagiye kuri sinema.',
        'We went to the cinema.',
      ]),
      n('batiri', '9/10', 'battery', 'batiri', 'batteries', [
        'Batiri ya telefoni yashize.',
        'The phone battery is flat.',
      ]),
      n('insinga', '9/10', 'wire, cable', 'insinga', 'wires', [
        'Ntukore ku nsinga.',
        "Don't touch the wire.",
      ]),
      n('urubuga', '11/10', 'website; open space', 'imbuga', 'websites', [
        'Sura urubuga rwacu.',
        'Visit our website.',
      ]),
      v('gucomeka', 'comek', 'to plug in', 'plug in', 'plugs in', [
        'Comeka telefoni.',
        'Plug in the phone.',
      ]),
      v('kwidagadura', 'idagadur', 'to relax, to have fun', 'relax', 'relaxes', [
        'Ku cyumweru turidagadura.',
        'On Sunday we relax and have fun.',
      ]),
    ],
  },
  {
    topic: 'places',
    picturable: true,
    words: [
      n('inkombe', '9/10', 'shore, bank', 'inkombe', 'shores', [
        'Twicaye ku nkombe y’ikiyaga.',
        'We sat on the lakeshore.',
      ]),
      n('ubutayu', '14', 'desert', null, null, [
        'Mu butayu nta mazi ahari.',
        'There is no water in the desert.',
      ]),
      n('agasantere', '12/13', 'small trading centre', 'udusantere', 'trading centres', [
        'Duhahira ku gasantere.',
        'We shop at the little trading centre.',
      ]),
      n('agace', '12/13', 'area, neighbourhood; piece', 'uduce', 'areas', [
        'Atuye mu gace kacu.',
        'He or she lives in our area.',
      ]),
      n('kaburimbo', '9', 'tarmac, paved road', null, null, [
        'Bashyize kaburimbo mu muhanda.',
        'They have tarmacked the road.',
      ]),
      n('ubuso', '14', 'area, surface', null, null, [
        'Ubuso bw’u Rwanda ni buto.',
        "Rwanda's area is small.",
      ]),
      n('amajyaruguru', '6', 'north', null, null, [
        'Musanze iri mu Majyaruguru.',
        'Musanze is in the North.',
      ]),
      n('amajyepfo', '6', 'south', null, null, ['Huye iri mu Majyepfo.', 'Huye is in the South.']),
      n('uburasirazuba', '14', 'east', null, null, [
        'Izuba rirasira iburasirazuba.',
        'The sun rises in the east.',
      ]),
      n('uburengerazuba', '14', 'west', null, null, [
        'Izuba rirengera iburengerazuba.',
        'The sun sets in the west.',
      ]),
      n('icyerekezo', '7/8', 'direction; vision', 'ibyerekezo', 'directions', [
        'Nyereka icyerekezo.',
        'Show me the direction.',
      ]),
      n('uruzinduko', '11/10', 'visit', 'inzinduko', 'visits', [
        'Perezida yagiriye uruzinduko i Huye.',
        'The president made a visit to Huye.',
      ]),
      v('guhunga', 'hung', 'to flee', 'flee', 'flees', [
        'Bahunze intambara.',
        'They fled the war.',
      ]),
    ],
  },
  {
    topic: 'health',
    picturable: false,
    words: [
      n('kanseri', '9', 'cancer', null, null, [
        'Kanseri ivuwe kare irakira.',
        'Cancer treated early can be cured.',
      ]),
      n('diyabete', '9', 'diabetes', null, null, [
        'Diyabete iterwa n’isukari nyinshi mu maraso.',
        'Diabetes comes from too much sugar in the blood.',
      ]),
      n('icyorezo', '7/8', 'epidemic', 'ibyorezo', 'epidemics', [
        'Icyorezo cyakwiriye hose.',
        'The epidemic spread everywhere.',
      ]),
      n('virusi', '9/10', 'virus', 'virusi', 'viruses', [
        'Virusi itera ibicurane.',
        'A virus causes flu.',
      ]),
      n('SIDA', '9', 'AIDS', null, null, ['Twirinde SIDA.', "Let's protect ourselves from AIDS."]),
      n('uburozi', '14', 'poison', null, null, ['Uburozi bwica.', 'Poison kills.']),
      n('ubumuga', '14', 'disability', null, null, [
        'Afite ubumuga bwo kutabona.',
        'He or she is visually impaired.',
      ]),
      n('ihungabana', '5', 'trauma', null, null, [
        'Ihungabana riravurwa.',
        'Trauma can be treated.',
      ]),
      n('igicuri', '7', 'epilepsy', null, null, [
        'Igicuri ni indwara yo mu bwonko.',
        'Epilepsy is a disorder of the brain.',
      ]),
      n('ikiyobyabwenge', '7/8', 'drug (narcotic)', 'ibiyobyabwenge', 'drugs', [
        'Ibiyobyabwenge byangiza urubyiruko.',
        'Drugs harm young people.',
      ]),
      v('kwita', 'it', 'to look after (kwita ku)', 'look after', 'looks after', [
        'Yita ku barwayi.',
        'He or she looks after the sick.',
      ]),
      v('kunanuka', 'nanuk', 'to lose weight, to get thin', 'lose weight', 'loses weight', [
        'Yarananutse cyane.',
        'He or she has lost a lot of weight.',
      ]),
    ],
  },
  {
    topic: 'shopping',
    picturable: false,
    words: [
      n('umutungo', '3/4', 'property, assets', 'imitungo', 'properties', [
        'Iyi nzu ni umutungo we.',
        'This house is his or her property.',
      ]),
      n('ubwishingizi', '14', 'insurance', null, null, [
        'Imodoka ifite ubwishingizi.',
        'The car is insured.',
      ]),
      n('uburiganya', '14', 'fraud, cheating', null, null, ['Ni uburiganya.', "That's a scam."]),
      n('urutonde', '11/10', 'list', 'intonde', 'lists', [
        'Andika urutonde rw’ibyo tugura.',
        "Write a list of what we're buying.",
      ]),
      n('igiteranyo', '7/8', 'total, sum', 'ibiteranyo', 'totals', [
        'Igiteranyo ni amafaranga ibihumbi bitanu.',
        'The total is five thousand francs.',
      ]),
      n('inkunga', '9/10', 'aid, support, donation', 'inkunga', 'donations', [
        'Twahawe inkunga.',
        'We received aid.',
      ]),
      n('agahimbazamusyi', '12/13', 'bonus, incentive', 'uduhimbazamusyi', 'bonuses', [
        'Abakozi bahawe agahimbazamusyi.',
        'The workers were given a bonus.',
      ]),
      n('ubuziranenge', '14', 'quality (standard)', null, null, [
        'Ibi bicuruzwa bifite ubuziranenge.',
        'These goods are of good quality.',
      ]),
      n('akamaro', '12', 'use, usefulness, importance', null, null, [
        'Iki gikoresho gifite akamaro.',
        'This tool is useful.',
      ]),
      v('kugereranya', 'gererany', 'to compare', 'compare', 'compares', [
        'Gereranya ibiciro mbere yo kugura.',
        'Compare prices before buying.',
      ]),
      v('kongera', 'onger', 'to add, to increase; to do again', 'add', 'adds', [
        'Ibiciro byongeye kuzamuka.',
        'Prices have gone up again.',
      ]),
      v('kurangura', 'rangur', 'to buy stock (wholesale)', 'buy stock', 'buys stock', [
        'Arangura ibicuruzwa i Kigali.',
        'He or she buys stock in Kigali.',
      ]),
    ],
  },
  {
    topic: 'school',
    picturable: false,
    words: [
      n('inkuru', '9/10', 'story; news', 'inkuru', 'stories', [
        'Sogokuru atubwira inkuru.',
        'Grandfather tells us stories.',
      ]),
      n('umugani', '3/4', 'proverb; folk tale', 'imigani', 'proverbs', [
        'Abanyarwanda bafite imigani myinshi.',
        'Rwandans have many proverbs.',
      ]),
      n('ubuvanganzo', '14', 'literature', null, null, [
        'Yiga ubuvanganzo nyarwanda.',
        'He or she studies Rwandan literature.',
      ]),
      n('interuro', '9/10', 'sentence', 'interuro', 'sentences', [
        'Andika interuro eshatu.',
        'Write three sentences.',
      ]),
      n('imvugo', '9/10', 'way of speaking, expression', 'imvugo', 'expressions', [
        'Iyo ni imvugo nziza.',
        "That's a nice expression.",
      ]),
      n('ikibonezamvugo', '7', 'grammar', null, null, [
        'Ikibonezamvugo cy’Ikinyarwanda kiragoye.',
        'Kinyarwanda grammar is difficult.',
      ]),
      n('urugero', '11/10', 'example; measure', 'ingero', 'examples', [
        'Tanga urugero.',
        'Give an example.',
      ]),
      n('igisobanuro', '7/8', 'meaning, explanation', 'ibisobanuro', 'meanings', [
        'Iri jambo rifite ibisobanuro bibiri.',
        'This word has two meanings.',
      ]),
      n('ubushakashatsi', '14', 'research', null, null, [
        'Akora ubushakashatsi kuri malariya.',
        'He or she is doing research on malaria.',
      ]),
      n('amahugurwa', '6', 'training (course), workshop', null, null, [
        'Abarimu bari mu mahugurwa.',
        'The teachers are on a training course.',
      ]),
      n('siyansi', '9', 'science', null, null, ['Akunda siyansi.', 'He or she likes science.']),
      v('gusesengura', 'sesengur', 'to analyse', 'analyse', 'analyses', [
        'Sesengura iyi nkuru.',
        'Analyse this story.',
      ]),
      v('gutoranya', 'torany', 'to choose, to select', 'choose', 'chooses', [
        'Toranya igisubizo nyacyo.',
        'Choose the right answer.',
      ]),
    ],
  },
  {
    topic: 'feelings',
    picturable: false,
    words: [
      n('ubucuti', '14', 'friendship', null, null, [
        'Ubucuti bwacu bumaze imyaka myinshi.',
        'Our friendship has lasted many years.',
      ]),
      n('ubugome', '14', 'cruelty', null, null, [
        'Ubugome bwe bwatangaje abantu.',
        'His or her cruelty shocked people.',
      ]),
      n('ubuhemu', '14', 'betrayal, disloyalty', null, null, [
        'Ubuhemu bwangiza ubucuti.',
        'Betrayal ruins friendship.',
      ]),
      n('inzika', '9/10', 'grudge', 'inzika', 'grudges', [
        'Ntukagire inzika.',
        "Don't bear grudges.",
      ]),
      n('urwikekwe', '11', 'suspicion, distrust', null, null, [
        'Hari urwikekwe hagati yabo.',
        'There is distrust between them.',
      ]),
      n('ubwuzu', '14', 'affection, warmth', null, null, [
        'Yanyakiranye ubwuzu.',
        'He or she welcomed me with affection.',
      ]),
      n('umuhate', '3', 'determination, effort', null, null, [
        'Yize afite umuhate.',
        'He or she studied with determination.',
      ]),
      n('ubushishozi', '14', 'good judgement, discernment', null, null, [
        'Fata icyemezo ufite ubushishozi.',
        'Make the decision with good judgement.',
      ]),
      n('inyangamugayo', '9/10', 'person of integrity', 'inyangamugayo', 'people of integrity', [
        'Ni inyangamugayo.',
        'He or she is a person of integrity.',
      ]),
      n('amahane', '6', 'quarrelling, aggression', null, null, [
        'Ntukagire amahane.',
        "Don't be quarrelsome.",
      ]),
      v('kurambirwa', 'rambirw', 'to be fed up, to be bored', 'be fed up', 'is fed up', [
        'Ndambiwe gutegereza.',
        "I'm tired of waiting.",
      ]),
      v('kwinuba', 'inub', 'to grumble, to complain', 'grumble', 'grumbles', [
        'Ahora yinuba.',
        'He or she is always grumbling.',
      ]),
    ],
  },
  {
    topic: 'government',
    picturable: false,
    words: [
      n(
        'umwunganizi',
        '1/2',
        'lawyer, advocate',
        'abunganizi',
        'lawyers',
        ['Afite umwunganizi mu mategeko.', 'He or she has a lawyer.'],
        ['work'],
      ),
      n('umurage', '3/4', 'inheritance, heritage', 'imirage', 'inheritances', [
        'Umuco ni umurage wacu.',
        'Culture is our heritage.',
      ]),
      n('intwaro', '9/10', 'weapon', 'intwaro', 'weapons', [
        'Abasirikare bafite intwaro.',
        'The soldiers have weapons.',
      ]),
      n('isasu', '5/6', 'bullet', 'amasasu', 'bullets; gunshots', [
        'Twumvise amasasu.',
        'We heard gunshots.',
      ]),
      n('ubwicanyi', '14', 'killing, murder', null, null, [
        'Ubwicanyi buhanwa n’amategeko.',
        'Murder is punished by law.',
      ]),
      n('iterabwoba', '5', 'terrorism', null, null, [
        'Iterabwoba ni ikibazo ku isi yose.',
        'Terrorism is a problem for the whole world.',
      ]),
      n('ikiza', '7/8', 'disaster', 'ibiza', 'disasters', [
        'Ibiza byangije amazu.',
        'The disasters destroyed houses.',
      ]),
      n('ubwenegihugu', '14', 'citizenship, nationality', null, null, [
        'Afite ubwenegihugu bw’u Rwanda.',
        'He or she has Rwandan citizenship.',
      ]),
      n('ihame', '5/6', 'principle', 'amahame', 'principles', [
        'Iri ni ihame ry’ingenzi.',
        'This is an important principle.',
      ]),
      n('ubukangurambaga', '14', 'awareness campaign', null, null, [
        'Hari ubukangurambaga bwo kwirinda malariya.',
        "There's a campaign on preventing malaria.",
      ]),
      v('gutabara', 'tabar', 'to come to the rescue, to help', 'rescue', 'rescues', [
        'Polisi yaje gutabara.',
        'The police came to help.',
      ]),
      v('guhagarika', 'hagarik', 'to stop, to suspend', 'stop', 'stops', [
        'Bahagaritse imodoka.',
        'They stopped the car.',
      ]),
      v('kugena', 'gen', 'to set, to decide (on)', 'set', 'sets', [
        'Leta yagennye igiciro.',
        'The government set the price.',
      ]),
    ],
  },
  {
    topic: 'function',
    picturable: false,
    words: [
      n('uburyo', '14', 'way, means, method', null, null, [
        'Nta buryo bwo kugenda.',
        "There's no way to get there.",
      ]),
      n('ubwoko', '14/6', 'kind, type', 'amoko', 'kinds', [
        'Ni ubuhe bwoko bw’ikawa?',
        'What kind of coffee is it?',
      ]),
      n('ingaruka', '9/10', 'consequence, effect', 'ingaruka', 'consequences', [
        'Itabi rigira ingaruka mbi.',
        'Smoking has bad effects.',
      ]),
      n('ikimenyetso', '7/8', 'sign; symptom', 'ibimenyetso', 'signs', [
        'Umuriro ni ikimenyetso cya malariya.',
        'Fever is a sign of malaria.',
      ]),
      v('gushobora', 'shobor', 'can, to be able to', 'can', 'can', [
        'Ushobora kumfasha?',
        'Can you help me?',
      ]),
      v('gukenera', 'kener', 'to need', 'need', 'needs', ['Nkeneye amazi.', 'I need water.']),
      o('hari', 'there is, there are', ['Hari ikibazo?', 'Is there a problem?'], F),
      o('gake', 'rarely, seldom', ['Ajya i Kigali gake.', 'He or she rarely goes to Kigali.'], F),
      o(
        'ukuntu',
        'how, the way (that)',
        ['Sinzi ukuntu byagenze.', "I don't know how it happened."],
        F,
      ),
      o('ntaho', 'nowhere', ['Ntaho ngiye.', "I'm not going anywhere."], F),
      o(
        'ni ukuvuga',
        'that is to say, in other words',
        ['Ejo, ni ukuvuga ku wa mbere.', 'Tomorrow, that is to say Monday.'],
        F,
      ),
      o(
        'bukeye',
        'the next day',
        ['Bukeye bwaho twagiye i Huye.', 'The next day we went to Huye.'],
        F,
      ),
    ],
  },
];
