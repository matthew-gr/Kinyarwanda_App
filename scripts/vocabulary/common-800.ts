// Common 800: ranks 501 to 800, in clusters, drafted like Common 200 and Common 500. Each
// topic returns at a harder level, and picturable clusters lead each hundred.
//
// AI DRAFT. Written by Claude, not yet checked by a native speaker.

import { n, o, v, type Cluster } from './words.ts';

const F = ['function'];

export const COMMON_800: Cluster[] = [
  // Ranks 501 to 600.
  {
    topic: 'body',
    picturable: true,
    words: [
      n('umubiri', '3/4', 'body', 'imibiri', 'bodies', [
        'Siporo ni nziza ku mubiri.',
        'Sport is good for the body.',
      ]),
      n('izuru', '5/6', 'nose', 'amazuru', 'noses', ['Izuru rirandya.', 'My nose itches.']),
      n('ijwi', '5/6', 'voice; sound', 'amajwi', 'voices', [
        'Afite ijwi ryiza.',
        'He or she has a beautiful voice.',
      ]),
      n('umunwa', '3/4', 'mouth, lips', 'iminwa', 'mouths, lips', [
        'Funga umunwa.',
        'Close your mouth.',
      ]),
      n('igitugu', '7/8', 'shoulder', 'ibitugu', 'shoulders', [
        'Igitugu kirambabaza.',
        'My shoulder hurts.',
      ]),
      n('ivi', '5/6', 'knee', 'amavi', 'knees', [
        'Yapfukamye ku mavi.',
        'He or she knelt on his or her knees.',
      ]),
      n('umuhogo', '3/4', 'throat', 'imihogo', 'throats', [
        'Mfite uburwayi bwo mu muhogo.',
        'I have a sore throat.',
      ]),
      n('ikiganza', '7/8', 'hand, palm', 'ibiganza', 'hands, palms', [
        'Mpa ikiganza.',
        'Give me your hand.',
      ]),
      n('umusaya', '3/4', 'cheek', 'imisaya', 'cheeks', [
        'Umwana afite imisaya minini.',
        'The child has big cheeks.',
      ]),
      n('agahanga', '12/13', 'forehead', 'uduhanga', 'foreheads', [
        'Agahanga ke karashyushye.',
        'His or her forehead is hot.',
      ]),
      n('igituza', '7/8', 'chest', 'ibituza', 'chests', [
        'Ndababara mu gituza.',
        'I have pain in my chest.',
      ]),
      n('ikibero', '7/8', 'thigh', 'ibibero', 'thighs', [
        'Ikibero cyanjye kirababara.',
        'My thigh hurts.',
      ]),
      n('umukondo', '3/4', 'navel', 'imikondo', 'navels', [
        'Umukondo w’umwana warakize.',
        "The baby's navel has healed.",
      ]),
      v('gukorora', 'koror', 'to cough', 'cough', 'coughs', [
        'Umwana arakorora cyane.',
        'The child is coughing a lot.',
      ]),
      v('kubyimba', 'byimb', 'to swell', 'swell', 'swells', [
        'Ikirenge cyanjye kirabyimba.',
        'My foot is swelling.',
      ]),
    ],
  },
  {
    topic: 'house',
    picturable: true,
    words: [
      n('amashanyarazi', '6', 'electricity', null, null, [
        'Nta mashanyarazi ahari uyu munsi.',
        'There is no electricity today.',
      ]),
      n('igisenge', '7/8', 'roof', 'ibisenge', 'roofs', [
        'Igisenge kirava.',
        'The roof is leaking.',
      ]),
      n('igipangu', '7/8', 'compound wall, fence', 'ibipangu', 'compound walls', [
        'Inzu yacu ifite igipangu kirekire.',
        'Our house has a high wall.',
      ]),
      n('matela', '9/10', 'mattress', 'matela', 'mattresses', [
        'Iyi matela ni nshya.',
        'This mattress is new.',
      ]),
      n('umusego', '3/4', 'pillow', 'imisego', 'pillows', ['Nkeneye umusego.', 'I need a pillow.']),
      n('ikiringiti', '7/8', 'blanket', 'ibiringiti', 'blankets', [
        'Hari imbeho, fata ikiringiti.',
        "It's cold, take a blanket.",
      ]),
      n('isahani', '9/6', 'plate', 'amasahani', 'plates', [
        'Shyira ibiryo ku isahani.',
        'Put the food on the plate.',
      ]),
      n('igikombe', '7/8', 'cup; trophy', 'ibikombe', 'cups', [
        'Mpa igikombe cy’icyayi.',
        'Give me a cup of tea.',
      ]),
      n('ikiyiko', '7/8', 'spoon', 'ibiyiko', 'spoons', [
        'Ndya umuceri n’ikiyiko.',
        'I eat rice with a spoon.',
      ]),
      n('icyuma', '7/8', 'knife; metal', 'ibyuma', 'knives; metals', [
        'Iki cyuma kiratyaye.',
        'This knife is sharp.',
      ]),
      n('indorerwamo', '9/10', 'mirror; glasses', 'indorerwamo', 'mirrors', [
        'Yireba mu ndorerwamo.',
        'He or she looks in the mirror.',
      ]),
      n('ibase', '9/6', 'basin, bowl', 'amabase', 'basins', [
        'Shyira amazi mu ibase.',
        'Put water in the basin.',
      ]),
      n('umukeka', '3/4', 'woven mat', 'imikeka', 'mats', [
        'Twicaye ku mukeka.',
        'We sat on the mat.',
      ]),
      v('gusasa', 'sas', 'to make the bed, to spread', 'make the bed', 'makes the bed', [
        'Sasa uburiri bwawe.',
        'Make your bed.',
      ]),
      v('kumanika', 'manik', 'to hang (up)', 'hang up', 'hangs up', [
        'Manika imyenda hanze.',
        'Hang the clothes outside.',
      ]),
    ],
  },
  {
    topic: 'food',
    picturable: true,
    words: [
      n('umutsima', '3/4', 'stiff porridge (ugali); cake', 'imitsima', 'portions of ugali', [
        'Turya umutsima n’isombe.',
        'We eat ugali with cassava leaves.',
      ]),
      n('ikijumba', '7/8', 'sweet potato', 'ibijumba', 'sweet potatoes', [
        'Ibijumba biraryoshye.',
        'Sweet potatoes are tasty.',
      ]),
      n('isosi', '9/10', 'sauce, stew', 'isosi', 'sauces', [
        'Iyi sosi irimo inyama.',
        'This sauce has meat in it.',
      ]),
      n('inyanya', '9/10', 'tomato', 'inyanya', 'tomatoes', [
        'Gura inyanya ku isoko.',
        'Buy tomatoes at the market.',
      ]),
      n('umuneke', '3/4', 'ripe sweet banana', 'imineke', 'ripe bananas', [
        'Umwana arya umuneke.',
        'The child is eating a banana.',
      ]),
      n('ishaza', '5/6', 'pea', 'amashaza', 'peas', [
        'Amashaza ni ibiryo byiza.',
        'Peas are good food.',
      ]),
      n('ubunyobwa', '14', 'groundnuts, peanuts', null, null, [
        'Nkunda isosi y’ubunyobwa.',
        'I like peanut sauce.',
      ]),
      n('isombe', '9', 'cassava leaves (dish)', null, null, [
        'Isombe ni ibiryo bikunzwe.',
        'Isombe is a popular dish.',
      ]),
      n('urusenda', '11/10', 'chilli pepper', 'insenda', 'chilli peppers', [
        'Urusenda ruraryana.',
        'The chilli is hot.',
      ]),
      n('inanasi', '9/10', 'pineapple', 'inanasi', 'pineapples', [
        'Inanasi ziraryoshye.',
        'The pineapples are sweet.',
      ]),
      n('umwembe', '3/4', 'mango', 'imyembe', 'mangoes', [
        'Iyi myembe irahiye.',
        'These mangoes are ripe.',
      ]),
      n('icunga', '5/6', 'orange (fruit)', 'amacunga', 'oranges', [
        'Mpa icunga rimwe.',
        'Give me one orange.',
      ]),
      v('kuvanga', 'vang', 'to mix', 'mix', 'mixes', [
        'Vanga ifu n’amazi.',
        'Mix the flour with water.',
      ]),
      v('gusogongera', 'sogonger', 'to taste', 'taste', 'tastes', [
        'Sogongera iyi sosi.',
        'Taste this sauce.',
      ]),
    ],
  },
  {
    topic: 'family',
    picturable: true,
    words: [
      n('sekuru', '1a/2', 'his or her grandfather', 'basekuru', 'grandfathers', [
        'Sekuru yari umuhinzi.',
        'His or her grandfather was a farmer.',
      ]),
      n('nyirakuru', '1a/2', 'his or her grandmother', 'banyirakuru', 'grandmothers', [
        'Nyirakuru aracyariho.',
        'His or her grandmother is still alive.',
      ]),
      n('data', '1a', 'my father', null, null, ['Data ari ku kazi.', 'My father is at work.']),
      n('umwishywa', '1/2', 'nephew, niece', 'abishywa', 'nephews, nieces', [
        'Umwishywa wanjye yiga i Huye.',
        'My nephew studies in Huye.',
      ]),
      n('umukazana', '1/2', 'daughter-in-law', 'abakazana', 'daughters-in-law', [
        'Umukazana we ni umwarimu.',
        'His or her daughter-in-law is a teacher.',
      ]),
      n('sebukwe', '1a/2', 'father-in-law', 'basebukwe', 'fathers-in-law', [
        'Sebukwe yaje mu bukwe.',
        'His or her father-in-law came to the wedding.',
      ]),
      n('nyirabukwe', '1a/2', 'mother-in-law', 'banyirabukwe', 'mothers-in-law', [
        'Nyirabukwe aramukunda.',
        'His or her mother-in-law loves him or her.',
      ]),
      n('inkumi', '9/10', 'young woman', 'inkumi', 'young women', [
        'Inkumi iraririmba.',
        'The young woman is singing.',
      ]),
      n('ingimbi', '9/10', 'teenage boy', 'ingimbi', 'teenage boys', [
        'Ingimbi zirakina umupira.',
        'The teenage boys are playing football.',
      ]),
      n('umwangavu', '1/2', 'teenage girl', 'abangavu', 'teenage girls', [
        'Abangavu bagiye ku ishuri.',
        'The teenage girls went to school.',
      ]),
      n('umukuru', '1/2', 'elder; older sibling', 'abakuru', 'elders', [
        'Ni umukuru mu muryango.',
        'He or she is the eldest in the family.',
      ]),
      n('umwuzukuruza', '1/2', 'great-grandchild', 'abuzukuruza', 'great-grandchildren', [
        'Afite abuzukuruza batanu.',
        'He or she has five great-grandchildren.',
      ]),
      v('gukura', 'kur', 'to grow (up)', 'grow up', 'grows up', [
        'Abana barakura vuba.',
        'Children grow up fast.',
      ]),
      v('gusaza', 'saz', 'to grow old', 'grow old', 'grows old', [
        'Twese turasaza.',
        'We all grow old.',
      ]),
    ],
  },
  {
    topic: 'places',
    picturable: true,
    words: [
      n('umurenge', '3/4', 'sector (local area)', 'imirenge', 'sectors', [
        'Ibiro by’umurenge biri hafi.',
        'The sector office is nearby.',
      ]),
      n('akagari', '12/13', 'cell (local area)', 'utugari', 'cells', [
        'Dutuye mu kagari kamwe.',
        'We live in the same cell.',
      ]),
      n('ikiyaga', '7/8', 'lake', 'ibiyaga', 'lakes', [
        'Ikiyaga cya Kivu ni cyiza.',
        'Lake Kivu is beautiful.',
      ]),
      n('igishanga', '7/8', 'marsh, swamp', 'ibishanga', 'marshes', [
        'Bahinga umuceri mu gishanga.',
        'They grow rice in the marsh.',
      ]),
      n('umugezi', '3/4', 'stream', 'imigezi', 'streams', [
        'Abana bavoma ku mugezi.',
        'The children fetch water at the stream.',
      ]),
      n('ikibaya', '7/8', 'valley', 'ibibaya', 'valleys', [
        'Inzu iri mu kibaya.',
        'The house is in the valley.',
      ]),
      n('umurwa', '3/4', 'city; capital (umurwa mukuru)', 'imirwa', 'cities', [
        'Kigali ni umurwa mukuru w’u Rwanda.',
        'Kigali is the capital of Rwanda.',
      ]),
      n('gereza', '9/10', 'prison', 'gereza', 'prisons', [
        'Umujura ari muri gereza.',
        'The thief is in prison.',
      ]),
      n('sitade', '9/10', 'stadium', 'sitade', 'stadiums', [
        'Tugiye kuri sitade kureba umupira.',
        "We're going to the stadium to watch football.",
      ]),
      n('hoteli', '9/10', 'hotel', 'hoteli', 'hotels', [
        'Abashyitsi baraye muri hoteli.',
        'The guests stayed in a hotel.',
      ]),
      n('resitora', '9/10', 'restaurant', 'resitora', 'restaurants', [
        'Turarira muri resitora.',
        'We are having dinner at a restaurant.',
      ]),
      v('kwambuka', 'ambuk', 'to cross', 'cross', 'crosses', [
        'Twambuka umuhanda twitonze.',
        'We cross the road carefully.',
      ]),
      v('kuzamuka', 'zamuk', 'to climb, to go up', 'climb', 'climbs', [
        'Turazamuka umusozi.',
        'We are climbing the hill.',
      ]),
      v('kumanuka', 'manuk', 'to go down', 'go down', 'goes down', [
        'Amanuka ajya ku isoko.',
        'He or she goes down to the market.',
      ]),
    ],
  },
  {
    topic: 'animals',
    picturable: true,
    words: [
      n('inkende', '9/10', 'monkey', 'inkende', 'monkeys', [
        'Inkende iri ku giti.',
        'The monkey is in the tree.',
      ]),
      n('imbeba', '9/10', 'rat, mouse', 'imbeba', 'rats, mice', [
        'Imbeba yariye ibigori.',
        'The rat ate the maize.',
      ]),
      n('urukwavu', '11/10', 'rabbit', 'inkwavu', 'rabbits', [
        'Yorora inkwavu.',
        'He or she raises rabbits.',
      ]),
      n('imbogo', '9/10', 'buffalo', 'imbogo', 'buffaloes', [
        'Imbogo ziba muri parike.',
        'Buffaloes live in the park.',
      ]),
      n('ingagi', '9/10', 'gorilla', 'ingagi', 'gorillas', [
        'Ba mukerarugendo baje kureba ingagi.',
        'Tourists came to see the gorillas.',
      ]),
      n('imparage', '9/10', 'zebra', 'imparage', 'zebras', [
        'Imparage zifite imirongo.',
        'Zebras have stripes.',
      ]),
      n('isazi', '9/10', 'fly (insect)', 'isazi', 'flies', [
        'Funga isahani, hari isazi.',
        'Cover the plate, there are flies.',
      ]),
      n('umubu', '3/4', 'mosquito', 'imibu', 'mosquitoes', [
        'Imibu izana malariya.',
        'Mosquitoes bring malaria.',
      ]),
      n('uruyuki', '11/10', 'bee', 'inzuki', 'bees', ['Inzuki zikora ubuki.', 'Bees make honey.']),
      n('ikimasa', '7/8', 'bull', 'ibimasa', 'bulls', [
        'Ikimasa kirakomeye.',
        'The bull is strong.',
      ]),
      n('inyana', '9/10', 'calf', 'inyana', 'calves', [
        'Inka yabyaye inyana.',
        'The cow gave birth to a calf.',
      ]),
      n('ingona', '9/10', 'crocodile', 'ingona', 'crocodiles', [
        'Ingona iba mu ruzi.',
        'The crocodile lives in the river.',
      ]),
      v('kuguruka', 'guruk', 'to fly', 'fly', 'flies', [
        'Inyoni ziraguruka.',
        'The birds are flying.',
      ]),
      v('kuruma', 'rum', 'to bite', 'bite', 'bites', ['Iyi mbwa iraruma.', 'This dog bites.']),
    ],
  },
  {
    topic: 'function',
    picturable: false,
    words: [
      n('impamvu', '9/10', 'reason', 'impamvu', 'reasons', [
        'Ni iyihe mpamvu?',
        'What is the reason?',
      ]),
      o('kubera', 'because of', ['Sinaje kubera imvura.', "I didn't come because of the rain."]),
      o('nubwo', 'although, even though', [
        'Nubwo ananiwe, arakora.',
        'Although he or she is tired, he or she works.',
      ]),
      o('mbese', 'so; by the way (starts a question)', ['Mbese uraho?', 'So, are you well?']),
      o('dore', 'look, here is', ['Dore inzu yanjye.', 'Here is my house.']),
      o('reka', "let; leave it; let's", ['Reka tugende.', "Let's go."]),
      o('hanyuma', 'then, afterwards', [
        'Turarya, hanyuma turaryama.',
        'We eat, and then we sleep.',
      ]),
      o('naho', 'whereas; as for', [
        'Njye ndya inyama, naho we arya imboga.',
        'I eat meat, whereas he or she eats vegetables.',
      ]),
      o('ahubwo', 'rather, instead', [
        'Ntabwo ari ejo, ahubwo ni uyu munsi.',
        "It's not tomorrow, it's today instead.",
      ]),
      o('bityo', 'so, therefore', [
        'Imvura yaguye, bityo ntitwagiye.',
        "It rained, so we didn't go.",
      ]),
      o('ntawe', 'nobody', ['Ntawe uri mu rugo.', 'Nobody is at home.']),
      o('hose', 'everywhere', ['Namushakishije hose.', 'I looked for him or her everywhere.']),
      o('ahandi', 'elsewhere, somewhere else', ['Tujye ahandi.', "Let's go somewhere else."]),
      o('wenyine', 'alone, by oneself', ['Atuye wenyine.', 'He or she lives alone.']),
    ],
  },

  // Ranks 601 to 700.
  {
    topic: 'clothes',
    picturable: true,
    words: [
      n('isogisi', '9/6', 'sock', 'amasogisi', 'socks', ['Ambara amasogisi.', 'Put on socks.']),
      n('ikabutura', '9/6', 'shorts', 'amakabutura', 'pairs of shorts', [
        'Umwana yambaye ikabutura.',
        'The child is wearing shorts.',
      ]),
      n('umukandara', '3/4', 'belt', 'imikandara', 'belts', [
        'Uyu mukandara ni muremure.',
        'This belt is long.',
      ]),
      n('igitenge', '7/8', 'wrap cloth (kitenge)', 'ibitenge', 'wrap cloths', [
        'Yambaye igitenge cyiza.',
        'She is wearing a beautiful kitenge.',
      ]),
      n('ijipo', '9/6', 'skirt', 'amajipo', 'skirts', [
        'Ijipo ye ni ndende.',
        'Her skirt is long.',
      ]),
      n('umupira', '3/4', 'ball; jersey, sweater', 'imipira', 'balls; jerseys', [
        'Abana bakina umupira.',
        'The children play football.',
      ]),
      n('karuvati', '9/10', 'tie, necktie', 'karuvati', 'ties', [
        'Yambara karuvati ku wa mbere.',
        'He wears a tie on Monday.',
      ]),
      n('isakoshi', '9/6', 'bag, handbag', 'amasakoshi', 'bags', [
        'Isakoshi yanjye iraremereye.',
        'My bag is heavy.',
      ]),
      n('umufuka', '3/4', 'pocket; sack', 'imifuka', 'pockets; sacks', [
        'Telefoni iri mu mufuka.',
        'The phone is in my pocket.',
      ]),
      n('urushinge', '11/10', 'needle; injection', 'inshinge', 'needles', [
        'Mpa urushinge n’urudodo.',
        'Give me a needle and thread.',
      ]),
      n('urudodo', '11/10', 'thread', 'indodo', 'threads', [
        'Urudodo rwacitse.',
        'The thread broke.',
      ]),
      v('kudoda', 'dod', 'to sew', 'sew', 'sews', ['Mama adoda imyenda.', 'Mum sews clothes.']),
      v('kwiyambura', 'iyambur', 'to undress, to take off', 'undress', 'undresses', [
        'Iyambure ikoti.',
        'Take off your jacket.',
      ]),
      v('kuboha', 'boh', 'to tie; to weave, to knit', 'tie', 'ties', [
        'Boha inkweto zawe.',
        'Tie your shoes.',
      ]),
    ],
  },
  {
    topic: 'farming',
    picturable: true,
    words: [
      n('umuhoro', '3/4', 'machete', 'imihoro', 'machetes', [
        'Yatemye igiti n’umuhoro.',
        'He or she cut the tree with a machete.',
      ]),
      n('ifumbire', '9', 'fertilizer, manure', null, null, [
        'Shyira ifumbire mu murima.',
        'Put fertilizer in the field.',
      ]),
      n('ingano', '9/10', 'wheat; size', 'ingano', 'wheat', [
        'Ingano zikora umugati.',
        'Wheat makes bread.',
      ]),
      n('isaka', '5/6', 'sorghum (plant)', 'amasaka', 'sorghum', [
        'Amasaka yeze.',
        'The sorghum is ripe.',
      ]),
      n('uburo', '14', 'millet', null, null, [
        'Nkunda igikoma cy’uburo.',
        'I like millet porridge.',
      ]),
      n('ubuhinzi', '14', 'farming, agriculture', null, null, [
        'Ubuhinzi ni umurimo w’ingenzi.',
        'Farming is important work.',
      ]),
      n('ubworozi', '14', 'livestock farming', null, null, [
        'Akora ubworozi bw’inka.',
        'He or she raises cattle.',
      ]),
      n('igihingwa', '7/8', 'crop, plant', 'ibihingwa', 'crops', [
        'Ibihingwa bikeneye imvura.',
        'The crops need rain.',
      ]),
      n('ikigega', '7/8', 'store, granary; fund', 'ibigega', 'stores', [
        'Umusaruro uri mu kigega.',
        'The harvest is in the store.',
      ]),
      n('isambu', '9/10', 'land, plot (owned)', 'amasambu', 'plots of land', [
        'Afite isambu nini.',
        'He or she has a big plot of land.',
      ]),
      v('kuhira', 'uhir', 'to water (plants)', 'water the plants', 'waters the plants', [
        'Turuhira imboga nimugoroba.',
        'We water the vegetables in the evening.',
      ]),
      v('kubagara', 'bagar', 'to weed', 'weed', 'weeds', [
        'Barabagara mu murima.',
        'They are weeding in the field.',
      ]),
      v('korora', 'oror', 'to raise (animals)', 'raise animals', 'raises animals', [
        'Arorora inkoko.',
        'He or she raises chickens.',
      ]),
      v('gutema', 'tem', 'to cut down, to chop', 'cut down', 'cuts down', [
        'Ntutema ibiti.',
        "Don't cut down the trees.",
      ]),
    ],
  },
  {
    topic: 'weather',
    picturable: true,
    words: [
      n('umuyaga', '3/4', 'wind', 'imiyaga', 'winds', [
        'Hari umuyaga mwinshi.',
        "It's very windy.",
      ]),
      n('igihu', '7/8', 'fog, mist', 'ibihu', 'fogs', [
        'Mu gitondo hari igihu.',
        'There is fog in the morning.',
      ]),
      n('umukororombya', '3/4', 'rainbow', 'imikororombya', 'rainbows', [
        'Dore umukororombya!',
        'Look, a rainbow!',
      ]),
      n('amapfa', '6', 'drought', null, null, [
        'Amapfa yateye inzara.',
        'The drought caused hunger.',
      ]),
      n('umwuzure', '3/4', 'flood', 'imyuzure', 'floods', [
        'Umwuzure wasenye amazu.',
        'The flood destroyed houses.',
      ]),
      n('ikime', '7', 'dew', null, null, [
        'Mu gitondo ibyatsi biriho ikime.',
        'In the morning there is dew on the grass.',
      ]),
      n('umurabyo', '3/4', 'lightning flash', 'imirabyo', 'flashes of lightning', [
        'Umurabyo wamuritse ijuru.',
        'Lightning lit up the sky.',
      ]),
      n('inkubi', '9/10', 'storm (inkubi y’umuyaga)', 'inkubi', 'storms', [
        'Inkubi y’umuyaga yatwaye igisenge.',
        'The storm took off the roof.',
      ]),
      n('umuhindo', '3', 'short rainy season (September to December)', null, null, [
        'Duhinga mu muhindo.',
        'We plant in the short rainy season.',
      ]),
      n('icyi', '7', 'dry season (June to August)', null, null, [
        'Mu cyi nta mvura igwa.',
        "In the dry season it doesn't rain.",
      ]),
      v('guhuha', 'huh', 'to blow (wind)', 'blow', 'blows', [
        'Umuyaga urahuha.',
        'The wind is blowing.',
      ]),
      v('kunyagirwa', 'nyagirw', 'to get rained on', 'get rained on', 'gets rained on', [
        'Twanyagiwe tujya ku isoko.',
        'We got rained on going to the market.',
      ]),
      v('kwaka', 'ak', 'to shine, to burn (light)', 'shine', 'shines', [
        'Izuba riraka.',
        'The sun is shining.',
      ]),
    ],
  },
  {
    topic: 'people',
    picturable: true,
    words: [
      n(
        'umwanditsi',
        '1/2',
        'writer; secretary',
        'abanditsi',
        'writers',
        ['Ni umwanditsi w’ibitabo.', 'He or she is a writer of books.'],
        ['people', 'work'],
      ),
      n(
        'umushoferi',
        '1/2',
        'driver',
        'abashoferi',
        'drivers',
        ['Umushoferi atwara bisi.', 'The driver drives the bus.'],
        ['people', 'work'],
      ),
      n(
        'umukinnyi',
        '1/2',
        'player; actor',
        'abakinnyi',
        'players',
        ['Ni umukinnyi w’umupira.', 'He or she is a football player.'],
        ['people', 'work'],
      ),
      n(
        'umuhanzi',
        '1/2',
        'artist, musician',
        'abahanzi',
        'artists',
        ['Uyu muhanzi araririmba neza.', 'This artist sings well.'],
        ['people', 'work'],
      ),
      n(
        'umunyamakuru',
        '1/2',
        'journalist',
        'abanyamakuru',
        'journalists',
        ['Umunyamakuru yabajije ibibazo.', 'The journalist asked questions.'],
        ['people', 'work'],
      ),
      n(
        'umwubatsi',
        '1/2',
        'builder',
        'abubatsi',
        'builders',
        ['Abubatsi barubaka inzu.', 'The builders are building a house.'],
        ['people', 'work'],
      ),
      n(
        'umubaji',
        '1/2',
        'carpenter',
        'ababaji',
        'carpenters',
        ['Umubaji yakoze ameza.', 'The carpenter made a table.'],
        ['people', 'work'],
      ),
      n(
        'umudozi',
        '1/2',
        'tailor',
        'abadozi',
        'tailors',
        ['Umudozi adoda ikanzu.', 'The tailor is sewing a dress.'],
        ['people', 'work'],
      ),
      n(
        'umutetsi',
        '1/2',
        'cook',
        'abatetsi',
        'cooks',
        ['Umutetsi ateka neza.', 'The cook cooks well.'],
        ['people', 'work'],
      ),
      n(
        'umurobyi',
        '1/2',
        'fisherman',
        'abarobyi',
        'fishermen',
        ['Abarobyi baroba mu kiyaga.', 'The fishermen fish in the lake.'],
        ['people', 'work'],
      ),
      n(
        'umushumba',
        '1/2',
        'herder; shepherd, pastor',
        'abashumba',
        'herders',
        ['Umushumba aragira inka.', 'The herder looks after the cows.'],
        ['people', 'church'],
      ),
      v('kuroba', 'rob', 'to fish', 'fish', 'fishes', ['Baroba nijoro.', 'They fish at night.']),
      v('gucuranga', 'curang', 'to play (music, an instrument)', 'play music', 'plays music', [
        'Acuranga gitari.',
        'He or she plays the guitar.',
      ]),
    ],
  },
  {
    topic: 'shopping',
    picturable: false,
    words: [
      n('igicuruzwa', '7/8', 'product, item for sale', 'ibicuruzwa', 'goods', [
        'Iduka rifite ibicuruzwa byinshi.',
        'The shop has many goods.',
      ]),
      n('inyemezabuguzi', '9/10', 'receipt', 'inyemezabuguzi', 'receipts', [
        'Mpa inyemezabuguzi.',
        'Give me a receipt.',
      ]),
      n('agaciro', '12', 'value, worth', null, null, [
        'Iki gitabo gifite agaciro.',
        'This book is valuable.',
      ]),
      n('inyungu', '9/10', 'profit; benefit; interest', 'inyungu', 'profits', [
        'Ubucuruzi bwe bufite inyungu.',
        'His or her business makes a profit.',
      ]),
      n('igihombo', '7/8', 'loss (money)', 'ibihombo', 'losses', [
        'Yagize igihombo.',
        'He or she made a loss.',
      ]),
      n('ububiko', '14', 'storeroom, warehouse', null, null, [
        'Ibicuruzwa biri mu bubiko.',
        'The goods are in the storeroom.',
      ]),
      n('umuguzi', '1/2', 'buyer', 'abaguzi', 'buyers', [
        'Abaguzi ni benshi uyu munsi.',
        'There are many buyers today.',
      ]),
      n('litiro', '9/10', 'litre', 'litiro', 'litres', [
        'Gura litiro ebyiri z’amata.',
        'Buy two litres of milk.',
      ]),
      n('metero', '9/10', 'metre', 'metero', 'metres', [
        'Ishuri riri muri metero ijana.',
        'The school is a hundred metres away.',
      ]),
      v('kugurana', 'guran', 'to exchange, to trade', 'exchange', 'exchanges', [
        'Tugurane amafaranga.',
        "Let's exchange money.",
      ]),
      v('kwishyuza', 'ishyuz', 'to charge (a price)', 'charge', 'charges', [
        'Anyishyuza amafaranga menshi.',
        'He or she charges me a lot of money.',
      ]),
      v('guciririkanya', 'ciririkany', 'to bargain', 'bargain', 'bargains', [
        'Ku isoko turaciririkanya.',
        'At the market we bargain.',
      ]),
    ],
  },
  {
    topic: 'school',
    picturable: false,
    words: [
      n('ikaye', '9/6', 'exercise book', 'amakaye', 'exercise books', [
        'Andika mu ikaye yawe.',
        'Write in your exercise book.',
      ]),
      n('ikibaho', '7/8', 'blackboard; board', 'ibibaho', 'blackboards', [
        'Umwarimu yandika ku kibaho.',
        'The teacher writes on the board.',
      ]),
      n('icyiciro', '7/8', 'level, stage; category', 'ibyiciro', 'levels', [
        'Ari mu cyiciro cya kabiri.',
        'He or she is at the second level.',
      ]),
      n('isomero', '5/6', 'library', 'amasomero', 'libraries', [
        'Ndiga mu isomero.',
        'I study in the library.',
      ]),
      n('ikigo', '7/8', 'institution, centre; school', 'ibigo', 'institutions', [
        'Ikigo cy’ishuri ni kinini.',
        'The school is big.',
      ]),
      n('inyandiko', '9/10', 'document, piece of writing', 'inyandiko', 'documents', [
        'Soma iyi nyandiko.',
        'Read this document.',
      ]),
      n('ibaruwa', '9/6', 'letter (mail)', 'amabaruwa', 'letters', [
        'Namwandikiye ibaruwa.',
        'I wrote him or her a letter.',
      ]),
      n('impamyabumenyi', '9/10', 'diploma, certificate', 'impamyabumenyi', 'diplomas', [
        'Yabonye impamyabumenyi.',
        'He or she got a diploma.',
      ]),
      n('ubwenge', '14', 'intelligence, wisdom', null, null, [
        'Uyu mwana afite ubwenge.',
        'This child is clever.',
      ]),
      n('amateka', '6', 'history', null, null, [
        'Nkunda kwiga amateka.',
        'I like studying history.',
      ]),
      v('kumenya', 'meny', 'to know', 'know', 'knows', [
        'Ndamenya iki gisubizo.',
        'I know this answer.',
      ]),
      v('gukosora', 'kosor', 'to correct, to mark', 'correct', 'corrects', [
        'Umwarimu arakosora ibizamini.',
        'The teacher is marking the exams.',
      ]),
    ],
  },
  {
    topic: 'health',
    picturable: false,
    words: [
      n('ubuzima', '14', 'life; health', null, null, ['Ubuzima ni bwiza.', 'Life is good.']),
      n('uburwayi', '14', 'illness', null, null, [
        'Uburwayi bwe ni bwinshi.',
        'His or her illness is serious.',
      ]),
      n('ibicurane', '8', 'flu, a cold', null, null, ['Mfite ibicurane.', 'I have a cold.']),
      n('inkorora', '9', 'cough', null, null, [
        'Inkorora ye irakomeye.',
        'His or her cough is bad.',
      ]),
      n('ububabare', '14', 'pain', null, null, [
        'Afite ububabare mu mugongo.',
        'He or she has back pain.',
      ]),
      n('igikomere', '7/8', 'wound, injury', 'ibikomere', 'wounds', [
        'Igikomere kiri gukira.',
        'The wound is healing.',
      ]),
      n('impanuka', '9/10', 'accident', 'impanuka', 'accidents', [
        'Habaye impanuka mu muhanda.',
        'There was an accident on the road.',
      ]),
      n('urupfu', '11', 'death', null, null, [
        'Twababajwe n’urupfu rwe.',
        'We were saddened by his or her death.',
      ]),
      n('ikinini', '7/8', 'pill, tablet', 'ibinini', 'pills', [
        'Nywa ibinini bibiri.',
        'Take two pills.',
      ]),
      v('gupfa', 'pf', 'to die', 'die', 'dies', [
        'Igiti kirapfa nta mazi.',
        'The tree dies without water.',
      ]),
      v('kuruka', 'ruk', 'to vomit', 'vomit', 'vomits', [
        'Umwana araruka.',
        'The child is vomiting.',
      ]),
      v('kwirinda', 'irind', 'to guard against, to avoid', 'guard against', 'guards against', [
        'Twirinda malariya.',
        'We guard against malaria.',
      ]),
    ],
  },
  {
    topic: 'time',
    picturable: false,
    words: [
      o('kera', 'long ago', ['Kera nari umwana.', 'Long ago I was a child.'], ['time', ...F]),
      o(
        'ubundi',
        'otherwise; actually; usually',
        ['Ubundi ndya saa sita.', 'Usually I eat at noon.'],
        ['time', ...F],
      ),
      n('akanya', '12/13', 'moment', 'utunya', 'moments', [
        'Tegereza akanya gato.',
        'Wait a moment.',
      ]),
      n('umunota', '3/4', 'minute', 'iminota', 'minutes', [
        'Tegereza iminota itanu.',
        'Wait five minutes.',
      ]),
      n('isegonda', '9/10', 'second (time)', 'amasegonda', 'seconds', [
        'Ni isegonda rimwe gusa.',
        "It's just one second.",
      ]),
      o(
        'ejobundi',
        'the day before yesterday; the day after tomorrow',
        ['Yaje ejobundi.', 'He or she came the day before yesterday.'],
        ['time', ...F],
      ),
      o(
        'burya',
        'actually, in fact; so it turns out',
        ['Burya uzi Ikinyarwanda!', 'So you know Kinyarwanda!'],
        ['time', ...F],
      ),
      o('nibura', 'at least', ['Nywa nibura amazi.', 'At least drink water.'], ['time', ...F]),
      n('ubusa', '14', 'nothing, emptiness; for free', null, null, [
        'Yagarutse ubusa.',
        'He or she came back empty-handed.',
      ]),
      o('nonaha', 'right now', ['Ngwino nonaha.', 'Come right now.'], ['time', ...F]),
    ],
  },

  // Ranks 701 to 800.
  {
    topic: 'actions',
    picturable: true,
    words: [
      v('gusimbuka', 'simbuk', 'to jump', 'jump', 'jumps', [
        'Abana barasimbuka.',
        'The children are jumping.',
      ]),
      v('koga', 'og', 'to swim', 'swim', 'swims', ['Turoga mu kiyaga.', 'We swim in the lake.']),
      v('kuzamura', 'zamur', 'to raise, to lift up', 'raise', 'raises', [
        'Zamura ukuboko.',
        'Raise your hand.',
      ]),
      v('gukurura', 'kurur', 'to pull', 'pull', 'pulls', ['Kurura urugi.', 'Pull the door.']),
      v('gusunika', 'sunik', 'to push', 'push', 'pushes', [
        'Dusunike imodoka.',
        "Let's push the car.",
      ]),
      v('guterura', 'terur', 'to lift, to carry up', 'lift', 'lifts', [
        'Terura umwana.',
        'Pick up the child.',
      ]),
      v('kujugunya', 'juguny', 'to throw (away)', 'throw', 'throws', [
        'Ntujugunye imyanda hasi.',
        "Don't throw rubbish on the ground.",
      ]),
      v('gukubita', 'kubit', 'to hit, to beat', 'hit', 'hits', [
        'Ntukubite imbwa.',
        "Don't hit the dog.",
      ]),
      v('kumena', 'men', 'to break; to spill', 'break', 'breaks', [
        'Umwana yamennye igikombe.',
        'The child broke the cup.',
      ]),
      v('guca', 'c', 'to cut; to pass by', 'cut', 'cuts', ['Ca umugati.', 'Cut the bread.']),
      v('kwoza', 'oz', 'to wash (dishes)', 'wash the dishes', 'washes the dishes', [
        'Ndoza amasahani.',
        'I wash the dishes.',
      ]),
      v('kwihuta', 'ihut', 'to hurry, to go fast', 'hurry', 'hurries', [
        'Ihute, turatinze.',
        "Hurry, we're late.",
      ]),
      v('kuzinga', 'zing', 'to fold, to roll up', 'fold', 'folds', [
        'Zinga imyenda yawe.',
        'Fold your clothes.',
      ]),
    ],
  },
  {
    topic: 'colours',
    picturable: true,
    words: [
      n('ikigina', '7', 'brown', null, null, [
        'Inkweto ze ni ikigina.',
        'His or her shoes are brown.',
      ]),
      o('binini', 'big (things)', ['Ibitabo binini.', 'Big books.'], ['colours']),
      o('bito', 'small, few (things)', ['Ibiti bito.', 'Small trees.'], ['colours']),
      o('birebire', 'long, tall (things)', ['Ibiti birebire.', 'Tall trees.'], ['colours']),
      o('bigufi', 'short (things)', ['Ibiti bigufi.', 'Short trees.'], ['colours']),
      o(
        'bikomeye',
        'hard, strong; important (things)',
        ['Ibibazo bikomeye.', 'Serious problems.'],
        ['colours'],
      ),
      o('bishyushye', 'hot (things)', ['Ibiryo bishyushye.', 'Hot food.'], ['colours']),
      o('bikonje', 'cold (things)', ['Ibinyobwa bikonje.', 'Cold drinks.'], ['colours']),
      o('biremereye', 'heavy (things)', ['Ibikoresho biremereye.', 'Heavy tools.'], ['colours']),
      o('bisukuye', 'clean (things)', ['Ibikombe bisukuye.', 'Clean cups.'], ['colours']),
      o('byanduye', 'dirty (things)', ['Imyenda yanduye.', 'Dirty clothes.'], ['colours']),
      o('biryoshye', 'tasty, sweet (things)', ['Ibiryo biryoshye.', 'Tasty food.'], ['colours']),
    ],
  },
  {
    topic: 'church',
    picturable: false,
    words: [
      n('umuhanuzi', '1/2', 'prophet', 'abahanuzi', 'prophets', [
        'Yesaya yari umuhanuzi.',
        'Isaiah was a prophet.',
      ]),
      n('intumwa', '9/10', 'apostle; messenger', 'intumwa', 'apostles', [
        'Pawulo yari intumwa.',
        'Paul was an apostle.',
      ]),
      n('umwigishwa', '1/2', 'disciple, learner', 'abigishwa', 'disciples', [
        'Yesu yari afite abigishwa cumi na babiri.',
        'Jesus had twelve disciples.',
      ]),
      n('ubwami', '14', 'kingdom', null, null, [
        'Ubwami bw’Imana buri hafi.',
        'The kingdom of God is near.',
      ]),
      n('igitambo', '7/8', 'sacrifice, offering', 'ibitambo', 'sacrifices', [
        'Yesu yatanze igitambo.',
        'Jesus gave a sacrifice.',
      ]),
      n('umusaraba', '3/4', 'cross', 'imisaraba', 'crosses', [
        'Yesu yapfiriye ku musaraba.',
        'Jesus died on the cross.',
      ]),
      n('umukiza', '1/2', 'saviour', 'abakiza', 'saviours', [
        'Yesu ni Umukiza.',
        'Jesus is the Saviour.',
      ]),
      n('umubatizo', '3/4', 'baptism', 'imibatizo', 'baptisms', [
        'Umubatizo uzaba ku cyumweru.',
        'The baptism will be on Sunday.',
      ]),
      n('misa', '9/10', 'mass (church service)', 'misa', 'masses', [
        'Tujya mu misa mu gitondo.',
        'We go to mass in the morning.',
      ]),
      n('Noheli', '9', 'Christmas', null, null, ['Noheli nziza!', 'Merry Christmas!']),
      n('Pasika', '9', 'Easter', null, null, [
        'Pasika ni umunsi mukuru.',
        'Easter is a feast day.',
      ]),
      v('kubatiza', 'batiz', 'to baptize', 'baptize', 'baptizes', [
        'Pasiteri arabatiza abana.',
        'The pastor baptizes the children.',
      ]),
      v('kwihana', 'ihan', 'to repent', 'repent', 'repents', [
        'Mwihane ibyaha byanyu.',
        'Repent of your sins.',
      ]),
    ],
  },
  {
    topic: 'government',
    picturable: false,
    words: [
      n('repubulika', '9', 'republic', null, null, [
        'Repubulika y’u Rwanda.',
        'The Republic of Rwanda.',
      ]),
      n('guverinoma', '9', 'government', null, null, [
        'Guverinoma yatangaje itegeko rishya.',
        'The government announced a new law.',
      ]),
      n('minisiteri', '9/10', 'ministry', 'minisiteri', 'ministries', [
        'Akora muri minisiteri y’ubuzima.',
        'He or she works in the ministry of health.',
      ]),
      n('inteko', '9/10', 'assembly, parliament', 'inteko', 'assemblies', [
        'Inteko yatoye itegeko.',
        'The parliament passed a law.',
      ]),
      n('umudepite', '1/2', 'member of parliament', 'abadepite', 'members of parliament', [
        'Abadepite bateraniye i Kigali.',
        'The MPs met in Kigali.',
      ]),
      n('umujyanama', '1/2', 'adviser, councillor', 'abajyanama', 'advisers', [
        'Ni umujyanama w’ubuzima.',
        'He or she is a community health worker.',
      ]),
      n('uburenganzira', '14', 'right(s)', null, null, [
        'Buri muntu afite uburenganzira.',
        'Everyone has rights.',
      ]),
      n('inshingano', '9/10', 'responsibility, duty', 'inshingano', 'responsibilities', [
        'Ni inshingano zacu.',
        "It's our responsibility.",
      ]),
      n('ubutabera', '14', 'justice', null, null, [
        'Abaturage barashaka ubutabera.',
        'The people want justice.',
      ]),
      n('ubukungu', '14', 'economy; wealth', null, null, [
        'Ubukungu bw’igihugu burazamuka.',
        "The country's economy is growing.",
      ]),
      n('iterambere', '5', 'development, progress', null, null, [
        'Twese dukorere iterambere.',
        "Let's all work for development.",
      ]),
      v('gutegeka', 'tegek', 'to rule, to order', 'rule', 'rules', [
        'Umwami yategekaga igihugu.',
        'The king ruled the country.',
      ]),
      v('kurengera', 'renger', 'to protect, to defend', 'protect', 'protects', [
        'Leta irengera abaturage.',
        'The state protects the people.',
      ]),
    ],
  },
  {
    topic: 'feelings',
    picturable: false,
    words: [
      n('umubabaro', '3', 'sorrow, grief', null, null, [
        'Afite umubabaro mwinshi.',
        'He or she is full of sorrow.',
      ]),
      n('impuhwe', '9/10', 'compassion, mercy', 'impuhwe', 'compassion', [
        'Imana ifite impuhwe.',
        'God is merciful.',
      ]),
      n('icyizere', '7', 'trust, confidence; hope', null, null, [
        'Mfite icyizere.',
        'I am confident.',
      ]),
      n('ineza', '9', 'kindness, goodness', null, null, [
        'Urakoze ku bw’ineza yawe.',
        'Thank you for your kindness.',
      ]),
      n('urwango', '11', 'hatred', null, null, ['Urwango ni rubi.', 'Hatred is bad.']),
      n('umutuzo', '3', 'calm, peace of mind', null, null, [
        'Nkeneye umutuzo.',
        'I need some calm.',
      ]),
      n('icyubahiro', '7', 'respect, honour', null, null, [
        'Tumuha icyubahiro.',
        'We give him or her respect.',
      ]),
      n('ubwibone', '14', 'pride, arrogance', null, null, [
        'Ubwibone si bwiza.',
        'Arrogance is not good.',
      ]),
      n('ubwigunge', '14', 'loneliness', null, null, [
        'Ubwigunge buramubabaza.',
        'Loneliness makes him or her sad.',
      ]),
      n('umunaniro', '3', 'tiredness, fatigue', null, null, [
        'Umunaniro wanteye kuryama kare.',
        'Tiredness made me go to bed early.',
      ]),
      v('kwishimira', 'ishimir', 'to enjoy, to be pleased with', 'enjoy', 'enjoys', [
        'Ndishimira akazi kanjye.',
        'I enjoy my work.',
      ]),
      v('kubaha', 'ubah', 'to respect', 'respect', 'respects', [
        'Twubaha ababyeyi bacu.',
        'We respect our parents.',
      ]),
      v('gutuza', 'tuz', 'to calm down, to be quiet', 'calm down', 'calms down', [
        'Tuza, byose bizagenda neza.',
        'Calm down, everything will be fine.',
      ]),
      v('kwihangana', 'ihangan', 'to be patient, to persevere', 'persevere', 'perseveres', [
        'Ihangane gato.',
        'Be patient a little.',
      ]),
    ],
  },
  {
    topic: 'work',
    picturable: false,
    words: [
      n('umwuga', '3/4', 'profession, trade', 'imyuga', 'professions', [
        'Umwuga we ni ubwarimu.',
        'His or her profession is teaching.',
      ]),
      n('ikiruhuko', '7/8', 'holiday, break, rest', 'ibiruhuko', 'holidays', [
        'Ndi mu kiruhuko.',
        "I'm on holiday.",
      ]),
      n('uruhushya', '11/10', 'permission; permit, licence', 'impushya', 'permits', [
        'Afite uruhushya rwo gutwara imodoka.',
        'He or she has a driving licence.',
      ]),
      n('raporo', '9/10', 'report', 'raporo', 'reports', [
        'Nandika raporo y’ukwezi.',
        "I'm writing the monthly report.",
      ]),
      n('igikoresho', '7/8', 'tool, device', 'ibikoresho', 'tools', [
        'Nkeneye ibikoresho byo gukora.',
        'I need tools to work.',
      ]),
      n('sosiyete', '9/10', 'company', 'sosiyete', 'companies', [
        'Akora muri sosiyete nini.',
        'He or she works at a big company.',
      ]),
      n('isezerano', '5/6', 'promise; agreement', 'amasezerano', 'agreements, contracts', [
        'Twasinye amasezerano.',
        'We signed the contract.',
      ]),
      n('intego', '9/10', 'goal, aim', 'intego', 'goals', [
        'Intego yacu ni ugutsinda.',
        'Our goal is to succeed.',
      ]),
      n('gahunda', '9/10', 'plan, programme, schedule', 'gahunda', 'plans', [
        'Gahunda y’uyu munsi ni iyihe?',
        "What is today's plan?",
      ]),
      v('kuruhuka', 'ruhuk', 'to rest', 'rest', 'rests', [
        'Uyu munsi ndaruhuka.',
        "Today I'm resting.",
      ]),
      v('gukomeza', 'komez', 'to continue, to keep on', 'continue', 'continues', [
        'Komeza gukora neza.',
        'Keep up the good work.',
      ]),
      v('gusaba', 'sab', 'to ask for, to apply for', 'ask for', 'asks for', [
        'Arasaba akazi.',
        'He or she is applying for a job.',
      ]),
      v('guhemba', 'hemb', 'to pay (wages), to reward', 'pay', 'pays', [
        'Bahemba abakozi buri kwezi.',
        'They pay the workers every month.',
      ]),
    ],
  },
  {
    topic: 'time',
    picturable: false,
    words: [
      o('ku wa mbere', 'Monday', ['Ku wa mbere ndakora.', 'On Monday I work.']),
      o('ku wa kabiri', 'Tuesday', [
        'Ku wa kabiri tujya ku isoko.',
        'On Tuesday we go to the market.',
      ]),
      o('ku wa gatatu', 'Wednesday', ['Ku wa gatatu ndiga.', 'On Wednesday I study.']),
      o('ku wa kane', 'Thursday', ['Azaza ku wa kane.', 'He or she will come on Thursday.']),
      o('ku wa gatanu', 'Friday', ['Ku wa gatanu ndataha kare.', 'On Friday I go home early.']),
      o('ku wa gatandatu', 'Saturday', [
        'Ku wa gatandatu ni umuganda.',
        'On Saturday there is community work.',
      ]),
      o('ku cyumweru', 'Sunday', ['Ku cyumweru tujya mu rusengero.', 'On Sunday we go to church.']),
      n('itariki', '9/10', 'date', 'amatariki', 'dates', [
        'Uyu munsi ni itariki ya kangahe?',
        "What's the date today?",
      ]),
      n('isabukuru', '9/10', 'birthday; anniversary', 'isabukuru', 'birthdays', [
        'Isabukuru nziza!',
        'Happy birthday!',
      ]),
      n('igihembwe', '7/8', 'school term; quarter', 'ibihembwe', 'terms', [
        'Igihembwe cya mbere kirarangiye.',
        'The first term is over.',
      ]),
      n('ikinyejana', '7/8', 'century', 'ibinyejana', 'centuries', [
        'Ikinyejana cya makumyabiri na rimwe.',
        'The twenty-first century.',
      ]),
      o(
        'magana',
        'hundreds (in counting: magana abiri, 200)',
        ['Ni amafaranga magana atanu.', "It's five hundred francs."],
        ['numbers'],
      ),
    ],
  },
  {
    topic: 'function',
    picturable: false,
    words: [
      o('hirya', 'over there, beyond', ['Inzu ye iri hirya.', 'His or her house is over there.']),
      o('iruhande', 'beside, next to', ['Icara iruhande rwanjye.', 'Sit next to me.']),
      o('haruguru', 'up there, above', ['Ishuri riri haruguru.', 'The school is up there.']),
      o('hepfo', 'down there, below', ['Isoko riri hepfo.', 'The market is down there.']),
      o('aha', 'here (this place)', ['Aha ni heza.', 'This place is nice.']),
      o('ngaho', 'there; go on, well then', ['Ngaho genda.', 'Go on then.']),
      o('rwose', 'really, totally', ['Ni byiza rwose.', "It's really good."]),
      o('pe', 'at all; indeed (for emphasis)', ['Sinzi pe.', "I don't know at all."]),
      o('icyakora', 'however', [
        'Ndashaka kuza, icyakora sinzi igihe.',
        "I want to come, but I don't know when.",
      ]),
      o('nyamuneka', 'please', ['Nyamuneka mfasha.', 'Please help me.']),
    ],
  },
];
