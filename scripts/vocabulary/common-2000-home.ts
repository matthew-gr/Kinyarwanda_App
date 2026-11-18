// Common 2000, part of ranks 1501 to 2000, in clusters: the home and household objects, cooking
// and food, clothes and personal care, the body, and health and illness. Drafted like Common 1500
// (see common-1500.ts): it avoids every word already in the course, and picturable clusters lead.
//
// AI DRAFT. Written by Claude, not yet checked by a native speaker.

import { n, o, v, type Cluster } from './words.ts';

const C = ['colours'];

export const COMMON_2000_HOME: Cluster[] = [
  {
    topic: 'house',
    picturable: true,
    words: [
      n('umweyo', '3/4', 'broom', 'imyeyo', 'brooms', [
        'Fata umweyo ukubure inzu.',
        'Take the broom and sweep the house.',
      ]),
      n('urusika', '11/10', 'inner wall, partition', 'insika', 'inner walls', [
        'Ifoto imanitse ku rusika.',
        'The photo hangs on the inner wall.',
      ]),
      n('itiyo', '9/6', 'pipe (for water)', 'amatiyo', 'pipes', [
        'Amazi anyura mu itiyo.',
        'The water runs through the pipe.',
      ]),
      n('ikaro', '5/6', 'floor tile', 'amakaro', 'floor tiles', [
        'Inzu yabo ifite amakaro.',
        'Their house has a tiled floor.',
      ]),
      n('urubaraza', '11/10', 'veranda, porch', 'imbaraza', 'verandas', [
        'Twicaye ku rubaraza.',
        'We are sitting on the veranda.',
      ]),
      n('ifuru', '9/6', 'oven', 'amafuru', 'ovens', [
        'Keke iri mu ifuru.',
        'The cake is in the oven.',
      ]),
      n('uruganiriro', '11', 'living room, sitting room', null, null, [
        'Abashyitsi bari mu ruganiriro.',
        'The guests are in the living room.',
      ]),
      n('akayunguruzo', '12/13', 'sieve, strainer', 'utuyunguruzo', 'sieves', [
        'Yungurura umutobe n’akayunguruzo.',
        'Strain the juice with a sieve.',
      ]),
      n('iziko', '5/6', 'hearth, fireplace', 'amaziko', 'hearths', [
        'Inkono iri ku ziko.',
        'The pot is on the hearth.',
      ]),
      v('guhanagura', 'hanagur', 'to wipe', 'wipe', 'wipes', [
        'Hanagura ameza.',
        'Wipe the table.',
      ]),
      v('guhoma', 'hom', 'to plaster (a wall)', 'plaster', 'plasters', [
        'Barahoma inzu yabo.',
        "They're plastering their house.",
      ]),
      v('gutunganya', 'tungany', 'to tidy, to put in order', 'tidy', 'tidies', [
        'Tunganya icyumba cyawe.',
        'Tidy your room.',
      ]),
      v('gusakara', 'sakar', 'to roof (a house)', 'roof', 'roofs', [
        'Barasakara inzu nshya.',
        "They're roofing the new house.",
      ]),
    ],
  },
  {
    topic: 'house',
    picturable: true,
    words: [
      n('ikirago', '7/8', 'sleeping mat', 'ibirago', 'sleeping mats', [
        'Aryama ku kirago.',
        'He or she sleeps on a mat.',
      ]),
      n('ikibiriti', '7/8', 'matches, matchbox', 'ibibiriti', 'matchboxes', [
        'Mpa ikibiriti ncane umuriro.',
        'Give me the matches so I can light the fire.',
      ]),
      n('ihema', '5/6', 'tent', 'amahema', 'tents', [
        'Baryamye mu ihema.',
        'They are sleeping in a tent.',
      ]),
      n(
        'ikizinga',
        '7/8',
        'stain',
        'ibizinga',
        'stains',
        ['Ishati yanjye ifite ikizinga.', 'My shirt has a stain.'],
        ['clothes'],
      ),
      n('nyakatsi', '9/10', 'thatched hut', 'nyakatsi', 'thatched huts', [
        'Nta nyakatsi zikiri mu Rwanda.',
        'There are no thatched huts left in Rwanda.',
      ]),
      n('itegura', '5/6', 'roof tile', 'amategura', 'roof tiles', [
        'Inzu isakaje amategura.',
        'The house is roofed with tiles.',
      ]),
      n(
        'umwanda',
        '3/4',
        'dirt, filth',
        'imyanda',
        'rubbish, waste',
        ['Ntukajugunye imyanda hasi.', "Don't throw rubbish on the ground."],
        ['health'],
      ),
      v('kubika', 'bik', 'to keep, to store', 'keep', 'keeps', [
        'Bika ibiryo muri firigo.',
        'Keep the food in the fridge.',
      ]),
      v('kumanura', 'manur', 'to take down', 'take down', 'takes down', [
        'Manura imyenda yumye.',
        'Take down the dry clothes.',
      ]),
      v('gutwikira', 'twikir', 'to cover', 'cover', 'covers', [
        'Twikira inkono.',
        'Cover the pot.',
      ]),
      v('gutashya', 'tashy', 'to gather firewood', 'gather firewood', 'gathers firewood', [
        'Abana bagiye gutashya.',
        'The children have gone to gather firewood.',
      ]),
      v('kwanduza', 'anduz', 'to make dirty; to infect', 'make dirty', 'makes dirty', [
        'Ntukanduze inzu.',
        "Don't make the house dirty.",
      ]),
    ],
  },
  {
    topic: 'food',
    picturable: true,
    words: [
      n('igicuma', '7/8', 'gourd (for drinks)', 'ibicuma', 'gourds', [
        'Urwagwa ruri mu gicuma.',
        'The banana beer is in the gourd.',
      ]),
      n('inkeri', '9/10', 'strawberry', 'inkeri', 'strawberries', [
        'Inkeri ziraryoshye.',
        'Strawberries are tasty.',
      ]),
      n('capati', '9/10', 'chapati', 'capati', 'chapatis', [
        'Twariye capati n’icyayi.',
        'We had chapati with tea.',
      ]),
      n('sambusa', '9/10', 'samosa', 'sambusa', 'samosas', [
        'Gura sambusa ebyiri.',
        'Buy two samosas.',
      ]),
      n('kawunga', '9', 'maize flour', null, null, [
        'Mama yaguze kawunga ku isoko.',
        'Mum bought maize flour at the market.',
      ]),
      n('divayi', '9', 'wine', null, null, [
        'Banywa divayi mu bukwe.',
        'They drink wine at the wedding.',
      ]),
      n('ikinyobwa', '7/8', 'drink', 'ibinyobwa', 'drinks', [
        'Urashaka ikinyobwa ki?',
        'What would you like to drink?',
      ]),
      v('kunyunyuza', 'nyunyuz', 'to suck (sweets, sugar cane)', 'suck', 'sucks', [
        'Umwana anyunyuza bombo.',
        'The child is sucking a sweet.',
      ]),
      v('kuminja', 'minj', 'to sprinkle (salt, spices)', 'sprinkle', 'sprinkles', [
        'Minja umunyu ku nyanya.',
        'Sprinkle salt on the tomatoes.',
      ]),
      n('icyansi', '7/8', 'traditional milk jug', 'ibyansi', 'milk jugs', [
        'Icyansi cyuzuye amata.',
        'The milk jug is full of milk.',
      ]),
      n('umuheha', '3/4', 'drinking straw', 'imiheha', 'drinking straws', [
        'Mpa umuheha.',
        'Give me a straw.',
      ]),
      n('umusemburo', '3', 'yeast', null, null, [
        'Shyira umusemburo mu ifu.',
        'Put yeast in the flour.',
      ]),
    ],
  },
  {
    topic: 'food',
    picturable: true,
    words: [
      v('gucunda', 'cund', 'to churn (milk)', 'churn', 'churns', [
        'Arimo gucunda amata.',
        'He or she is churning milk.',
      ]),
      v('kwenga', 'eng', 'to brew (beer)', 'brew', 'brews', [
        'Benga urwagwa mu bitoki.',
        'They brew beer from bananas.',
      ]),
      v('gusekura', 'sekur', 'to pound (in a mortar)', 'pound', 'pounds', [
        'Arasekura imyumbati.',
        'He or she is pounding cassava.',
      ]),
      v('gukata', 'kat', 'to cut, to slice', 'slice', 'slices', [
        'Kata igitunguru.',
        'Slice the onion.',
      ]),
      v('gushyushya', 'shyushy', 'to heat up, to warm up', 'heat up', 'heats up', [
        'Shyushya amazi y’icyayi.',
        'Heat the water for tea.',
      ]),
      v('kugabura', 'gabur', 'to serve (food)', 'serve', 'serves', [
        'Gabura ibiryo, abashyitsi barashonje.',
        'Serve the food, the guests are hungry.',
      ]),
      v('kubora', 'bor', 'to rot, to go bad', 'rot', 'rots', [
        'Inyanya zaboze.',
        'The tomatoes have gone bad.',
      ]),
      v('gukonjesha', 'konjesh', 'to chill, to keep cold', 'chill', 'chills', [
        'Firigo ikonjesha ibinyobwa.',
        'The fridge keeps the drinks cold.',
      ]),
      v('gukamura', 'kamur', 'to squeeze, to wring', 'squeeze', 'squeezes', [
        'Kamura indimu mu mazi.',
        'Squeeze the lemon into the water.',
      ]),
      o('bikaranze', 'fried (things)', ['Ibirayi bikaranze.', 'Fried potatoes.'], C),
      o('bisharira', 'sour (things)', ['Sinkunda ibiryo bisharira.', "I don't like sour food."], C),
      o('birura', 'bitter (things)', ['Ibi biryo birura.', 'This food is bitter.'], C),
    ],
  },
  {
    topic: 'food',
    picturable: false,
    words: [
      n('indyo', '9', 'diet, kind of food', null, null, [
        'Abana bakeneye indyo yuzuye.',
        'Children need a balanced diet.',
      ]),
      n('intungamubiri', '10', 'nutrients', null, null, [
        'Imboga zifite intungamubiri nyinshi.',
        'Vegetables have lots of nutrients.',
      ]),
      n('uburyohe', '14', 'taste, sweetness', null, null, [
        'Iyi kawa ifite uburyohe bwiza.',
        'This coffee has a nice taste.',
      ]),
      n('impumuro', '9/10', 'smell, scent', 'impumuro', 'smells', [
        'Numva impumuro y’ikawa.',
        'I can smell the coffee.',
      ]),
      n('umunuko', '3/4', 'bad smell, stink', 'iminuko', 'bad smells', [
        'Hari umunuko mu gikoni.',
        "There's a bad smell in the kitchen.",
      ]),
      n('ibinyamisogwe', '8', 'legumes, pulses', null, null, [
        'Ibishyimbo n’amashaza ni ibinyamisogwe.',
        'Beans and peas are legumes.',
      ]),
      n('ibinyampeke', '8', 'cereals, grains', null, null, [
        'Ibigori n’amasaka ni ibinyampeke.',
        'Maize and sorghum are cereals.',
      ]),
      n(
        'imirire',
        '4',
        'nutrition',
        null,
        null,
        ['Imirire myiza irinda indwara.', 'Good nutrition protects against illness.'],
        ['health'],
      ),
      n(
        'bwaki',
        '9',
        'kwashiorkor (child malnutrition)',
        null,
        null,
        ['Bwaki ifata abana batarya neza.', "Kwashiorkor strikes children who don't eat well."],
        ['health'],
      ),
      o(
        'bihumura',
        'fragrant, sweet-smelling (things)',
        ['Ibirungo bihumura neza.', 'Spices that smell good.'],
        C,
      ),
      o('binuka', 'smelly (things)', ['Ibi bintu binuka.', 'These things smell bad.'], C),
      o('muryoherwe', 'enjoy your meal', [
        'Ibiryo byahiye. Muryoherwe!',
        'The food is ready. Enjoy your meal!',
      ]),
    ],
  },
  {
    topic: 'clothes',
    picturable: true,
    words: [
      n('ikositimu', '9/6', 'suit', 'amakositimu', 'suits', [
        'Yambaye ikositimu y’umukara.',
        'He or she is wearing a black suit.',
      ]),
      n('urwembe', '11/10', 'razor blade', 'inzembe', 'razor blades', [
        'Urwembe rurakata cyane.',
        'The razor blade cuts very well.',
      ]),
      n('isaro', '5/6', 'bead', 'amasaro', 'beads', [
        'Akora imikufi mu masaro.',
        'He or she makes necklaces from beads.',
      ]),
      n('umwitero', '3/4', 'sash (of the traditional dress)', 'imyitero', 'sashes', [
        'Umushanana ugira umwitero.',
        'The umushanana has a sash.',
      ]),
      n('parufe', '9/10', 'perfume', 'parufe', 'perfumes', [
        'Yisize parufe nziza.',
        'He or she has put on nice perfume.',
      ]),
      n('umutako', '3/4', 'ornament, piece of jewellery', 'imitako', 'ornaments, jewellery', [
        'Yambaye imitako ya zahabu.',
        'He or she is wearing gold jewellery.',
      ]),
      n('urugori', '11/10', 'urugori (mothers’ traditional headband)', 'ingori', 'headbands', [
        'Umubyeyi yambara urugori.',
        'A mother wears the urugori headband.',
      ]),
      v('kwambika', 'ambik', 'to dress (someone)', 'dress', 'dresses', [
        'Ambika umwana imyenda.',
        'Dress the child.',
      ]),
      v('kwisiga', 'isig', 'to put on (lotion, make-up)', 'put on', 'puts on', [
        'Yisiga amavuta buri gitondo.',
        'He or she puts on lotion every morning.',
      ]),
      n('ikoboyi', '9/6', 'jeans', 'amakoboyi', 'pairs of jeans', [
        'Yambaye ikoboyi.',
        'He or she is wearing jeans.',
      ]),
      n('agatambaro', '12/13', 'handkerchief', 'udutambaro', 'handkerchiefs', [
        'Ihanagure n’agatambaro.',
        'Wipe your face with a handkerchief.',
      ]),
      v('gukwira', 'kwir', 'to fit (clothes)', 'fit', 'fits', [
        'Iyi shati irankwira.',
        'This shirt fits me.',
      ]),
      v('kurimba', 'rimb', 'to dress up smartly', 'dress up', 'dresses up', [
        'Yarimbye ajya mu bukwe.',
        'He or she dressed up for the wedding.',
      ]),
      o('birekuye', 'loose (clothes, things)', ['Ibi birekuye cyane.', 'These are too loose.'], C),
    ],
  },
  {
    topic: 'body',
    picturable: true,
    words: [
      n('urwasaya', '11/10', 'jaw', 'inzasaya', 'jaws', [
        'Urwasaya rwanjye rurababara.',
        'My jaw hurts.',
      ]),
      n('akananwa', '12/13', 'chin', 'utunanwa', 'chins', [
        'Afite inkovu ku kananwa.',
        'He or she has a scar on the chin.',
      ]),
      n('igihanga', '7/8', 'skull', 'ibihanga', 'skulls', [
        'Igihanga kirinda ubwonko.',
        'The skull protects the brain.',
      ]),
      n('imboni', '9/10', 'pupil (of the eye)', 'imboni', 'pupils', [
        'Imboni y’ijisho ni umukara.',
        'The pupil of the eye is black.',
      ]),
      n('urutirigongo', '11', 'spine, backbone', null, null, [
        'Urutirigongo rufata umubiri.',
        'The spine holds up the body.',
      ]),
      n('igipfunsi', '7/8', 'fist; punch', 'ibipfunsi', 'fists', [
        'Yamukubise igipfunsi.',
        'He or she punched him or her.',
      ]),
      n('amara', '6', 'intestines, guts', null, null, [
        'Ibiryo binyura mu mara.',
        'Food passes through the intestines.',
      ]),
      n('uruhago', '11', 'bladder', null, null, [
        'Uruhago rubika inkari.',
        'The bladder holds urine.',
      ]),
      n('ibinure', '8', 'fat (on meat or the body)', null, null, [
        'Iyi nyama ifite ibinure byinshi.',
        'This meat has a lot of fat.',
      ]),
      n('inkari', '10', 'urine', null, null, [
        'Muganga yasabye gupima inkari.',
        'The doctor asked for a urine test.',
      ]),
      v('gucira', 'cir', 'to spit', 'spit', 'spits', [
        'Ntugacire hasi.',
        "Don't spit on the ground.",
      ]),
      v('kwihagarika', 'ihagarik', 'to urinate, to pee', 'urinate', 'urinates', [
        'Umwana arashaka kwihagarika.',
        'The child needs to pee.',
      ]),
    ],
  },
  {
    topic: 'body',
    picturable: true,
    words: [
      v('kwishimagura', 'ishimagur', 'to scratch (oneself)', 'scratch', 'scratches', [
        'Ntukishimagure igisebe.',
        "Don't scratch the sore.",
      ]),
      v('gutitira', 'titir', 'to shiver, to tremble', 'shiver', 'shivers', [
        'Aratitira kubera imbeho.',
        'He or she is shivering with cold.',
      ]),
      v('gutsitara', 'tsitar', 'to stumble, to trip', 'stumble', 'stumbles', [
        'Natsitaye ku ibuye.',
        'I tripped on a stone.',
      ]),
      v('kwigorora', 'igoror', 'to stretch (your body)', 'stretch', 'stretches', [
        'Yabyutse arigorora.',
        'He or she got up and stretched.',
      ]),
      v('gukorakora', 'korakor', 'to touch, to feel (with the hands)', 'touch', 'touches', [
        'Ntukorakore ibintu byo mu iduka.',
        "Don't touch the things in the shop.",
      ]),
      v('kwayura', 'ayur', 'to yawn', 'yawn', 'yawns', [
        'Arayura kuko ashaka gusinzira.',
        'He or she is yawning because he or she is sleepy.',
      ]),
      v('kugona', 'gon', 'to snore', 'snore', 'snores', [
        'Data agona nijoro.',
        'My father snores at night.',
      ]),
      v('gukambakamba', 'kambakamb', 'to crawl', 'crawl', 'crawls', [
        'Umwana atangiye gukambakamba.',
        'The baby has started crawling.',
      ]),
      n('umubyibuho', '3', 'fatness, obesity', null, null, [
        'Umubyibuho ukabije utera indwara.',
        'Too much weight causes illness.',
      ]),
      v('kubyibuha', 'byibuh', 'to put on weight', 'put on weight', 'puts on weight', [
        'Yarabyibushye cyane.',
        'He or she has put on a lot of weight.',
      ]),
      n('intege', '10', 'strength, energy', null, null, [
        'Ndumva nta ntege mfite.',
        'I feel I have no strength.',
      ]),
      n(
        'ubuhumyi',
        '14',
        'blindness',
        null,
        null,
        ['Ubuhumyi bushobora kwirindwa.', 'Blindness can be prevented.'],
        ['health'],
      ),
      v('kwiyogoshesha', 'iyogoshesh', 'to get a haircut', 'get a haircut', 'gets a haircut', [
        'Ngiye kwiyogoshesha.',
        "I'm going to get a haircut.",
      ]),
    ],
  },
  {
    topic: 'health',
    picturable: true,
    words: [
      n('igipfuko', '7/8', 'bandage', 'ibipfuko', 'bandages', [
        'Bamushyize igipfuko ku kuboko.',
        'They put a bandage on his or her arm.',
      ]),
      n('serumu', '9/10', 'drip (IV)', 'serumu', 'drips', [
        'Umurwayi ari kuri serumu.',
        'The patient is on a drip.',
      ]),
      n('imbago', '9/10', 'crutch', 'imbago', 'crutches', [
        'Agenda akoresheje imbago.',
        'He or she walks with crutches.',
      ]),
      n('inkomere', '9/10', 'injured person', 'inkomere', 'the injured', [
        'Inkomere zajyanywe ku bitaro.',
        'The injured were taken to hospital.',
      ]),
      n('umubyaza', '1/2', 'midwife', 'ababyaza', 'midwives', [
        'Umubyaza yafashije umubyeyi kubyara.',
        'The midwife helped the mother give birth.',
      ]),
      n('umuvuzi', '1/2', 'healer', 'abavuzi', 'healers', [
        'Umuvuzi gakondo akoresha ibyatsi.',
        'The traditional healer uses herbs.',
      ]),
      n('ubushye', '14', 'burn (injury)', null, null, [
        'Ubushye bwe burakomeye.',
        'His or her burn is serious.',
      ]),
      n('imvune', '9/10', 'fracture, sprain', 'imvune', 'fractures', [
        'Yagize imvune ku kuguru.',
        'He or she has a fractured leg.',
      ]),
      n('ibise', '8', 'labour pains, contractions', null, null, [
        'Yafashwe n’ibise nijoro.',
        'Her labour pains started in the night.',
      ]),
      v('gupfuka', 'pfuk', 'to bandage, to cover', 'bandage', 'bandages', [
        'Pfuka igikomere.',
        'Bandage the wound.',
      ]),
      v('gukingira', 'kingir', 'to vaccinate; to protect', 'vaccinate', 'vaccinates', [
        'Urukingo rukingira indwara.',
        'A vaccine protects against disease.',
      ]),
      v(
        'kwisuzumisha',
        'isuzumish',
        'to get a check-up, to get tested',
        'get tested',
        'gets tested',
        ['Jya kwisuzumisha buri mwaka.', 'Get a check-up every year.'],
      ),
    ],
  },
  {
    topic: 'health',
    picturable: false,
    words: [
      n('umusonga', '3', 'pneumonia', null, null, [
        'Umusonga ufata ibihaha.',
        'Pneumonia affects the lungs.',
      ]),
      n('iseru', '5', 'measles', null, null, [
        'Abana bakingiwe iseru.',
        'The children were vaccinated against measles.',
      ]),
      n('macinya', '9', 'dysentery', null, null, [
        'Amazi mabi atera macinya.',
        'Dirty water causes dysentery.',
      ]),
      n('kolera', '9', 'cholera', null, null, [
        'Kolera iterwa n’umwanda.',
        'Cholera is caused by dirt.',
      ]),
      n('ibisazi', '8', 'rabies; madness', null, null, [
        'Imbwa zikingirwa ibisazi.',
        'Dogs are vaccinated against rabies.',
      ]),
      n('ubwandu', '14', 'infection', null, null, [
        'Igikomere cyagize ubwandu.',
        'The wound got infected.',
      ]),
      v('kwandura', 'andur', 'to catch (an illness), to be infected', 'catch', 'catches', [
        'Yanduye ibicurane.',
        'He or she caught a cold.',
      ]),
      v('kuremba', 'remb', 'to be seriously ill', 'are seriously ill', 'is seriously ill', [
        'Sogokuru ararembye.',
        'Grandfather is seriously ill.',
      ]),
      v('kuvunika', 'vunik', 'to break (a bone)', 'break', 'breaks', [
        'Yavunitse ukuguru.',
        'He or she broke a leg.',
      ]),
      v('kuniha', 'nih', 'to groan, to moan', 'groan', 'groans', [
        'Umurwayi araniha.',
        'The patient is groaning.',
      ]),
      v('gusinda', 'sind', 'to get drunk', 'get drunk', 'gets drunk', [
        'Yasinze cyane ejo.',
        'He or she got very drunk yesterday.',
      ]),
      o('ndwaye', "I'm sick", ['Ndwaye, ngiye kwa muganga.', "I'm sick; I'm going to the doctor."]),
      o('urakire', 'get well (soon)', [
        'Urakire vuba, nshuti yanjye.',
        'Get well soon, my friend.',
      ]),
    ],
  },
];
