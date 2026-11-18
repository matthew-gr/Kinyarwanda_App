// Common 2000, second part (draft B): words for ranks 1501 to 2000, in clusters, drafted like
// Common 1500 (see common-1500.ts). Nature and landscape, animals, insects and birds, farming
// and livestock, weather and seasons, places, roads and travel, transport, and tools and
// materials. They avoid every word already in the course, and picturable clusters lead.
//
// AI DRAFT. Written by Claude, not yet checked by a native speaker.

import { n, o, v, type Cluster } from './words.ts';

const F = ['function'];

export const COMMON_2000_NATURE: Cluster[] = [
  {
    topic: 'animals',
    picturable: true,
    words: [
      n('umusambi', '3/4', 'crowned crane', 'imisambi', 'crowned cranes', [
        'Umusambi ni inyoni nziza.',
        'The crowned crane is a beautiful bird.',
      ]),
      n('inyange', '9/10', 'egret', 'inyange', 'egrets', [
        'Inyange ni inyoni yera.',
        'The egret is a white bird.',
      ]),
      n('igihunyira', '7/8', 'owl', 'ibihunyira', 'owls', [
        'Igihunyira kiguruka nijoro.',
        'The owl flies at night.',
      ]),
      n('igisiga', '7/8', 'hawk, bird of prey', 'ibisiga', 'hawks', [
        'Igisiga cyatwaye umushwi.',
        'A hawk took a chick.',
      ]),
      n('intashya', '9/10', 'swallow (bird)', 'intashya', 'swallows', [
        'Intashya ziguruka hejuru y’amazi.',
        'Swallows fly over the water.',
      ]),
      n('inkware', '9/10', 'francolin, wild partridge', 'inkware', 'francolins', [
        'Inkware yihishe mu byatsi.',
        'The francolin hid in the grass.',
      ]),
      n('icyari', '7/8', 'nest', 'ibyari', 'nests', [
        'Inyoni yubatse icyari mu giti.',
        'The bird built a nest in the tree.',
      ]),
      n('ibaba', '5/6', 'wing; feather', 'amababa', 'wings; feathers', [
        'Inyoni yavunitse ibaba.',
        'The bird broke its wing.',
      ]),
      n('umushwi', '3/4', 'chick', 'imishwi', 'chicks', [
        'Inkoko ifite imishwi itandatu.',
        'The hen has six chicks.',
      ]),
    ],
  },
  {
    topic: 'animals',
    picturable: true,
    words: [
      n('igitera', '7/8', 'baboon', 'ibitera', 'baboons', [
        'Ibitera biba mu ishyamba.',
        'Baboons live in the forest.',
      ]),
      n('imbwebwe', '9/10', 'jackal', 'imbwebwe', 'jackals', [
        'Imbwebwe yariye inkoko.',
        'The jackal ate a chicken.',
      ]),
      n('umuserebanya', '3/4', 'lizard', 'imiserebanya', 'lizards', [
        'Umuserebanya uri ku rukuta.',
        "There's a lizard on the wall.",
      ]),
      n('ikinyamushongo', '7/8', 'snail', 'ibinyamushongo', 'snails', [
        'Ikinyamushongo kigenda buhoro.',
        'The snail moves slowly.',
      ]),
      n('inzige', '9/10', 'locust', 'inzige', 'locusts', [
        'Inzige zangije imyaka.',
        'Locusts destroyed the crops.',
      ]),
      n('ikirondwe', '7/8', 'tick (insect)', 'ibirondwe', 'ticks', [
        'Inka ifite ibirondwe.',
        'The cow has ticks.',
      ]),
      n('ivubi', '5/6', 'wasp', 'amavubi', 'wasps', ['Ivubi ryandumye.', 'A wasp stung me.']),
      n('ikinyabuzima', '7/8', 'living thing, creature', 'ibinyabuzima', 'living things', [
        'Amazi ni ingenzi ku binyabuzima byose.',
        'Water is essential for all living things.',
      ]),
      n('umuhigi', '1/2', 'hunter', 'abahigi', 'hunters', [
        'Umuhigi yagiye mu ishyamba.',
        'The hunter went into the forest.',
      ]),
      v('guhiga', 'hig', 'to hunt', 'hunt', 'hunts', [
        'Intare zihiga nijoro.',
        'Lions hunt at night.',
      ]),
      v('gutontoma', 'tontom', 'to roar', 'roar', 'roars', [
        'Intare iratontoma.',
        'The lion is roaring.',
      ]),
    ],
  },
  {
    topic: 'farming',
    picturable: true,
    words: [
      n('itungo', '5/6', 'domestic animal, head of livestock', 'amatungo', 'livestock', [
        'Inka ni itungo ry’ingenzi.',
        'The cow is an important domestic animal.',
      ]),
      n('ubushyo', '14/6', 'herd (of cattle)', 'amashyo', 'herds', [
        'Afite ubushyo bw’inka.',
        'He or she has a herd of cows.',
      ]),
      n('umukumbi', '3/4', 'flock', 'imikumbi', 'flocks', [
        'Umukumbi w’intama uri ku musozi.',
        'A flock of sheep is on the hill.',
      ]),
      n('isekurume', '9/10', 'billy goat, male goat', 'isekurume', 'billy goats', [
        'Agiye kugurisha isekurume.',
        'He or she is going to sell the billy goat.',
      ]),
      n('igisabo', '7/8', 'churn (gourd for making butter)', 'ibisabo', 'churns', [
        'Bacunda amata mu gisabo.',
        'They churn milk in the churn.',
      ]),
      n('amase', '6', 'cow dung', null, null, [
        'Amase y’inka ni ifumbire nziza.',
        'Cow dung is good fertilizer.',
      ]),
      n('umutiba', '3/4', 'beehive', 'imitiba', 'beehives', [
        'Inzuki ziri mu mutiba.',
        'The bees are in the hive.',
      ]),
      n('umuvumvu', '1/2', 'beekeeper', 'abavumvu', 'beekeepers', [
        'Umuvumvu yasaruye ubuki.',
        'The beekeeper harvested honey.',
      ]),
      v('kurisha', 'rish', 'to graze', 'graze', 'grazes', [
        'Inka zirisha ku musozi.',
        'The cows graze on the hill.',
      ]),
      v('konka', 'onk', 'to suckle', 'suckle', 'suckles', [
        'Inyana irimo konka.',
        'The calf is suckling.',
      ]),
      v('kuzirika', 'zirik', 'to tie up, to tether (an animal)', 'tie up', 'ties up', [
        'Zirika ihene ku giti.',
        'Tie the goat to the tree.',
      ]),
      v('kuzitira', 'zitir', 'to fence in', 'fence in', 'fences in', [
        'Bazitiye umurima.',
        'They fenced the field.',
      ]),
    ],
  },
  {
    topic: 'farming',
    picturable: true,
    words: [
      n('iterasi', '5/6', 'terrace (on a hillside)', 'amaterasi', 'terraces', [
        'Bahinga ku materasi.',
        'They farm on terraces.',
      ]),
      n('imborera', '9', 'compost, organic manure', null, null, [
        'Shyira imborera mu murima.',
        'Put compost on the field.',
      ]),
      n('icyonnyi', '7/8', 'crop pest', 'ibyonnyi', 'crop pests', [
        'Ibyonnyi byangije ibishyimbo.',
        'Pests have damaged the beans.',
      ]),
      n('urutaro', '11/10', 'winnowing tray', 'intaro', 'winnowing trays', [
        'Agosora ibishyimbo ku rutaro.',
        'He or she winnows beans on a winnowing tray.',
      ]),
      n('ipamba', '5', 'cotton', null, null, [
        'Ipamba rikoreshwa mu gukora imyenda.',
        'Cotton is used to make clothes.',
      ]),
      n('ikirundo', '7/8', 'pile, heap', 'ibirundo', 'piles', [
        'Hari ikirundo cy’ibigori mu gikari.',
        "There's a heap of maize in the yard.",
      ]),
      n('ihwa', '5/6', 'thorn', 'amahwa', 'thorns', [
        'Ihwa ryanjombye ikirenge.',
        'A thorn pricked my foot.',
      ]),
      v('kumera', 'mer', 'to sprout, to germinate', 'sprout', 'sprouts', [
        'Ibishyimbo byameze.',
        'The beans have sprouted.',
      ]),
      v('kurabya', 'raby', 'to flower, to bloom', 'flower', 'flowers', [
        'Ibiti birarabya.',
        'The trees are flowering.',
      ]),
      v('gutonora', 'tonor', 'to shell (beans, peas)', 'shell', 'shells', [
        'Turimo gutonora amashaza.',
        "We're shelling peas.",
      ]),
      v('kugosora', 'gosor', 'to winnow', 'winnow', 'winnows', [
        'Arimo kugosora amasaka.',
        'He or she is winnowing sorghum.',
      ]),
      v('kwanika', 'anik', 'to spread out to dry', 'spread out to dry', 'spreads out to dry', [
        'Anika ibigori ku zuba.',
        'Spread the maize out in the sun.',
      ]),
      v('kurunda', 'rund', 'to pile up', 'pile up', 'piles up', [
        'Barunda amabuye iruhande rw’umuhanda.',
        'They pile stones beside the road.',
      ]),
    ],
  },
  {
    topic: 'places',
    picturable: true,
    words: [
      n('impinga', '9/10', 'peak, summit', 'impinga', 'peaks', [
        'Twageze ku mpinga y’umusozi.',
        'We reached the top of the hill.',
      ]),
      n('ubuvumo', '14', 'cave', null, null, [
        'Abakerarugendo basuye ubuvumo.',
        'The tourists visited the cave.',
      ]),
      n('iriba', '5/6', 'well (for water)', 'amariba', 'wells', [
        'Bavoma amazi ku iriba.',
        'They fetch water at the well.',
      ]),
      n('icyuzi', '7/8', 'pond', 'ibyuzi', 'ponds', [
        'Yorora amafi mu cyuzi.',
        'He or she raises fish in a pond.',
      ]),
      n('umuraba', '3/4', 'wave (on water)', 'imiraba', 'waves', [
        'Imiraba irakomeye uyu munsi.',
        'The waves are strong today.',
      ]),
      n('igihuru', '7/8', 'bush, shrub', 'ibihuru', 'bushes', [
        'Urukwavu rwihishe mu gihuru.',
        'The rabbit hid in the bush.',
      ]),
      n('umugano', '3/4', 'bamboo', 'imigano', 'bamboo canes', [
        'Uruzitiro rwakozwe mu migano.',
        'The fence is made of bamboo.',
      ]),
      n('urufunzo', '11/10', 'papyrus', 'imfunzo', 'papyrus plants', [
        'Urufunzo rumera mu gishanga.',
        'Papyrus grows in the marsh.',
      ]),
      n('inturusu', '9/10', 'eucalyptus tree', 'inturusu', 'eucalyptus trees', [
        'Inturusu ni ibiti birebire.',
        'Eucalyptus trees are tall trees.',
      ]),
      n('umuvumu', '3/4', 'fig tree (ficus)', 'imivumu', 'fig trees', [
        'Twicaye munsi y’umuvumu.',
        'We sat under the fig tree.',
      ]),
      n('umunyinya', '3/4', 'acacia tree', 'iminyinya', 'acacia trees', [
        'Umunyinya ufite amahwa.',
        'The acacia has thorns.',
      ]),
      o(
        'bihanamye',
        'steep (things)',
        ['Ibice bihanamye by’umusozi.', 'The steep parts of the hill.'],
        ['colours'],
      ),
      o(
        'biringaniye',
        'flat, level; average (things)',
        ['Ibibanza biringaniye.', 'Level plots.'],
        ['colours'],
      ),
    ],
  },
  {
    topic: 'weather',
    picturable: true,
    words: [
      n('iteganyagihe', '5', 'weather forecast', null, null, [
        'Iteganyagihe rivuga ko imvura izagwa ejo.',
        'The forecast says it will rain tomorrow.',
      ]),
      n('dogere', '9/10', 'degree (of temperature)', 'dogere', 'degrees', [
        'Uyu munsi hari dogere makumyabiri n’eshanu.',
        "Today it's 25 degrees.",
      ]),
      n('ubuhehere', '14', 'humidity, dampness', null, null, [
        'Muri iki gihe hari ubuhehere bwinshi.',
        "There's a lot of humidity at this time of year.",
      ]),
      n('igitonyanga', '7/8', 'drop (of liquid)', 'ibitonyanga', 'drops', [
        'Ibitonyanga by’imvura biragwa.',
        'Raindrops are falling.',
      ]),
      n('umubumbe', '3/4', 'planet', 'imibumbe', 'planets', [
        'Isi ni umubumbe.',
        'The earth is a planet.',
      ]),
      v('kwijima', 'ijim', 'to get dark, to cloud over', 'get dark', 'gets dark', [
        'Ikirere cyijimye, imvura igiye kugwa.',
        "The sky has gone dark; it's about to rain.",
      ]),
      v('gucya', 'cy', 'to dawn, to get light', 'dawn', 'dawns', [
        'Twahagurutse butaracya.',
        'We set off before dawn.',
      ]),
      v('kurasa', 'ras', 'to rise (of the sun); to shoot', 'rise; shoot', 'rises; shoots', [
        'Izuba rirasa saa kumi n’ebyiri.',
        "The sun rises at six o'clock.",
      ]),
      v('kuma', 'um', 'to dry, to dry up', 'dry', 'dries', [
        'Imyenda yumye vuba kubera izuba.',
        'The clothes dried quickly because of the sun.',
      ]),
      v('kumurika', 'murik', 'to shine, to give light', 'shine', 'shines', [
        'Ukwezi kuramurika.',
        'The moon is shining.',
      ]),
      v('gutonyanga', 'tonyang', 'to drip, to leak', 'drip', 'drips', [
        'Igisenge kiratonyanga.',
        'The roof is dripping.',
      ]),
    ],
  },
  {
    topic: 'weather',
    picturable: true,
    words: [
      n('inkangu', '9/10', 'landslide', 'inkangu', 'landslides', [
        'Inkangu yasenye amazu.',
        'The landslide destroyed houses.',
      ]),
      n('umutingito', '3/4', 'earthquake', 'imitingito', 'earthquakes', [
        'Umutingito wumvikanye i Rubavu.',
        'The earthquake was felt in Rubavu.',
      ]),
      n('isuri', '9', 'soil erosion', null, null, [
        'Amaterasi arinda isuri.',
        'Terraces prevent erosion.',
      ]),
      n('inkongi', '9/10', 'blaze, big fire', 'inkongi', 'blazes', [
        'Inkongi y’umuriro yibasiye isoko.',
        'A fire broke out at the market.',
      ]),
      v('gusenyuka', 'senyuk', 'to collapse, to fall down', 'collapse', 'collapses', [
        'Inzu yasenyutse kubera imvura.',
        'The house collapsed because of the rain.',
      ]),
      v('gusenya', 'seny', 'to destroy, to knock down', 'destroy', 'destroys', [
        'Umuyaga wasenye igisenge.',
        'The wind destroyed the roof.',
      ]),
      v('kurohama', 'roham', 'to drown, to sink', 'drown', 'drowns', [
        'Ubwato bwarohamye mu kiyaga.',
        'The boat sank in the lake.',
      ]),
      v('gutenguka', 'tenguk', 'to cave in, to slide (of earth)', 'cave in', 'caves in', [
        'Umusozi waratengutse.',
        'The hillside caved in.',
      ]),
      v('gushya', 'shy', 'to burn, to be on fire', 'burn', 'burns', [
        'Inzu irimo gushya!',
        'The house is on fire!',
      ]),
      v('kwangiza', 'angiz', 'to damage, to spoil', 'damage', 'damages', [
        'Urubura rwangije imyaka.',
        'The hail damaged the crops.',
      ]),
    ],
  },
  {
    topic: 'places',
    picturable: true,
    words: [
      n('igare', '5/6', 'bicycle', 'amagare', 'bicycles', [
        'Ajya ku kazi n’igare.',
        'He or she goes to work by bicycle.',
      ]),
      n('umunyamaguru', '1/2', 'pedestrian', 'abanyamaguru', 'pedestrians', [
        'Imodoka zigomba guhagarara ngo abanyamaguru bambuke.',
        'Cars must stop so that pedestrians can cross.',
      ]),
      n('gariyamoshi', '9/10', 'train', 'gariyamoshi', 'trains', [
        'Nta gariyamoshi iri mu Rwanda.',
        "There's no train in Rwanda.",
      ]),
      n('kajugujugu', '9/10', 'helicopter', 'kajugujugu', 'helicopters', [
        'Kajugujugu iraguruka hejuru y’umujyi.',
        'A helicopter is flying over the city.',
      ]),
      n('moteri', '9/10', 'engine, motor', 'moteri', 'engines', [
        'Moteri y’imodoka yapfuye.',
        "The car's engine has broken down.",
      ]),
      n('feri', '9/10', 'brake', 'feri', 'brakes', ['Feri ntizikora.', "The brakes don't work."]),
      n('ikibuga cy’indege', '7/8', 'airport', 'ibibuga by’indege', 'airports', [
        'Indege yageze ku kibuga cy’indege.',
        'The plane has arrived at the airport.',
      ]),
      n('ubwikorezi', '14', 'transport', null, null, [
        'Ubwikorezi bwo mu mujyi bwarahendutse.',
        'Transport in town has got cheaper.',
      ]),
      n('ikorosi', '5/6', 'bend, curve (in a road)', 'amakorosi', 'bends', [
        'Witonde ku ikorosi.',
        'Be careful at the bend.',
      ]),
      n('ikinogo', '7/8', 'pothole', 'ibinogo', 'potholes', [
        'Umuhanda wuzuye ibinogo.',
        'The road is full of potholes.',
      ]),
      v('kunyonga', 'nyong', 'to pedal, to ride (a bicycle)', 'ride', 'rides', [
        'Anyonga igare buri munsi.',
        'He or she rides a bike every day.',
      ]),
      v('gupakurura', 'pakurur', 'to unload', 'unload', 'unloads', [
        'Barapakurura ikamyo.',
        "They're unloading the lorry.",
      ]),
    ],
  },
  {
    topic: 'places',
    picturable: true,
    words: [
      n('ambasade', '9/10', 'embassy', 'ambasade', 'embassies', [
        'Nagiye kuri ambasade gusaba viza.',
        'I went to the embassy to apply for a visa.',
      ]),
      n('inzu ndangamurage', '9/10', 'museum', 'inzu ndangamurage', 'museums', [
        'Twasuye inzu ndangamurage i Huye.',
        'We visited the museum in Huye.',
      ]),
      n('urwibutso', '11/10', 'memorial; souvenir', 'inzibutso', 'memorials', [
        'Twasuye urwibutso rwa Jenoside.',
        'We visited the Genocide memorial.',
      ]),
      n('irimbi', '5/6', 'cemetery', 'amarimbi', 'cemeteries', [
        'Bamushyinguye mu irimbi.',
        'They buried him or her in the cemetery.',
      ]),
      n('imva', '9/10', 'grave', 'imva', 'graves', [
        'Imva ya sogokuru iri hano.',
        "My grandfather's grave is here.",
      ]),
      n('inkambi', '9/10', 'camp', 'inkambi', 'camps', [
        'Impunzi ziba mu nkambi.',
        'The refugees live in a camp.',
      ]),
      n('ikibanza', '7/8', 'plot (of land to build on)', 'ibibanza', 'plots', [
        'Yaguze ikibanza cyo kubakamo.',
        'He or she bought a plot to build on.',
      ]),
      n('ubusitani', '14', 'garden', null, null, [
        'Afite ubusitani bwiza.',
        'He or she has a beautiful garden.',
      ]),
      n('umunara', '3/4', 'tower, mast', 'iminara', 'towers', [
        'Umunara wa telefoni uri ku musozi.',
        'The phone mast is on the hill.',
      ]),
      n('urugomero', '11/10', 'dam', 'ingomero', 'dams', [
        'Urugomero rutanga amashanyarazi.',
        'The dam produces electricity.',
      ]),
      v('gutura', 'tur', 'to live, to settle (in a place)', 'live', 'lives', [
        'Ntuye i Kigali.',
        'I live in Kigali.',
      ]),
    ],
  },
  {
    topic: 'work',
    picturable: true,
    words: [
      n('umukasi', '3/4', 'scissors', 'imikasi', 'pairs of scissors', [
        'Mpa umukasi.',
        'Give me the scissors.',
      ]),
      n('ingufuri', '9/10', 'padlock', 'ingufuri', 'padlocks', [
        'Funga urugi n’ingufuri.',
        'Lock the door with the padlock.',
      ]),
      n('umunyururu', '3/4', 'chain', 'iminyururu', 'chains', [
        'Igare rifite umunyururu.',
        'The bicycle has a chain.',
      ]),
      n('urubaho', '11/10', 'plank, board', 'imbaho', 'planks', [
        'Umubaji akoresha imbaho.',
        'The carpenter uses planks.',
      ]),
      n('ibumba', '5', 'clay', null, null, [
        'Inkono zibumbwa mu ibumba.',
        'Pots are made of clay.',
      ]),
      n('umuringa', '3', 'copper, brass', null, null, [
        'Iki gikomo gikozwe mu muringa.',
        'This bracelet is made of copper.',
      ]),
      n('pulasitiki', '9', 'plastic', null, null, [
        'Iyi ntebe ikozwe muri pulasitiki.',
        'This chair is made of plastic.',
      ]),
      n('ingunguru', '9/10', 'drum, barrel', 'ingunguru', 'drums', [
        'Ingunguru yuzuye amazi.',
        'The barrel is full of water.',
      ]),
      n('umwobo', '3/4', 'hole, pit', 'imyobo', 'holes', [
        'Bacukura umwobo wo gutera igiti.',
        'They dig a hole to plant a tree.',
      ]),
      v('gukerera', 'kerer', 'to saw', 'saw', 'saws', [
        'Arimo gukerera imbaho.',
        'He or she is sawing planks.',
      ]),
      v('gutobora', 'tobor', 'to make a hole, to pierce', 'make a hole', 'makes a hole', [
        'Tobora umwobo mu rukuta.',
        'Make a hole in the wall.',
      ]),
      v('guhambira', 'hambir', 'to tie up, to bundle', 'tie up', 'ties up', [
        'Hambira inkwi n’umugozi.',
        'Tie up the firewood with rope.',
      ]),
      v('gusatura', 'satur', 'to split (wood)', 'split', 'splits', [
        'Arimo gusatura inkwi.',
        'He or she is splitting firewood.',
      ]),
    ],
  },
  {
    topic: 'places',
    picturable: false,
    words: [
      o('i', 'to, at, in (before place names)', ['Ngiye i Huye.', "I'm going to Huye."], F),
      o('kwa', 'at or to the home of', ['Ngiye kwa muganga.', "I'm going to the doctor's."], F),
      o(
        'hakuno',
        'on this side',
        ['Ishuri riri hakuno y’umugezi.', 'The school is on this side of the river.'],
        F,
      ),
      o(
        'imusozi',
        'up in the hills, in the countryside',
        ['Ababyeyi banjye baba imusozi.', 'My parents live up in the hills.'],
        F,
      ),
      o(
        'hirya no hino',
        'here and there, all over',
        ['Abantu baturutse hirya no hino.', 'People came from all over.'],
        F,
      ),
      o('mu mahanga', 'abroad', ['Yize mu mahanga.', 'He or she studied abroad.'], F),
      o('n’amaguru', 'on foot', ['Twagiye n’amaguru.', 'We went on foot.'], F),
      o('mu nzira', 'on the way', ['Ndi mu nzira.', "I'm on my way."], F),
      v('kwerekeza', 'erekez', 'to head (towards)', 'head', 'heads', [
        'Bisi yerekeje i Musanze.',
        'The bus headed for Musanze.',
      ]),
      v('gucumbika', 'cumbik', 'to lodge, to stay the night (as a guest)', 'lodge', 'lodges', [
        'Twacumbitse kwa nyirarume.',
        "We stayed at our uncle's.",
      ]),
    ],
  },
];
