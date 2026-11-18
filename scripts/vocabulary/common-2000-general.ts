// Common 2000, part of ranks 1501 to 2000, in clusters, drafted like Common 1500 (see
// common-1500.ts). These are everyday and abstract words: verbs for thinking, speaking, getting
// on with people, moving and changing; feelings, character and behaviour; descriptions of
// qualities, sizes and shapes; time expressions; and more function words. None of them is in the
// first 1,500 words.
//
// AI DRAFT. Written by Claude, not yet checked by a native speaker.

import { n, o, v, type Cluster } from './words.ts';

const F = ['function'];

export const COMMON_2000_GENERAL: Cluster[] = [
  {
    topic: 'actions',
    picturable: false,
    words: [
      v('gutekereza', 'tekerez', 'to think', 'think', 'thinks', [
        'Ndatekereza ko azaza.',
        'I think he or she will come.',
      ]),
      v('kugerageza', 'geragez', 'to try', 'try', 'tries', ['Gerageza nanone.', 'Try again.']),
      v('gukeka', 'kek', 'to suspect, to guess', 'suspect', 'suspects', [
        'Ndakeka ko ari we.',
        'I suspect it is him or her.',
      ]),
      v('kwibaza', 'ibaz', 'to wonder, to ask oneself', 'wonder', 'wonders', [
        'Nibaza impamvu atinze.',
        'I wonder why he or she is late.',
      ]),
      v('gusobanukirwa', 'sobanukirw', 'to understand clearly, to grasp', 'grasp', 'grasps', [
        'Ubu nasobanukiwe.',
        'Now I understand.',
      ]),
      v('kwiyemeza', 'iyemez', 'to resolve, to make up one’s mind', 'resolve', 'resolves', [
        'Yiyemeje kureka itabi.',
        'He or she resolved to give up smoking.',
      ]),
      v('kwitega', 'iteg', 'to expect', 'expect', 'expects', [
        'Sinabyitegaga.',
        "I didn't expect it.",
      ]),
      v('gukemura', 'kemur', 'to solve, to settle', 'solve', 'solves', [
        'Twakemuye ikibazo.',
        'We solved the problem.',
      ]),
      v('kwemeza', 'emez', 'to convince; to confirm', 'convince', 'convinces', [
        'Yanyemeje ko ari ukuri.',
        'He or she convinced me it was true.',
      ]),
      v('kurota', 'rot', 'to dream', 'dream', 'dreams', [
        'Narose ndi iwacu.',
        'I dreamt I was back home.',
      ]),
      n('inzozi', '9/10', 'dream', 'inzozi', 'dreams', [
        'Inzozi zanjye ni ukuba umuganga.',
        'My dream is to be a doctor.',
      ]),
      n('ikosa', '5/6', 'mistake', 'amakosa', 'mistakes', ['Nakoze ikosa.', 'I made a mistake.']),
    ],
  },
  {
    topic: 'actions',
    picturable: false,
    words: [
      v('kuganira', 'ganir', 'to chat, to talk', 'chat', 'chats', [
        'Twaganiriye igihe kirekire.',
        'We talked for a long time.',
      ]),
      n('ikiganiro', '7/8', 'conversation; talk, (radio) programme', 'ibiganiro', 'conversations', [
        'Twagiranye ikiganiro cyiza.',
        'We had a good conversation.',
      ]),
      v('guceceka', 'cecek', 'to be quiet, to keep silent', 'keep quiet', 'keeps quiet', [
        'Ceceka gato.',
        'Be quiet a moment.',
      ]),
      v('gusakuza', 'sakuz', 'to make noise', 'make noise', 'makes noise', [
        'Abana barasakuza.',
        'The children are making noise.',
      ]),
      v('kumenyesha', 'menyesh', 'to inform, to let know', 'inform', 'informs', [
        'Menyesha abandi.',
        'Let the others know.',
      ]),
      v('kuburira', 'burir', 'to warn', 'warn', 'warns', ['Naramuburiye.', 'I warned him or her.']),
      v('gusezera', 'sezer', 'to say goodbye, to take leave', 'say goodbye', 'says goodbye', [
        'Yaje gusezera.',
        'He or she came to say goodbye.',
      ]),
      v('kwisegura', 'isegur', 'to apologise, to excuse oneself', 'apologise', 'apologises', [
        'Ndisegura kuba natinze.',
        'I apologise for being late.',
      ]),
      v('gutuka', 'tuk', 'to insult', 'insult', 'insults', [
        'Ntugatuke abantu.',
        "Don't insult people.",
      ]),
      n('igitutsi', '7/8', 'insult', 'ibitutsi', 'insults', [
        'Ibitutsi birababaza.',
        'Insults hurt.',
      ]),
      n('ikinyoma', '7/8', 'lie', 'ibinyoma', 'lies', ['Ibyo ni ikinyoma.', "That's a lie."]),
      n('ibanga', '5/6', 'secret', 'amabanga', 'secrets', ['Bika ibanga.', 'Keep the secret.']),
      n('impaka', '9/10', 'argument, debate', 'impaka', 'arguments', [
        'Habaye impaka nyinshi.',
        'There was a lot of argument.',
      ]),
    ],
  },
  {
    topic: 'actions',
    picturable: false,
    words: [
      v('gusangira', 'sangir', 'to share (a meal, a drink)', 'share', 'shares', [
        'Twasangiye ifunguro.',
        'We shared a meal.',
      ]),
      v('kugabana', 'gaban', 'to share out, to divide up', 'share out', 'shares out', [
        'Bagabanye isambu.',
        'They divided up the land.',
      ]),
      v('gutandukana', 'tandukan', 'to part, to separate', 'part', 'parts', [
        'Twatandukanye ku isoko.',
        'We parted at the market.',
      ]),
      v('kwigana', 'igan', 'to imitate', 'imitate', 'imitates', [
        'Umwana yigana se.',
        'The child imitates his or her father.',
      ]),
      v('guhangana', 'hangan', 'to face up to, to compete', 'face up to', 'faces up to', [
        'Bahanganye n’ikibazo.',
        'They faced up to the problem.',
      ]),
      v('kubahiriza', 'ubahiriz', 'to respect, to abide by (rules)', 'abide by', 'abides by', [
        'Twubahiriza amategeko.',
        'We abide by the laws.',
      ]),
      v('kwihorera', 'ihorer', 'to take revenge', 'take revenge', 'takes revenge', [
        'Ntukihorere.',
        "Don't take revenge.",
      ]),
      v('gushuka', 'shuk', 'to deceive, to trick', 'deceive', 'deceives', [
        'Yanshutse.',
        'He or she tricked me.',
      ]),
      v('gutabaza', 'tabaz', 'to call for help', 'call for help', 'calls for help', [
        'Yatabaje abaturanyi.',
        'He or she called the neighbours for help.',
      ]),
      v('kwiringira', 'iringir', 'to trust, to rely on', 'trust', 'trusts', [
        'Ndakwiringiye.',
        'I trust you.',
      ]),
      v('gusezeranya', 'sezerany', 'to promise', 'promise', 'promises', [
        'Yansezeranyije kuzaza.',
        'He or she promised me to come.',
      ]),
      n('ubufatanye', '14', 'cooperation', null, null, [
        'Ubufatanye ni ingenzi.',
        'Cooperation is essential.',
      ]),
      n('umubano', '3', 'relations, relationship', null, null, [
        'Umubano w’ibihugu byombi ni mwiza.',
        'Relations between the two countries are good.',
      ]),
    ],
  },
  {
    topic: 'actions',
    picturable: false,
    words: [
      v('guhinduka', 'hinduk', 'to change, to become different', 'change', 'changes', [
        'Ibintu byarahindutse.',
        'Things have changed.',
      ]),
      v('guhindura', 'hindur', 'to change (something)', 'change', 'changes', [
        'Hindura imyenda.',
        'Change your clothes.',
      ]),
      n('impinduka', '9/10', 'change', 'impinduka', 'changes', [
        'Twabonye impinduka mu buzima bwacu.',
        "We've seen changes in our lives.",
      ]),
      v('kuguma', 'gum', 'to stay, to remain', 'stay', 'stays', ['Guma hano.', 'Stay here.']),
      v('gusigara', 'sigar', 'to be left (over, behind)', 'be left', 'is left', [
        'Hasigaye iminota itanu.',
        'There are five minutes left.',
      ]),
      v('kurenga', 'reng', 'to go past, to go beyond', 'go past', 'goes past', [
        'Twarenze inzu ye.',
        'We went past his or her house.',
      ]),
      v('kuzenguruka', 'zenguruk', 'to go round', 'go round', 'goes round', [
        'Isi izenguruka izuba.',
        'The earth goes round the sun.',
      ]),
      v('kuzerera', 'zerer', 'to wander about, to roam', 'wander', 'wanders', [
        'Ntukazerere nijoro.',
        "Don't wander about at night.",
      ]),
      v('gukurikirana', 'kurikiran', 'to follow up, to keep track of', 'follow up', 'follows up', [
        'Akurikirana amasomo y’abana be.',
        "He or she keeps track of his or her children's studies.",
      ]),
      v('gusubira', 'subir', 'to go back; to do again', 'go back', 'goes back', [
        'Subira mu rugo.',
        'Go back home.',
      ]),
      n('intambwe', '9/10', 'step', 'intambwe', 'steps', ['Tera intambwe imwe.', 'Take one step.']),
      v('kwirengagiza', 'irengagiz', 'to ignore, to neglect', 'ignore', 'ignores', [
        'Yirengagije inama yanjye.',
        'He or she ignored my advice.',
      ]),
    ],
  },
  {
    topic: 'feelings',
    picturable: false,
    words: [
      v('gufuha', 'fuh', 'to be jealous (in love)', 'be jealous', 'is jealous', [
        'Umugabo we arafuha cyane.',
        'Her husband is very jealous.',
      ]),
      v('gutenguha', 'tenguh', 'to let down, to disappoint', 'let down', 'lets down', [
        'Yarantengushye.',
        'He or she let me down.',
      ]),
      v('kwikanga', 'ikang', 'to be startled, to jump', 'be startled', 'is startled', [
        'Nikanze numvise urusaku.',
        'I jumped when I heard the noise.',
      ]),
      v('kwirata', 'irat', 'to boast, to show off', 'boast', 'boasts', [
        'Akunda kwirata.',
        'He or she likes to boast.',
      ]),
      v('gusetsa', 'sets', 'to make laugh, to be funny', 'make laugh', 'makes laugh', [
        'Arasetsa cyane.',
        'He or she is very funny.',
      ]),
      v('kurakaza', 'rakaz', 'to annoy, to make angry', 'annoy', 'annoys', [
        'Ntundakaze.',
        "Don't make me angry.",
      ]),
      n('amahirwe', '6', 'luck, chance', null, null, ['Amahirwe masa!', 'Good luck!']),
      n('ibyago', '8', 'misfortune; bereavement', null, null, [
        'Yagize ibyago.',
        'He or she suffered a misfortune.',
      ]),
      n('urwenya', '11', 'humour, joking', null, null, [
        'Akunda urwenya.',
        'He or she loves a joke.',
      ]),
      n('icyifuzo', '7/8', 'wish, request', 'ibyifuzo', 'wishes', [
        'Icyifuzo cyanjye ni ukwiga kaminuza.',
        'My wish is to go to university.',
      ]),
      n('ubwitange', '14', 'dedication, self-sacrifice', null, null, [
        'Akorana ubwitange.',
        'He or she works with dedication.',
      ]),
    ],
  },
  {
    topic: 'feelings',
    picturable: false,
    words: [
      n('imyitwarire', '4', 'behaviour, conduct', null, null, [
        'Imyitwarire ye ni myiza.',
        'His or her behaviour is good.',
      ]),
      v('kwitwara', 'itwar', 'to behave', 'behave', 'behaves', [
        'Yitwara neza.',
        'He or she behaves well.',
      ]),
      n('ubwitonzi', '14', 'care, carefulness, gentleness', null, null, [
        'Afite ubwitonzi.',
        'He or she is careful.',
      ]),
      n('umupfapfa', '1/2', 'fool', 'abapfapfa', 'fools', [
        'Ntukabe umupfapfa.',
        "Don't be a fool.",
      ]),
      n('ubunebwe', '14', 'laziness', null, null, [
        'Ubunebwe butera ubukene.',
        'Laziness causes poverty.',
      ]),
      n('ubuhanga', '14', 'skill, cleverness', null, null, [
        'Afite ubuhanga mu gucuranga.',
        'He or she is skilled at playing music.',
      ]),
      n('ubushobozi', '14', 'ability, means', null, null, [
        'Nta bushobozi mfite bwo kugura imodoka.',
        "I don't have the means to buy a car.",
      ]),
      n('inenge', '9/10', 'flaw, defect', 'inenge', 'flaws', [
        'Nta muntu udafite inenge.',
        'Nobody is without flaws.',
      ]),
      n('imbaraga', '10', 'strength, energy, power', null, null, [
        'Nta mbaraga mfite.',
        'I have no energy.',
      ]),
      v('gukabya', 'kaby', 'to exaggerate, to overdo it', 'exaggerate', 'exaggerates', [
        'Urakabya!',
        "You're overdoing it!",
      ]),
      n('ubwumvikane', '14', 'understanding, agreement', null, null, [
        'Hari ubwumvikane hagati yabo.',
        'There is understanding between them.',
      ]),
    ],
  },
  {
    topic: 'colours',
    picturable: false,
    words: [
      n('uburebure', '14', 'length, height', null, null, [
        'Uburebure bw’iki cyumba ni metero eshanu.',
        'The length of this room is five metres.',
      ]),
      n('uburemere', '14', 'weight', null, null, [
        'Uburemere bwawe ni ibiro bingahe?',
        'How much do you weigh?',
      ]),
      n('ubwinshi', '14', 'large number, quantity', null, null, [
        'Batangajwe n’ubwinshi bw’abantu.',
        'They were surprised by the number of people.',
      ]),
      n('umuvuduko', '3', 'speed', null, null, ['Gabanya umuvuduko.', 'Slow down.']),
      n('uruhande', '11/10', 'side', 'impande', 'sides', [
        'Hagarara ku ruhande.',
        'Stand to the side.',
      ]),
      n('inguni', '9/10', 'corner, angle', 'inguni', 'corners', [
        'Intebe iri mu nguni.',
        'The chair is in the corner.',
      ]),
      o('bingana', 'the same size, equal (things)', [
        'Ibi bice bingana.',
        'These pieces are the same size.',
      ]),
      n('icyatsi kibisi', '7', 'green (the colour)', null, null, [
        'Ibendera ry’u Rwanda rifite icyatsi kibisi.',
        "Rwanda's flag has green in it.",
      ]),
      o('byijimye', 'dark (things, colours)', [
        'Ibi bitenge byijimye cyane.',
        'These wrap cloths are very dark.',
      ]),
      o('byoroheje', 'light (in weight); simple, modest (things)', [
        'Ibi bikoresho byoroheje.',
        'These tools are light.',
      ]),
    ],
  },
  {
    topic: 'colours',
    picturable: false,
    words: [
      n('ubwiza', '14', 'beauty', null, null, [
        'Akunda ubwiza bw’imisozi.',
        'He or she loves the beauty of the hills.',
      ]),
      o('bikwiye', 'right, proper, fitting (things)', [
        'Ibyo yakoze ntibikwiye.',
        "What he or she did isn't right.",
      ]),
      o('bihagije', 'enough, sufficient (things)', [
        'Ibi birahagije, murakoze.',
        'This is enough, thank you.',
      ]),
      o('bidasanzwe', 'unusual, special (things)', [
        'Ni ibirori bidasanzwe.',
        "It's a special celebration.",
      ]),
      o('bitangaje', 'amazing, surprising (things)', [
        'Ibyo yambwiye bitangaje.',
        'What he or she told me is amazing.',
      ]),
      o('biteye ubwoba', 'frightening, terrible (things)', [
        'Ibyabaye biteye ubwoba.',
        'What happened is terrifying.',
      ]),
      o('byihuse', 'fast, quick (things); quickly', ['Bikore byihuse.', 'Do it quickly.']),
      o('bisobanutse', 'clear, easy to understand (things)', [
        'Ibyo yavuze birasobanutse.',
        'What he or she said is clear.',
      ]),
      o('bigezweho', 'modern, up to date (things)', [
        'Bafite ibikoresho bigezweho.',
        'They have modern equipment.',
      ]),
      o('bitunganye', 'in order, well done, perfect (things)', [
        'Ibintu byose bitunganye.',
        'Everything is in order.',
      ]),
    ],
  },
  {
    topic: 'time',
    picturable: false,
    words: [
      n('igicamunsi', '7/8', 'afternoon', 'ibicamunsi', 'afternoons', [
        'Nzaza ku gicamunsi.',
        "I'll come in the afternoon.",
      ]),
      n('urukerera', '11', 'the early hours, before dawn', null, null, [
        'Yabyutse mu rukerera.',
        'He or she got up before dawn.',
      ]),
      n('igisekuru', '7/8', 'generation', 'ibisekuru', 'generations', [
        'Iki gisekuru gikunda ikoranabuhanga.',
        'This generation loves technology.',
      ]),
      v('kubanza', 'banz', 'to do first, to start by', 'do first', 'does first', [
        'Banza ukarabe.',
        'Wash your hands first.',
      ]),
      v('guhora', 'hor', 'to keep (doing), to always (do)', 'keep doing', 'keeps doing', [
        'Ahora aseka.',
        'He or she is always laughing.',
      ]),
      v('gusubika', 'subik', 'to postpone', 'postpone', 'postpones', [
        'Inama yasubitswe.',
        'The meeting was postponed.',
      ]),
      v('kuramba', 'ramb', 'to last (a long time); to live long', 'last', 'lasts', [
        'Ibikoresho byiza biramba.',
        'Good tools last a long time.',
      ]),
      o(
        'igihe cyose',
        'always; whenever, any time',
        ['Uze igihe cyose ushaka.', 'Come whenever you like.'],
        F,
      ),
      o(
        'ubwa mbere',
        '(for) the first time',
        ['Ni ubwa mbere ngeze i Kigali.', "It's the first time I've been to Kigali."],
        F,
      ),
      o(
        'ubwa nyuma',
        '(for) the last time',
        ['Ni ubwa nyuma nkubwira.', "It's the last time I'm telling you."],
        F,
      ),
      o(
        'hakiri kare',
        'in good time, while it is still early',
        ['Genda hakiri kare.', 'Go while it is still early.'],
        F,
      ),
      o(
        'muri iki gihe',
        'nowadays, these days',
        ['Muri iki gihe ibiciro byarazamutse.', 'Prices have gone up these days.'],
        F,
      ),
    ],
  },
  {
    topic: 'function',
    picturable: false,
    words: [
      o(
        'ku buryo',
        'so that, in such a way that',
        ['Yavuze cyane ku buryo twese twumvise.', 'He or she spoke loudly so that we all heard.'],
        F,
      ),
      o(
        'aho kugira ngo',
        'instead of',
        ['Aho kugira ngo urire, shaka igisubizo.', 'Instead of crying, look for a solution.'],
        F,
      ),
      o(
        'cyane cyane',
        'especially',
        ['Nkunda imbuto, cyane cyane imyembe.', 'I love fruit, especially mangoes.'],
        F,
      ),
      o(
        'mu by’ukuri',
        'in fact, really',
        ['Mu by’ukuri, sinabimenye.', "In fact, I didn't know."],
        F,
      ),
      o(
        'ku bw’amahirwe',
        'luckily, fortunately',
        ['Ku bw’amahirwe, nta wakomeretse.', 'Luckily, nobody was hurt.'],
        F,
      ),
      o(
        'nta gushidikanya',
        'without doubt, certainly',
        ['Nta gushidikanya azatsinda.', 'Without doubt he or she will win.'],
        F,
      ),
      o('nk’ibisanzwe', 'as usual', ['Nk’ibisanzwe, yatinze.', 'As usual, he or she was late.'], F),
      o(
        'nuko',
        'and so, so then (in telling a story)',
        ['Nuko baragenda.', 'And so they went.'],
        F,
      ),
      o('none se', 'so then?, well then?', ['None se tugire dute?', 'So what shall we do?'], F),
      o(
        'kuri jye',
        'in my opinion, as for me',
        ['Kuri jye, ni byiza.', 'In my opinion, it is good.'],
        F,
      ),
      o(
        'buhoro buhoro',
        'little by little, gradually',
        ['Buhoro buhoro ni rwo rugendo.', 'Little by little is the way to go.'],
        F,
      ),
    ],
  },
  {
    topic: 'function',
    picturable: false,
    words: [
      o(
        'hagati aho',
        'meanwhile, in the meantime',
        ['Hagati aho, tuzaba dutegereje.', "In the meantime, we'll be waiting."],
        F,
      ),
      o(
        'si byo',
        "that's not right, no",
        ['Si byo, ntabwo ari uko byagenze.', "That's not right, that's not how it happened."],
        F,
      ),
      o(
        'nk’urugero',
        'for example',
        ['Nkunda imboga, nk’urugero ishu.', 'I like vegetables, for example cabbage.'],
        F,
      ),
      o('neza neza', 'exactly', ['Ni saa tatu neza neza.', "It's exactly nine o'clock."], F),
      o(
        'ikihe',
        'which? (for a class 7 noun)',
        ['Ni ikihe gitabo ushaka?', 'Which book do you want?'],
        F,
      ),
      o(
        'ubanza',
        'it seems, probably',
        ['Ubanza imvura igiye kugwa.', "It looks like it's going to rain."],
        F,
      ),
      o(
        'mbere na mbere',
        'first of all',
        ['Mbere na mbere, ndabashimira.', 'First of all, I thank you.'],
        F,
      ),
      o(
        'yaba',
        'whether, be it',
        ['Yaba umugabo cyangwa umugore, bose barakora.', 'Whether man or woman, everyone works.'],
        F,
      ),
      o(
        'ibyo ari byo byose',
        'anyway, whatever the case',
        ['Ibyo ari byo byose, nzaza.', "Anyway, I'll come."],
        F,
      ),
      o(
        'hamwe na hamwe',
        'here and there, in some places',
        ['Hamwe na hamwe imvura yaguye.', 'In some places it rained.'],
        F,
      ),
    ],
  },
];
