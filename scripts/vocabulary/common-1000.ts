// Common 1200, first part: ranks 801 to 1000, in clusters, drafted like Common 500 (see
// common-500.ts). These lean to more specific words for adult life (work, government, health,
// church, school, money, travel and feelings), avoid every word in Common 800, and picturable
// clusters lead each hundred.
//
// AI DRAFT. Written by Claude, not yet checked by a native speaker.

import { n, o, v, type Cluster } from './words.ts';

const F = ['function'];

export const COMMON_1000: Cluster[] = [
  // Ranks 801 to 900.
  {
    topic: 'house',
    picturable: true,
    words: [
      n('isafuriya', '9/6', 'cooking pot, pan', 'amasafuriya', 'pots, pans', [
        'Shyira isafuriya ku muriro.',
        'Put the pot on the fire.',
      ]),
      n('akabati', '12/13', 'cupboard', 'utubati', 'cupboards', [
        'Ibikombe biri mu kabati.',
        'The cups are in the cupboard.',
      ]),
      n('igikari', '7/8', 'backyard', 'ibikari', 'backyards', [
        'Abana bakinira mu gikari.',
        'The children play in the backyard.',
      ]),
      n('itapi', '9/6', 'carpet, rug', 'amatapi', 'carpets', [
        'Itapi irimo umukungugu.',
        'The carpet is dusty.',
      ]),
      n('ipasi', '9/6', 'iron (for clothes)', 'amapasi', 'irons', [
        'Ipasi irashyushye.',
        'The iron is hot.',
      ]),
      n('imbabura', '9/10', 'charcoal stove', 'imbabura', 'charcoal stoves', [
        'Duteka ku mbabura.',
        'We cook on a charcoal stove.',
      ]),
      n('amakara', '6', 'charcoal', null, null, [
        'Gura amakara ku isoko.',
        'Buy charcoal at the market.',
      ]),
      n('urukwi', '11/10', 'piece of firewood', 'inkwi', 'firewood', [
        'Bajya gutashya inkwi.',
        'They go to collect firewood.',
      ]),
      n('umwotsi', '3/4', 'smoke', 'imyotsi', 'smoke', [
        'Umwotsi uraturuka mu gikoni.',
        'Smoke is coming from the kitchen.',
      ]),
      n('amatafari', '6', 'bricks', null, null, [
        'Inzu yubatswe n’amatafari.',
        'The house is built of bricks.',
      ]),
      v('gucana', 'can', 'to light (a fire, a lamp)', 'light', 'lights', [
        'Cana itara, hari umwijima.',
        "Turn on the lamp, it's dark.",
      ]),
      v('kuzimya', 'zimy', 'to put out, to turn off', 'turn off', 'turns off', [
        'Zimya umuriro mbere yo kuryama.',
        'Turn off the light before going to bed.',
      ]),
      v('gukoropa', 'korop', 'to mop (the floor)', 'mop', 'mops', [
        'Ndakoropa inzu buri gitondo.',
        'I mop the house every morning.',
      ]),
    ],
  },
  {
    topic: 'shopping',
    picturable: true,
    words: [
      n('igikapu', '7/8', 'bag', 'ibikapu', 'bags', [
        'Igikapu cyanjye kirimo ibitabo.',
        'My bag has books in it.',
      ]),
      n('agaseke', '12/13', 'basket (with a lid)', 'uduseke', 'baskets', [
        'Agaseke ni impano nziza.',
        'A basket is a nice present.',
      ]),
      n('umuzigo', '3/4', 'load, luggage', 'imizigo', 'loads, luggage', [
        'Umuzigo wanjye uraremereye.',
        'My luggage is heavy.',
      ]),
      n('konti', '9/10', 'bank account', 'konti', 'accounts', [
        'Nafunguye konti muri banki.',
        'I opened an account at the bank.',
      ]),
      n('ubwishyu', '14', 'payment', null, null, [
        'Ubwishyu bukorwa kuri telefoni.',
        'Payment is made by phone.',
      ]),
      n('ubwizigame', '14', 'savings', null, null, [
        'Ubwizigame bufasha mu bihe bigoye.',
        'Savings help in hard times.',
      ]),
      n('inguzanyo', '9/10', 'loan, credit', 'inguzanyo', 'loans', [
        'Yasabye inguzanyo muri banki.',
        'He or she asked the bank for a loan.',
      ]),
      n('idolari', '5/6', 'dollar', 'amadolari', 'dollars', [
        'Idolari rimwe ni amafaranga angahe?',
        'How many francs is one dollar?',
      ]),
      n('imari', '9', 'wealth, capital, finances', null, null, [
        'Imari y’ikigo iriyongera.',
        "The company's capital is growing.",
      ]),
      v('guhaha', 'hah', 'to shop (for food and household things)', 'shop', 'shops', [
        'Tujya guhaha ku isoko ku wa gatandatu.',
        'We go shopping at the market on Saturday.',
      ]),
      v('kuvunja', 'vunj', 'to change money', 'change money', 'changes money', [
        'Nshaka kuvunja amadolari.',
        'I want to change dollars.',
      ]),
      v('kubitsa', 'bits', 'to deposit, to save (money)', 'save', 'saves', [
        'Arabitsa amafaranga buri kwezi.',
        'He or she saves money every month.',
      ]),
      v('gucuruza', 'curuz', 'to trade, to sell (as a business)', 'trade', 'trades', [
        'Acuruza imboga ku isoko.',
        'He or she sells vegetables at the market.',
      ]),
    ],
  },
  {
    topic: 'places',
    picturable: true,
    words: [
      n('moto', '9/10', 'motorbike, moto taxi', 'moto', 'motorbikes', [
        'Twateze moto tujya mu mujyi.',
        'We took a moto into town.',
      ]),
      n('tagisi', '9/10', 'taxi, minibus', 'tagisi', 'taxis', [
        'Tagisi ihagarara hano.',
        'The taxi stops here.',
      ]),
      n('ubwato', '14/6', 'boat', 'amato', 'boats', ['Twambutse mu bwato.', 'We crossed by boat.']),
      n('urugendo', '11/10', 'journey, trip', 'ingendo', 'journeys', [
        'Urugendo rwiza!',
        'Have a good trip!',
      ]),
      n('itike', '9/6', 'ticket', 'amatike', 'tickets', [
        'Naguze itike ya bisi.',
        'I bought a bus ticket.',
      ]),
      n('ikirwa', '7/8', 'island', 'ibirwa', 'islands', [
        'Hari ibirwa byinshi mu Kivu.',
        'There are many islands in Lake Kivu.',
      ]),
      n('pariki', '9/10', 'national park', 'pariki', 'national parks', [
        'Twasuye pariki y’Akagera.',
        'We visited Akagera park.',
      ]),
      n('parikingi', '9/10', 'car park, parking', 'parikingi', 'car parks', [
        'Parikingi yuzuye imodoka.',
        'The car park is full of cars.',
      ]),
      n('icyapa', '7/8', 'sign, signpost', 'ibyapa', 'signs', ['Soma icyapa.', 'Read the sign.']),
      v('gutega', 'teg', 'to catch (a bus or moto); to set (a trap)', 'catch', 'catches', [
        'Ntega bisi saa moya.',
        'I catch the bus at seven.',
      ]),
      v('kurara', 'rar', 'to spend the night', 'spend the night', 'spends the night', [
        'Turarara i Huye.',
        "We're spending the night in Huye.",
      ]),
      v('guhaguruka', 'haguruk', 'to set off; to stand up', 'set off', 'sets off', [
        'Bisi irahaguruka saa mbiri.',
        'The bus sets off at eight.',
      ]),
    ],
  },
  {
    topic: 'health',
    picturable: true,
    words: [
      n('urukingo', '11/10', 'vaccine', 'inkingo', 'vaccines', [
        'Abana bose bahawe urukingo.',
        'All the children got the vaccine.',
      ]),
      n('farumasi', '9/10', 'pharmacy', 'farumasi', 'pharmacies', [
        'Farumasi iri hafi y’ibitaro.',
        'The pharmacy is near the hospital.',
      ]),
      n('igisebe', '7/8', 'sore, ulcer', 'ibisebe', 'sores', [
        'Afite igisebe ku kuguru.',
        'He or she has a sore on the leg.',
      ]),
      n('inkovu', '9/10', 'scar', 'inkovu', 'scars', [
        'Afite inkovu ku kuboko.',
        'He or she has a scar on the arm.',
      ]),
      n('igituntu', '7', 'tuberculosis', null, null, [
        'Igituntu kiravurwa kigakira.',
        'Tuberculosis can be treated and cured.',
      ]),
      n('impiswi', '9', 'diarrhoea', null, null, [
        'Umwana arwaye impiswi.',
        'The child has diarrhoea.',
      ]),
      n('isesemi', '9', 'nausea', null, null, ['Mfite isesemi.', 'I feel sick (nauseous).']),
      n('ubuvuzi', '14', 'medical care, treatment', null, null, [
        'Ubuvuzi bwiza ni ingenzi.',
        'Good medical care is important.',
      ]),
      n('mituweli', '9', 'community health insurance', null, null, [
        'Wishyuye mituweli y’uyu mwaka?',
        "Have you paid this year's health insurance?",
      ]),
      n('ambulansi', '9/6', 'ambulance', 'amambulansi', 'ambulances', [
        'Hamagara ambulansi vuba!',
        'Call an ambulance quickly!',
      ]),
      v('kwivuza', 'ivuz', 'to get treatment, to see a doctor', 'get treatment', 'gets treatment', [
        'Ngiye kwivuza.',
        "I'm going to see a doctor.",
      ]),
      v('kuribwa', 'ribw', 'to ache, to be in pain', 'ache', 'aches', [
        'Ndaribwa n’umutwe.',
        'I have a headache.',
      ]),
    ],
  },
  {
    topic: 'work',
    picturable: false,
    words: [
      n('uruganda', '11/10', 'factory', 'inganda', 'factories', [
        'Akora mu ruganda rw’icyayi.',
        'He or she works in a tea factory.',
      ]),
      n('umukoro', '3/4', 'task; homework', 'imikoro', 'tasks', [
        'Nta mukoro mfite uyu munsi.',
        "I don't have homework today.",
      ]),
      n('ubunararibonye', '14', 'experience', null, null, [
        'Afite ubunararibonye bw’imyaka itanu.',
        'He or she has five years of experience.',
      ]),
      n('ikipe', '9/6', 'team', 'amakipe', 'teams', ['Ikipe yacu yatsinze.', 'Our team won.']),
      n('umunyamabanga', '1/2', 'secretary', 'abanyamabanga', 'secretaries', [
        'Baza umunyamabanga.',
        'Ask the secretary.',
      ]),
      n('umucungamari', '1/2', 'accountant', 'abacungamari', 'accountants', [
        'Umucungamari ari mu biro.',
        'The accountant is in the office.',
      ]),
      n('umukanishi', '1/2', 'mechanic', 'abakanishi', 'mechanics', [
        'Umukanishi arimo gukora imodoka.',
        'The mechanic is fixing the car.',
      ]),
      n('umuzamu', '1/2', 'guard, watchman', 'abazamu', 'guards', [
        'Umuzamu arinda irembo nijoro.',
        'The guard watches the gate at night.',
      ]),
      n('umucuzi', '1/2', 'blacksmith, metalworker', 'abacuzi', 'blacksmiths', [
        'Umucuzi akora amasuka.',
        'The blacksmith makes hoes.',
      ]),
      v('gukorera', 'korer', 'to work for', 'work for', 'works for', [
        'Nkorera ikigo cy’ubucuruzi.',
        'I work for a business.',
      ]),
      v('kwirukana', 'irukan', 'to dismiss, to chase away', 'dismiss', 'dismisses', [
        'Bamwirukanye ku kazi.',
        'They dismissed him or her from the job.',
      ]),
      v('gusinya', 'siny', 'to sign', 'sign', 'signs', ['Sinya hano.', 'Sign here.']),
    ],
  },
  {
    topic: 'government',
    picturable: false,
    words: [
      n('ubutegetsi', '14', 'government, authority', null, null, [
        'Ubutegetsi bwafashe icyemezo.',
        'The authorities made a decision.',
      ]),
      n('indangamuntu', '9/10', 'identity card', 'indangamuntu', 'identity cards', [
        'Erekana indangamuntu yawe.',
        'Show your identity card.',
      ]),
      n('ibendera', '5/6', 'flag', 'amabendera', 'flags', [
        'Ibendera ry’u Rwanda rifite amabara atatu.',
        "Rwanda's flag has three colours.",
      ]),
      n('umuganda', '3/4', 'community work day', 'imiganda', 'community work days', [
        'Umuganda ni ku wa gatandatu wa nyuma w’ukwezi.',
        'Umuganda is on the last Saturday of the month.',
      ]),
      n('urubanza', '11/10', 'court case, trial', 'imanza', 'court cases', [
        'Urubanza ruzaburanwa ejo.',
        'The case will be heard tomorrow.',
      ]),
      n('umucamanza', '1/2', 'judge', 'abacamanza', 'judges', [
        'Umucamanza yafashe umwanzuro.',
        'The judge reached a verdict.',
      ]),
      n('pasiporo', '9/6', 'passport', 'amapasiporo', 'passports', [
        'Nkeneye pasiporo nshya.',
        'I need a new passport.',
      ]),
      n('ubumwe', '14', 'unity', null, null, [
        'Ubumwe bw’Abanyarwanda ni ingenzi.',
        'The unity of Rwandans is important.',
      ]),
      n('igihano', '7/8', 'punishment, penalty', 'ibihano', 'punishments', [
        'Yahawe igihano.',
        'He or she was given a penalty.',
      ]),
      v('kwiyandikisha', 'iyandikish', 'to register, to sign up', 'register', 'registers', [
        'Ndashaka kwiyandikisha ku ishuri.',
        'I want to register at the school.',
      ]),
      v('kurinda', 'rind', 'to protect, to guard', 'protect', 'protects', [
        'Abapolisi barinda umutekano.',
        'The police keep the peace.',
      ]),
      v('guhana', 'han', 'to punish', 'punish', 'punishes', [
        'Itegeko rihana abajura.',
        'The law punishes thieves.',
      ]),
    ],
  },
  {
    topic: 'church',
    picturable: false,
    words: [
      n('idini', '5/6', 'religion', 'amadini', 'religions', [
        'Mu Rwanda hari amadini menshi.',
        'There are many religions in Rwanda.',
      ]),
      n('umupadiri', '1/2', 'priest', 'abapadiri', 'priests', [
        'Umupadiri yatanze inyigisho.',
        'The priest gave a sermon.',
      ]),
      n('umubikira', '1/2', 'nun', 'ababikira', 'nuns', [
        'Ababikira bita ku barwayi.',
        'The nuns care for the sick.',
      ]),
      n('Kristo', '1', 'Christ', null, null, ['Kristo ni Umwami.', 'Christ is King.']),
      n('Satani', '1', 'Satan', null, null, ['Yesu yatsinze Satani.', 'Jesus defeated Satan.']),
      n('ingoma', '9/10', 'kingdom; drum', 'ingoma', 'kingdoms; drums', [
        'Ingoma y’Imana iri hafi.',
        'The kingdom of God is near.',
      ]),
      n('igitangaza', '7/8', 'miracle, wonder', 'ibitangaza', 'miracles', [
        'Yesu yakoze ibitangaza byinshi.',
        'Jesus did many miracles.',
      ]),
      n('umuzuko', '3', 'resurrection', null, null, [
        'Pasika yibutsa umuzuko wa Yesu.',
        "Easter remembers Jesus' resurrection.",
      ]),
      n('ubugingo', '14', 'soul; (eternal) life', null, null, [
        'Yesu atanga ubugingo buhoraho.',
        'Jesus gives eternal life.',
      ]),
      n('korali', '9/6', 'choir', 'amakorali', 'choirs', [
        'Korali iraririmba neza.',
        'The choir sings well.',
      ]),
      v('guhimbaza', 'himbaz', 'to praise, to worship', 'praise', 'praises', [
        'Turahimbaza Imana.',
        'We praise God.',
      ]),
      v('kuzuka', 'zuk', 'to rise from the dead', 'rise', 'rises', [
        'Yesu yazutse ku munsi wa gatatu.',
        'Jesus rose on the third day.',
      ]),
      o('amina', 'amen', ['Mu izina rya Yesu, amina.', 'In the name of Jesus, amen.']),
    ],
  },
  {
    topic: 'feelings',
    picturable: false,
    words: [
      n('urukumbuzi', '11', 'longing, missing someone', null, null, [
        'Mfite urukumbuzi rw’umuryango wanjye.',
        'I miss my family.',
      ]),
      n('ishimwe', '5/6', 'thanks, gratitude; praise', 'amashimwe', 'thanks', [
        'Ishimwe ni iry’Imana.',
        'Thanks be to God.',
      ]),
      n('ubushake', '14', 'will, desire, willingness', null, null, [
        'Abikora ku bushake.',
        'He or she does it willingly.',
      ]),
      n('umwete', '3', 'zeal, hard work', null, null, [
        'Akora afite umwete.',
        'He or she works with zeal.',
      ]),
      n('ishyaka', '5', 'enthusiasm, drive', null, null, [
        'Yiga afite ishyaka.',
        'He or she studies with enthusiasm.',
      ]),
      n('ihumure', '5', 'comfort, consolation', null, null, [
        'Amagambo ye yampaye ihumure.',
        'His or her words comforted me.',
      ]),
      n('ishavu', '5', 'resentment, bitter sorrow', null, null, [
        'Yavuganye ishavu.',
        'He or she spoke with bitterness.',
      ]),
      n('ubutwari', '14', 'courage, bravery', null, null, [
        'Yagaragaje ubutwari.',
        'He or she showed courage.',
      ]),
      v('gukumbura', 'kumbur', 'to miss (someone or something)', 'miss', 'misses', [
        'Ndagukumbuye.',
        'I miss you.',
      ]),
      v('kwiheba', 'iheb', 'to despair, to lose hope', 'despair', 'despairs', [
        'Ntiwiheba, bizakunda.',
        "Don't lose hope, it will work out.",
      ]),
      v('kwifuza', 'ifuz', 'to wish, to desire', 'wish', 'wishes', [
        'Ndifuza kujya i Kigali.',
        'I wish to go to Kigali.',
      ]),
      v('gutungurwa', 'tungurw', 'to be surprised', 'be surprised', 'is surprised', [
        'Natunguwe n’iyo nkuru.',
        'I was surprised by that news.',
      ]),
      o('birababaje', "that's sad, I'm sorry", [
        'Birababaje kumva ko urwaye.',
        "I'm sorry to hear you're ill.",
      ]),
    ],
  },

  // Ranks 901 to 1000.
  {
    topic: 'animals',
    picturable: true,
    words: [
      n('inguge', '9/10', 'monkey', 'inguge', 'monkeys', [
        'Inguge ziri mu giti.',
        'The monkeys are in the tree.',
      ]),
      n('ingwe', '9/10', 'leopard', 'ingwe', 'leopards', [
        'Ingwe yihishe mu ishyamba.',
        'The leopard hid in the forest.',
      ]),
      n('imvubu', '9/10', 'hippopotamus', 'imvubu', 'hippos', [
        'Imvubu ziba mu kiyaga.',
        'Hippos live in the lake.',
      ]),
      n('impyisi', '9/10', 'hyena', 'impyisi', 'hyenas', [
        'Impyisi irya inyama.',
        'The hyena eats meat.',
      ]),
      n('ifarashi', '9/6', 'horse', 'amafarashi', 'horses', [
        'Ifarashi iriruka cyane.',
        'The horse runs fast.',
      ]),
      n('indogobe', '9/10', 'donkey', 'indogobe', 'donkeys', [
        'Indogobe yikorera imizigo.',
        'The donkey carries loads.',
      ]),
      n('isake', '9/10', 'rooster', 'isake', 'roosters', [
        'Isake ibika mu gitondo.',
        'The rooster crows in the morning.',
      ]),
      n('inuma', '9/10', 'dove, pigeon', 'inuma', 'doves', [
        'Inuma ni ikimenyetso cy’amahoro.',
        'The dove is a sign of peace.',
      ]),
      n('ikinyugunyugu', '7/8', 'butterfly', 'ibinyugunyugu', 'butterflies', [
        'Ikinyugunyugu kiri ku ndabo.',
        'The butterfly is on the flower.',
      ]),
      n('igitagangurirwa', '7/8', 'spider', 'ibitagangurirwa', 'spiders', [
        'Hari igitagangurirwa ku rukuta.',
        "There's a spider on the wall.",
      ]),
      n('umuswa', '3/4', 'termite', 'imiswa', 'termites', [
        'Imiswa yariye igiti.',
        'Termites ate the wood.',
      ]),
      n('igikeri', '7/8', 'frog', 'ibikeri', 'frogs', [
        'Ibikeri biba hafi y’amazi.',
        'Frogs live near water.',
      ]),
      v('kuryana', 'ryan', 'to bite, to sting', 'bite', 'bites', [
        'Iyi mbwa ntiryana.',
        "This dog doesn't bite.",
      ]),
    ],
  },
  {
    topic: 'farming',
    picturable: true,
    words: [
      n('amasaka', '6', 'sorghum', null, null, [
        'Amasaka akorwamo ikigage.',
        'Sorghum is made into sorghum beer.',
      ]),
      n('insina', '9/10', 'banana plant', 'insina', 'banana plants', [
        'Insina zacu zera neza.',
        'Our banana plants bear well.',
      ]),
      n('iteke', '5/6', 'taro', 'amateke', 'taro', [
        'Amateke aratekwa akaribwa.',
        'Taro is cooked and eaten.',
      ]),
      n('igihaza', '7/8', 'pumpkin', 'ibihaza', 'pumpkins', [
        'Ibihaza byeze neza uyu mwaka.',
        'The pumpkins did well this year.',
      ]),
      n('ingemwe', '9/10', 'seedling', 'ingemwe', 'seedlings', [
        'Twateye ingemwe z’ibiti.',
        'We planted tree seedlings.',
      ]),
      n('urwuri', '11/10', 'pasture', 'inzuri', 'pastures', [
        'Inka ziri mu rwuri.',
        'The cows are in the pasture.',
      ]),
      n('umworozi', '1/2', 'livestock farmer, herder', 'aborozi', 'livestock farmers', [
        'Umworozi afite inka icumi.',
        'The farmer has ten cows.',
      ]),
      v('kuvomera', 'vomer', 'to water (plants)', 'water', 'waters', [
        'Ndavomera imboga nimugoroba.',
        'I water the vegetables in the evening.',
      ]),
      v('kuvoma', 'vom', 'to fetch water', 'fetch water', 'fetches water', [
        'Abana bajya kuvoma ku iriba.',
        'The children go to fetch water at the well.',
      ]),
      v('kubiba', 'bib', 'to sow (seed)', 'sow', 'sows', [
        'Turabiba amasaka.',
        "We're sowing sorghum.",
      ]),
      v('gukama', 'kam', 'to milk (a cow)', 'milk', 'milks', [
        'Akama inka buri gitondo.',
        'He or she milks the cow every morning.',
      ]),
      v('guhunika', 'hunik', 'to store (the harvest)', 'store', 'stores', [
        'Duhunika ibishyimbo mu nzu.',
        'We store the beans in the house.',
      ]),
    ],
  },
  {
    topic: 'food',
    picturable: true,
    words: [
      n('karoti', '9/10', 'carrot', 'karoti', 'carrots', [
        'Karoti ni nziza ku maso.',
        'Carrots are good for the eyes.',
      ]),
      n('ishu', '5/6', 'cabbage', 'amashu', 'cabbages', [
        'Ishu rimwe ni amafaranga magana abiri.',
        'One cabbage is two hundred francs.',
      ]),
      n('ikinyomoro', '7/8', 'tree tomato', 'ibinyomoro', 'tree tomatoes', [
        'Umutobe w’ibinyomoro uraryoshye.',
        'Tree tomato juice is delicious.',
      ]),
      n('ipapayi', '5/6', 'papaya', 'amapapayi', 'papayas', [
        'Ipapayi ryeze.',
        'The papaya is ripe.',
      ]),
      n('indimu', '9/10', 'lemon, lime', 'indimu', 'lemons', [
        'Shyira indimu mu cyayi.',
        'Put lemon in the tea.',
      ]),
      n('tungurusumu', '9', 'garlic', null, null, [
        'Tungurusumu iryohereza ibiryo.',
        'Garlic makes food tasty.',
      ]),
      n('ikirungo', '7/8', 'spice, seasoning', 'ibirungo', 'spices', [
        'Ibirungo byinshi biva mu Buhinde.',
        'Many spices come from India.',
      ]),
      n('burusheti', '9/6', 'brochette, meat skewer', 'amaburusheti', 'brochettes', [
        'Twariye burusheti n’ibirayi.',
        'We ate brochettes and potatoes.',
      ]),
      n('isupu', '9/6', 'soup', 'amasupu', 'soups', ['Isupu irashyushye.', 'The soup is hot.']),
      n('ubugari', '14', 'cassava bread (a stiff porridge)', null, null, [
        'Ubugari buribwa n’imboga.',
        'Ubugari is eaten with vegetables.',
      ]),
      n('urwagwa', '11', 'banana beer', null, null, [
        'Urwagwa rukorwa mu bitoki.',
        'Banana beer is made from bananas.',
      ]),
      v('kotsa', 'ots', 'to roast, to grill', 'roast', 'roasts', [
        'Twotsa inyama.',
        "We're grilling meat.",
      ]),
    ],
  },
  {
    topic: 'clothes',
    picturable: true,
    words: [
      n('umukufi', '3/4', 'necklace', 'imikufi', 'necklaces', [
        'Umukufi we ni mwiza.',
        'Her necklace is beautiful.',
      ]),
      n('impeta', '9/10', 'ring', 'impeta', 'rings', [
        'Yambaye impeta y’ubukwe.',
        'He or she is wearing a wedding ring.',
      ]),
      n('idarubindi', '5/6', 'pair of glasses', 'amadarubindi', 'glasses', [
        'Sinabona nta madarubindi.',
        "I can't see without glasses.",
      ]),
      n('umutaka', '3/4', 'umbrella', 'imitaka', 'umbrellas', [
        'Fata umutaka, imvura iragwa.',
        "Take an umbrella, it's raining.",
      ]),
      n('umukenyero', '3/4', 'wrap skirt, sarong', 'imikenyero', 'wrap skirts', [
        'Yambaye umukenyero mwiza.',
        'She is wearing a nice wrap skirt.',
      ]),
      n('sandali', '9/6', 'sandal', 'amasandali', 'sandals', [
        'Nambara sandali iyo hashyushye.',
        "I wear sandals when it's hot.",
      ]),
      n('umusokozo', '3/4', 'comb', 'imisokozo', 'combs', ['Mpa umusokozo.', 'Give me the comb.']),
      v('kogosha', 'ogosh', 'to shave, to cut (hair)', 'shave', 'shaves', [
        'Nogosha umusatsi buri kwezi.',
        'I cut my hair every month.',
      ]),
      v('gukenyera', 'kenyer', 'to wrap on (a cloth)', 'wrap on', 'wraps on', [
        'Akenyera igitambaro.',
        'She wraps on a cloth.',
      ]),
      v('gusokoza', 'sokoz', 'to comb', 'comb', 'combs', [
        'Sokoza umusatsi wawe.',
        'Comb your hair.',
      ]),
    ],
  },
  {
    topic: 'actions',
    picturable: true,
    words: [
      v('gutoragura', 'toragur', 'to pick up (from the ground)', 'pick up', 'picks up', [
        'Toragura urupapuro.',
        'Pick up the paper.',
      ]),
      v('kunyura', 'nyur', 'to pass (by, through)', 'pass', 'passes', [
        'Bisi inyura hano.',
        'The bus passes here.',
      ]),
      v('kwegera', 'eger', 'to come close to, to approach', 'approach', 'approaches', [
        'Egera hano.',
        'Come closer.',
      ]),
      v('guhindukira', 'hindukir', 'to turn around', 'turn around', 'turns around', [
        'Hindukira urebe inyuma.',
        'Turn around and look behind.',
      ]),
      v('kunama', 'unam', 'to bend down, to bow', 'bend down', 'bends down', [
        'Yunamye atoragura igiceri.',
        'He or she bent down to pick up a coin.',
      ]),
      v('gutambuka', 'tambuk', 'to walk past, to step over', 'walk past', 'walks past', [
        'Tambuka buhoro.',
        'Walk past slowly.',
      ]),
      v('guhisha', 'hish', 'to hide (something)', 'hide', 'hides', [
        'Yahishe amafaranga.',
        'He or she hid the money.',
      ]),
      v('gusuka', 'suk', 'to pour', 'pour', 'pours', [
        'Suka amazi mu gikombe.',
        'Pour water into the cup.',
      ]),
      v('gukomanga', 'komang', 'to knock (on a door)', 'knock', 'knocks', [
        'Hari umuntu ukomanga ku rugi.',
        "Someone's knocking at the door.",
      ]),
      v('gutaka', 'tak', 'to shout, to cry out', 'shout', 'shouts', [
        'Ntugatake, umwana aryamye.',
        "Don't shout, the baby is asleep.",
      ]),
    ],
  },
  {
    topic: 'school',
    picturable: false,
    words: [
      n('inyuguti', '9/10', 'letter (of the alphabet)', 'inyuguti', 'letters', [
        'Ikinyarwanda gifite inyuguti nyinshi.',
        'Kinyarwanda has many letters.',
      ]),
      n('umuhanga', '1/2', 'expert, clever person', 'abahanga', 'experts', [
        'Ni umuhanga mu mibare.',
        'He or she is good at maths.',
      ]),
      n('isuzuma', '5/6', 'test, assessment', 'amasuzuma', 'tests', [
        'Ejo dufite isuzuma.',
        'We have a test tomorrow.',
      ]),
      n('ubugenge', '14', 'physics', null, null, ['Akunda ubugenge.', 'He or she likes physics.']),
      n('inkoranyamagambo', '9/10', 'dictionary', 'inkoranyamagambo', 'dictionaries', [
        'Shaka iri jambo mu nkoranyamagambo.',
        'Look this word up in the dictionary.',
      ]),
      n('ubutabire', '14', 'chemistry', null, null, [
        'Ubutabire buragoye ariko burashimishije.',
        'Chemistry is hard but interesting.',
      ]),
      n('ingengabihe', '9/10', 'timetable, schedule', 'ingengabihe', 'timetables', [
        'Reba ingengabihe y’amasomo.',
        'Look at the class timetable.',
      ]),
      v('kwitoza', 'itoz', 'to practise, to train', 'practise', 'practises', [
        'Nitoza kuvuga Ikinyarwanda buri munsi.',
        'I practise speaking Kinyarwanda every day.',
      ]),
      v('gukopera', 'koper', 'to copy, to cheat (in a test)', 'copy', 'copies', [
        'Ntugakopere mu kizamini.',
        "Don't cheat in the exam.",
      ]),
      v('gushushanya', 'shushany', 'to draw', 'draw', 'draws', [
        'Abana barimo gushushanya inzu.',
        'The children are drawing a house.',
      ]),
    ],
  },
  {
    topic: 'time',
    picturable: false,
    words: [
      o('Mutarama', 'January', ['Umwaka utangira muri Mutarama.', 'The year starts in January.']),
      o('Gashyantare', 'February', ['Gashyantare ni ukwezi kugufi.', 'February is a short month.']),
      o('Werurwe', 'March', ['Imvura igwa cyane muri Werurwe.', 'It rains a lot in March.']),
      o('Mata', 'April', ['Muri Mata turibuka.', 'In April we remember.']),
      o('Gicurasi', 'May', ['Ishuri ritangira muri Gicurasi.', 'School starts in May.']),
      o('Kamena', 'June', ['Muri Kamena haba izuba.', "In June it's sunny."]),
      o('Nyakanga', 'July', ['Yavutse muri Nyakanga.', 'He or she was born in July.']),
      o('Kanama', 'August', ['Muri Kanama turaruhuka.', 'In August we rest.']),
      o('Nzeri', 'September', [
        'Abanyeshuri basubira ku ishuri muri Nzeri.',
        'Students go back to school in September.',
      ]),
      o('Ukwakira', 'October', ['Ubukwe ni muri Ukwakira.', 'The wedding is in October.']),
      o('Ugushyingo', 'November', [
        'Ugushyingo kugira iminsi mirongo itatu.',
        'November has thirty days.',
      ]),
      o('Ukuboza', 'December', ['Noheli ni muri Ukuboza.', 'Christmas is in December.']),
    ],
  },
  {
    topic: 'people',
    picturable: false,
    words: [
      n('Umunyarwanda', '1/2', 'Rwandan (person)', 'Abanyarwanda', 'Rwandans', [
        'Ndi Umunyarwanda.',
        "I'm Rwandan.",
      ]),
      n('umwanzi', '1/2', 'enemy', 'abanzi', 'enemies', [
        'Nta mwanzi mfite.',
        "I don't have any enemies.",
      ]),
      n('umukunzi', '1/2', 'loved one, sweetheart; fan', 'abakunzi', 'loved ones; fans', [
        'Ni umukunzi wanjye.',
        'He or she is my sweetheart.',
      ]),
      n('umunyabwenge', '1/2', 'wise person', 'abanyabwenge', 'wise people', [
        'Sogokuru ni umunyabwenge.',
        'Grandfather is a wise man.',
      ]),
      n('impunzi', '9/10', 'refugee', 'impunzi', 'refugees', [
        'Impunzi zatahutse.',
        'The refugees returned home.',
      ]),
      n('umukerarugendo', '1/2', 'tourist', 'abakerarugendo', 'tourists', [
        'Abakerarugendo baje kureba ingagi.',
        'The tourists came to see the gorillas.',
      ]),
      n('intwari', '9/10', 'hero', 'intwari', 'heroes', [
        'Ni intwari y’igihugu.',
        'He or she is a national hero.',
      ]),
      n('umwami', '1/2', 'king', 'abami', 'kings', [
        'Kera u Rwanda rwari rufite umwami.',
        'Long ago Rwanda had a king.',
      ]),
      v('kubeshya', 'beshy', 'to lie, to tell a lie', 'lie', 'lies', [
        'Ntukabeshye.',
        "Don't lie.",
      ]),
      v(
        'gufatanya',
        'fatany',
        'to work together, to cooperate',
        'work together',
        'works together',
        ['Dufatanye uyu murimo.', "Let's do this work together."],
      ),
      v('gusuhuza', 'suhuz', 'to greet', 'greet', 'greets', [
        'Suhuza abashyitsi.',
        'Greet the guests.',
      ]),
    ],
  },
  {
    topic: 'function',
    picturable: false,
    words: [
      o(
        'kuri',
        'to, for, on (before a name or pronoun)',
        ['Ndandikira kuri Yohani.', 'I am writing to John.'],
        F,
      ),
      o(
        'birashoboka',
        "it's possible",
        ['Birashoboka ko azaza.', "It's possible that he'll come."],
        F,
      ),
      o('wenda', 'maybe, perhaps', ['Wenda azaza ejo.', 'Maybe he or she will come tomorrow.'], F),
      o(
        'keretse',
        'unless, except',
        ['Nta wundi keretse we.', 'No one else except him or her.'],
        F,
      ),
      o(
        'kugira ngo',
        'in order to, so that',
        ['Ndiga kugira ngo mvuge neza.', "I'm studying so that I speak well."],
        F,
      ),
      o('nk’uko', 'as, the way that', ['Kora nk’uko nakubwiye.', 'Do it the way I told you.'], F),
      o(
        'ko',
        'that (as in "I know that …")',
        ['Nzi ko uri umunyeshuri.', 'I know that you are a student.'],
        F,
      ),
      o(
        'uretse',
        'apart from, except',
        ['Twese twaje uretse Petero.', 'We all came apart from Peter.'],
        F,
      ),
      o(
        'birumvikana',
        'of course, understandably',
        ['Birumvikana, nzaza.', "Of course, I'll come."],
        F,
      ),
      o('yewe', 'hey; even', ['Yewe, ngwino hano!', 'Hey, come here!'], F),
    ],
  },
];
