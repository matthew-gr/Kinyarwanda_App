// Common 2000, ranks 1501 to 2000 (part): society and public life, in clusters, drafted like
// Common 1500 (see common-1500.ts). Sport and leisure, work and trades, money and shopping, media
// and phones, school, government, law and justice, church, and people's roles and relationships.
// Avoids every word already in the course, and picturable clusters lead.
//
// AI DRAFT. Written by Claude, not yet checked by a native speaker.

import { n, o, v, type Cluster } from './words.ts';

const F = ['function'];

export const COMMON_2000_SOCIETY: Cluster[] = [
  {
    topic: 'people',
    picturable: true,
    words: [
      n('umukino', '3/4', 'game, match', 'imikino', 'games', [
        'Umukino utangira saa cyenda.',
        'The match starts at three in the afternoon.',
      ]),
      n('igitego', '7/8', 'goal (in football)', 'ibitego', 'goals', [
        'Yatsinze ibitego bibiri.',
        'He or she scored two goals.',
      ]),
      n('umutoza', '1/2', 'coach, trainer', 'abatoza', 'coaches', [
        'Umutoza aganira n’abakinnyi.',
        'The coach is talking with the players.',
      ]),
      n('umudali', '3/4', 'medal', 'imidali', 'medals', [
        'Yegukanye umudali wa zahabu.',
        'He or she won a gold medal.',
      ]),
      n('igihembo', '7/8', 'prize, award; reward', 'ibihembo', 'prizes', [
        'Yahawe igihembo cy’umukinnyi mwiza.',
        'He or she was given the award for best player.',
      ]),
      n('isiganwa', '5/6', 'race', 'amasiganwa', 'races', [
        'Isiganwa ry’amagare rirarangiye.',
        'The cycling race has finished.',
      ]),
      n('inanga', '9/10', 'inanga (traditional zither)', 'inanga', 'zithers', [
        'Acuranga inanga neza.',
        'He or she plays the inanga well.',
      ]),
      n('gitari', '9/10', 'guitar', 'gitari', 'guitars', [
        'Yiga gucuranga gitari.',
        'He or she is learning to play the guitar.',
      ]),
      n('imbyino', '9/10', 'dance', 'imbyino', 'dances', [
        'Intore zabyinnye imbyino za kera.',
        'The dancers performed traditional dances.',
      ]),
      n('igishushanyo', '7/8', 'drawing, diagram', 'ibishushanyo', 'drawings', [
        'Umwana yakoze igishushanyo cy’inzu.',
        'The child made a drawing of a house.',
      ]),
      v('kunganya', 'ngany', 'to draw (a match), to tie', 'draw', 'draws', [
        'Amakipe yombi yanganyije.',
        'The two teams drew.',
      ]),
      v('gufana', 'fan', 'to support (a team), to be a fan', 'support', 'supports', [
        'Ufana iyihe kipe?',
        'Which team do you support?',
      ]),
      v('gusiganwa', 'siganw', 'to race, to compete', 'race', 'races', [
        'Bazasiganwa ku cyumweru.',
        'They will race on Sunday.',
      ]),
    ],
  },
  {
    topic: 'work',
    picturable: true,
    words: [
      n('umunyonzi', '1/2', 'bicycle taxi rider', 'abanyonzi', 'bicycle taxi riders', [
        'Umunyonzi yantwaye ku igare.',
        'The bicycle taxi rider carried me on his bike.',
      ]),
      n('umuyede', '1/2', "builder's labourer", 'abayede', 'labourers', [
        'Umuyede atwara amatafari.',
        'The labourer carries the bricks.',
      ]),
      n('umupagasi', '1/2', 'day labourer', 'abapagasi', 'day labourers', [
        'Abapagasi bahinga mu murima we.',
        'Day labourers farm his or her field.',
      ]),
      n('umwogoshi', '1/2', 'barber', 'abogoshi', 'barbers', [
        'Umwogoshi yanyogoshe neza.',
        'The barber gave me a good haircut.',
      ]),
      n('umucuranzi', '1/2', 'musician (who plays an instrument)', 'abacuranzi', 'musicians', [
        'Abacuranzi bacuranze mu bukwe.',
        'The musicians played at the wedding.',
      ]),
      n('umufotozi', '1/2', 'photographer', 'abafotozi', 'photographers', [
        'Umufotozi yadufotoye.',
        'The photographer took our photo.',
      ]),
      n(
        'umukozi wo mu rugo',
        '1/2',
        'house help, domestic worker',
        'abakozi bo mu rugo',
        'house helps',
        ['Umukozi wo mu rugo yateguye ifunguro.', 'The house help prepared the meal.'],
      ),
      n('fotokopi', '9/10', 'photocopy', 'fotokopi', 'photocopies', [
        'Nkeneye fotokopi y’indangamuntu yawe.',
        'I need a photocopy of your ID card.',
      ]),
      n('umushyushyarugamba', '1/2', 'master of ceremonies, MC', 'abashyushyarugamba', 'MCs', [
        'Umushyushyarugamba yasusurukije abantu.',
        'The MC livened up the crowd.',
      ]),
      n('umusemuzi', '1/2', 'interpreter, translator', 'abasemuzi', 'interpreters', [
        'Dukeneye umusemuzi.',
        'We need an interpreter.',
      ]),
      v('gupagasa', 'pagas', 'to do casual labour', 'do casual labour', 'does casual labour', [
        'Apagasa kugira ngo abone amafaranga.',
        'He or she does casual labour to earn money.',
      ]),
      v('gusemura', 'semur', 'to translate, to interpret', 'translate', 'translates', [
        'Semura iyi baruwa mu Cyongereza.',
        'Translate this letter into English.',
      ]),
    ],
  },
  {
    topic: 'shopping',
    picturable: true,
    words: [
      n('supamaketi', '9/10', 'supermarket', 'supamaketi', 'supermarkets', [
        'Naguze amata muri supamaketi.',
        'I bought milk at the supermarket.',
      ]),
      n('igipfunyika', '7/8', 'parcel, package', 'ibipfunyika', 'parcels', [
        'Wakiriye igipfunyika cyanjye?',
        'Did you receive my parcel?',
      ]),
      n('fagitire', '9/10', 'bill, invoice', 'fagitire', 'bills', [
        'Nzanira fagitire, nyamuneka.',
        'Bring me the bill, please.',
      ]),
      n('ikimina', '7/8', 'savings group', 'ibimina', 'savings groups', [
        'Ikimina cyacu giterana buri cyumweru.',
        'Our savings group meets every week.',
      ]),
      n('ubukene', '14', 'poverty', null, null, [
        'Bararwanya ubukene.',
        'They are fighting poverty.',
      ]),
      n('ubukode', '14', 'rent', null, null, [
        'Nishyura ubukode buri kwezi.',
        'I pay the rent every month.',
      ]),
      n('nyir’inzu', '1a', 'landlord, owner of the house', null, null, [
        'Nyir’inzu yazamuye ubukode.',
        'The landlord has raised the rent.',
      ]),
      v('kudandaza', 'dandaz', 'to sell small goods, to hawk', 'sell goods', 'sells goods', [
        'Adandaza imbuto ku muhanda.',
        'He or she sells fruit by the road.',
      ]),
      v('kuguriza', 'guriz', 'to lend (money)', 'lend', 'lends', [
        'Wanguriza ibihumbi bitanu?',
        'Could you lend me five thousand?',
      ]),
      v('kubikuza', 'bikuz', 'to withdraw (money)', 'withdraw', 'withdraws', [
        'Ngiye kubikuza amafaranga kuri banki.',
        "I'm going to withdraw money at the bank.",
      ]),
      v('gusesagura', 'sesagur', 'to waste, to squander', 'waste', 'wastes', [
        'Ntugasesagure amafaranga.',
        "Don't waste money.",
      ]),
      v('kunguka', 'unguk', 'to make a profit, to gain', 'make a profit', 'makes a profit', [
        'Uyu mwaka twungutse cyane.',
        'This year we made a big profit.',
      ]),
      v('guhomba', 'homb', 'to make a loss, to go bankrupt', 'make a loss', 'makes a loss', [
        'Iduka rye ryarahombye.',
        'His or her shop went bankrupt.',
      ]),
    ],
  },
  {
    topic: 'work',
    picturable: false,
    words: [
      n('itangazamakuru', '5', 'the media, the press', null, null, [
        'Itangazamakuru rigomba kuba ryigenga.',
        'The media must be independent.',
      ]),
      n('igitangazamakuru', '7/8', 'media outlet', 'ibitangazamakuru', 'media outlets', [
        'Iki gitangazamakuru gikorera i Kigali.',
        'This media outlet works in Kigali.',
      ]),
      n('ubutumwa bugufi', '14', 'text message, SMS', null, null, [
        'Nkoherereza ubutumwa bugufi.',
        'Send me a text message.',
      ]),
      n('amakuru', '6', 'news; information', null, null, [
        'Wumvise amakuru?',
        'Did you hear the news?',
      ]),
      n('imbuga nkoranyambaga', '10', 'social media', null, null, [
        'Akoresha imbuga nkoranyambaga cyane.',
        'He or she uses social media a lot.',
      ]),
      n(
        'umufatabuguzi',
        '1/2',
        'subscriber, customer (of a phone network)',
        'abafatabuguzi',
        'subscribers',
        ['Iyi sosiyete ifite abafatabuguzi benshi.', 'This company has many subscribers.'],
      ),
      n('ijambo ry’ibanga', '5/6', 'password', 'amagambo y’ibanga', 'passwords', [
        'Wibagiwe ijambo ry’ibanga?',
        'Have you forgotten the password?',
      ]),
      n('umuyoboro', '3/4', 'channel; pipe', 'imiyoboro', 'channels', [
        'Hindura umuyoboro.',
        'Change the channel.',
      ]),
      v('kwitaba', 'itab', 'to answer (a call); to attend', 'answer', 'answers', [
        'Yanze kwitaba telefoni.',
        "He or she wouldn't answer the phone.",
      ]),
      v('gusakaza', 'sakaz', 'to spread, to broadcast (news)', 'spread', 'spreads', [
        'Radiyo isakaza amakuru mu gihugu cyose.',
        'The radio spreads the news across the whole country.',
      ]),
      v('kuvugurura', 'vugurur', 'to update, to renew, to reform', 'update', 'updates', [
        'Vugurura porogaramu ya telefoni yawe.',
        "Update your phone's app.",
      ]),
      v('kwandikira', 'andikir', 'to write to', 'write to', 'writes to', [
        'Nzakwandikira ejo.',
        "I'll write to you tomorrow.",
      ]),
      o(
        'binyuze mu',
        'through, via',
        ['Amasomo atangwa binyuze mu ikoranabuhanga.', 'Lessons are given through technology.'],
        F,
      ),
    ],
  },
  {
    topic: 'school',
    picturable: false,
    words: [
      n('uburezi', '14', 'education', null, null, [
        'Minisiteri y’Uburezi yatangaje amanota.',
        'The Ministry of Education has announced the results.',
      ]),
      n('imyitozo', '4', 'exercises, practice; training', null, null, [
        'Mukore imyitozo yo ku rupapuro rwa cumi.',
        'Do the exercises on page ten.',
      ]),
      n('umuyobozi w’ishuri', '1/2', 'head teacher', 'abayobozi b’amashuri', 'head teachers', [
        'Umuyobozi w’ishuri yahamagaye ababyeyi.',
        'The head teacher called the parents.',
      ]),
      n('umurezi', '1/2', 'educator; carer', 'abarezi', 'educators', [
        'Abarezi bahuguwe.',
        'The educators were trained.',
      ]),
      n('umuvugo', '3/4', 'poem', 'imivugo', 'poems', [
        'Yavuze umuvugo imbere y’ishuri.',
        'He or she recited a poem in front of the class.',
      ]),
      n('amashuri abanza', '6', 'primary school', null, null, [
        'Yarangije amashuri abanza.',
        'He or she finished primary school.',
      ]),
      n('amashuri yisumbuye', '6', 'secondary school', null, null, [
        'Yiga mu mashuri yisumbuye.',
        'He or she is in secondary school.',
      ]),
      n('amafaranga y’ishuri', '6', 'school fees', null, null, [
        'Nishyuye amafaranga y’ishuri.',
        'I have paid the school fees.',
      ]),
      v('gusibira', 'sibir', 'to repeat a year (at school)', 'repeat a year', 'repeats a year', [
        'Yasibiye mu mwaka wa gatatu.',
        'He or she repeated year three.',
      ]),
      v('guhugura', 'hugur', 'to train (people)', 'train', 'trains', [
        'Bahugura abarimu bashya.',
        'They train the new teachers.',
      ]),
      v('kuvumbura', 'vumbur', 'to discover', 'discover', 'discovers', [
        'Yavumbuye umuti mushya.',
        'He or she discovered a new medicine.',
      ]),
      v('gusuzuma', 'suzum', 'to examine, to check, to assess', 'examine', 'examines', [
        'Mwarimu arasuzuma imikoro.',
        'The teacher is checking the homework.',
      ]),
    ],
  },
  {
    topic: 'government',
    picturable: false,
    words: [
      n('ubuyobozi', '14', 'leadership, administration, the authorities', null, null, [
        'Ubuyobozi bw’akarere bwasuye abaturage.',
        'The district authorities visited the residents.',
      ]),
      n('itegeko nshinga', '5', 'constitution', null, null, [
        'Itegeko nshinga ryavuguruwe.',
        'The constitution was revised.',
      ]),
      n('polisi', '9', 'the police', null, null, ['Hamagara polisi!', 'Call the police!']),
      n('irondo', '5/6', 'night watch, neighbourhood patrol', 'amarondo', 'patrols', [
        'Abaturage bakora irondo nijoro.',
        'Residents keep watch at night.',
      ]),
      n('ibarura', '5/6', 'census, count', 'amabarura', 'censuses', [
        'Ibarura rusange rikorwa buri myaka icumi.',
        'The general census is held every ten years.',
      ]),
      n('ingengo y’imari', '9', 'budget', null, null, [
        'Ingengo y’imari y’uyu mwaka yiyongereye.',
        "This year's budget has increased.",
      ]),
      n('ubwisanzure', '14', 'freedom', null, null, [
        'Abaturage bafite ubwisanzure bwo kuvuga.',
        'Citizens have freedom of speech.',
      ]),
      n('amabwiriza', '6', 'instructions, regulations', null, null, [
        'Kurikiza amabwiriza.',
        'Follow the instructions.',
      ]),
      v('kwiyamamaza', 'iyamamaz', 'to campaign (for election)', 'campaign', 'campaigns', [
        'Abakandida batangiye kwiyamamaza.',
        'The candidates have started campaigning.',
      ]),
      v(
        'kurahira',
        'rahir',
        'to swear an oath, to be sworn in',
        'swear an oath',
        'swears an oath',
        ['Abadepite bashya barahiye uyu munsi.', 'The new MPs were sworn in today.'],
      ),
      v('kwegura', 'egur', 'to resign (from office)', 'resign', 'resigns', [
        'Minisitiri yeguye ku mirimo ye.',
        'The minister resigned from his or her post.',
      ]),
      o('nyakubahwa', 'Your Excellency, the Honourable (title)', [
        'Nyakubahwa Perezida wa Repubulika.',
        'His Excellency the President of the Republic.',
      ]),
      o(
        'ku mugaragaro',
        'officially, openly',
        ['Ishuri rishya ryafunguwe ku mugaragaro.', 'The new school was officially opened.'],
        F,
      ),
    ],
  },
  {
    topic: 'government',
    picturable: false,
    words: [
      n('umushinjacyaha', '1/2', 'prosecutor', 'abashinjacyaha', 'prosecutors', [
        'Umushinjacyaha yasabye igihano gikomeye.',
        'The prosecutor asked for a heavy sentence.',
      ]),
      n('ubujura', '14', 'theft', null, null, [
        'Ubujura bwagabanutse muri uyu mudugudu.',
        'Theft has gone down in this village.',
      ]),
      n('igifungo', '7/8', 'prison sentence, imprisonment', 'ibifungo', 'prison sentences', [
        'Yakatiwe igifungo cy’imyaka itanu.',
        'He or she was sentenced to five years in prison.',
      ]),
      n('ihazabu', '9/10', 'fine (penalty)', 'ihazabu', 'fines', [
        'Yaciwe ihazabu y’ibihumbi icumi.',
        'He or she was fined ten thousand francs.',
      ]),
      n('ubugizi bwa nabi', '14', 'crime, wrongdoing', null, null, [
        'Polisi irwanya ubugizi bwa nabi.',
        'The police fight crime.',
      ]),
      n('ubutabazi', '14', 'rescue, emergency help', null, null, [
        'Abashinzwe ubutabazi bahise baza.',
        'The emergency services came at once.',
      ]),
      v('kujurira', 'jurir', 'to appeal (a court decision)', 'appeal', 'appeals', [
        'Yajuririye icyemezo cy’urukiko.',
        "He or she appealed the court's decision.",
      ]),
      v('gukatira', 'katir', 'to sentence', 'sentence', 'sentences', [
        'Urukiko rwamukatiye imyaka ibiri.',
        'The court sentenced him or her to two years.',
      ]),
      v(
        'kwiregura',
        'iregur',
        'to defend oneself (against a charge)',
        'defend oneself',
        'defends himself or herself',
        ['Yahawe umwanya wo kwiregura.', 'He or she was given time to defend himself or herself.'],
      ),
      v('guhohotera', 'hohoter', 'to abuse, to assault', 'abuse', 'abuses', [
        'Ntawe ukwiye guhohotera umwana.',
        'No one should abuse a child.',
      ]),
      o(
        'hakurikijwe',
        'in accordance with (a law, rules)',
        ['Yahanwe hakurikijwe amategeko.', 'He or she was punished in accordance with the law.'],
        F,
      ),
      o('birabujijwe', 'it is forbidden', [
        'Birabujijwe kunywa itabi hano.',
        'Smoking is forbidden here.',
      ]),
      o('byemewe', 'it is allowed, it is approved', [
        'Ese byemewe guparika hano?',
        'Is it allowed to park here?',
      ]),
    ],
  },
  {
    topic: 'church',
    picturable: false,
    words: [
      n('umwizera', '1/2', 'believer', 'abizera', 'believers', [
        'Abizera bateraniye mu rusengero.',
        'The believers gathered in the church.',
      ]),
      n('Umwuka Wera', '3', 'the Holy Spirit', null, null, [
        'Mu izina rya Data, n’Umwana, n’Umwuka Wera.',
        'In the name of the Father, and of the Son, and of the Holy Spirit.',
      ]),
      n('igiterane', '7/8', '(church) crusade, large gathering', 'ibiterane', 'crusades', [
        'Igiterane kizabera kuri sitade.',
        'The crusade will take place at the stadium.',
      ]),
      n('umuvugabutumwa', '1/2', 'evangelist', 'abavugabutumwa', 'evangelists', [
        'Umuvugabutumwa yabwirije mu isoko.',
        'The evangelist preached in the market.',
      ]),
      n('paruwasi', '9/10', 'parish', 'paruwasi', 'parishes', [
        'Paruwasi yacu ifite amashuri.',
        'Our parish has schools.',
      ]),
      n('icyanditswe', '7/8', 'scripture, Bible verse', 'ibyanditswe', 'scriptures', [
        'Soma icyanditswe cy’uyu munsi.',
        "Read today's scripture.",
      ]),
      n('inyigisho', '9/10', 'teaching, lesson; sermon', 'inyigisho', 'teachings', [
        'Inyigisho y’uyu munsi yari nziza.',
        "Today's teaching was good.",
      ]),
      n('umuhamagaro', '3/4', 'calling, vocation', 'imihamagaro', 'callings', [
        'Kwigisha ni umuhamagaro we.',
        'Teaching is his or her calling.',
      ]),
      n('isabato', '9', 'the Sabbath', null, null, [
        'Ku isabato ntibakora.',
        "They don't work on the Sabbath.",
      ]),
      v('guhamya', 'hamy', 'to testify, to affirm', 'testify', 'testifies', [
        'Ndahamya ko Imana ari nziza.',
        'I testify that God is good.',
      ]),
      v('gusabira', 'sabir', 'to pray for', 'pray for', 'prays for', [
        'Turagusabira.',
        "We're praying for you.",
      ]),
      v('gukiza', 'kiz', 'to save; to heal', 'save', 'saves', ['Yesu arakiza.', 'Jesus saves.']),
    ],
  },
  {
    topic: 'people',
    picturable: false,
    words: [
      n('isano', '9/10', 'relationship, connection, kinship', 'isano', 'relationships', [
        'Dufitanye isano ya hafi.',
        'We are closely related.',
      ]),
      n('umukuru w’umudugudu', '1/2', 'village head', 'abakuru b’imidugudu', 'village heads', [
        'Umukuru w’umudugudu yatumije inama.',
        'The village head called a meeting.',
      ]),
      n('umwamikazi', '1/2', 'queen', 'abamikazi', 'queens', [
        'Umwamikazi yasuye igihugu cyacu.',
        'The queen visited our country.',
      ]),
      n('umuhuza', '1/2', 'mediator, go-between', 'abahuza', 'mediators', [
        'Umuhuza yafashije imiryango kwiyunga.',
        'The mediator helped the families reconcile.',
      ]),
      n('umugiraneza', '1/2', 'kind person, benefactor', 'abagiraneza', 'benefactors', [
        'Umugiraneza yaduhaye ibiryo.',
        'A kind person gave us food.',
      ]),
      n('umutegarugori', '1/2', 'woman, lady (married)', 'abategarugori', 'women', [
        'Abategarugori bitabiriye inama.',
        'The women attended the meeting.',
      ]),
      n('mugenzi', '1a/2', 'companion, colleague, fellow', 'bagenzi', 'colleagues', [
        'Mugenzi wanjye ku kazi yarwaye.',
        'My colleague at work is sick.',
      ]),
      o('madamu', 'madam, Mrs', ['Madamu Uwase ari mu biro.', 'Mrs Uwase is in the office.']),
      o('nyakwigendera', 'the late (someone who has died)', [
        'Nyakwigendera yari umuntu mwiza.',
        'The deceased was a good person.',
      ]),
      v('gusabana', 'saban', 'to socialise, to get on with people', 'socialise', 'socialises', [
        'Akunda gusabana n’abantu.',
        'He or she likes socialising with people.',
      ]),
      v('kwiyunga', 'iyung', 'to reconcile', 'reconcile', 'reconciles', [
        'Bariyunze nyuma y’imyaka myinshi.',
        'They reconciled after many years.',
      ]),
      v('kumvikana', 'umvikan', 'to get along, to agree', 'get along', 'gets along', [
        'Twumvikana neza.',
        'We get along well.',
      ]),
    ],
  },
  {
    topic: 'family',
    picturable: false,
    words: [
      n('data wacu', '1a', "uncle (father's brother)", null, null, [
        'Data wacu atuye i Musanze.',
        'My uncle lives in Musanze.',
      ]),
      n('mama wacu', '1a', "aunt (mother's sister)", null, null, [
        'Mama wacu yaje mu bukwe.',
        'My aunt came to the wedding.',
      ]),
      n('mukeba', '1a/2', 'co-wife; rival', 'bakeba', 'co-wives', [
        'Ntiyumvikana na mukeba we.',
        "She doesn't get along with her co-wife.",
      ]),
      n('ikinege', '7/8', 'only child', 'ibinege', 'only children', [
        'Ni ikinege iwabo.',
        'He or she is an only child.',
      ]),
      n('ingaragu', '9/10', 'single person, unmarried adult', 'ingaragu', 'single people', [
        'Aracyari ingaragu.',
        'He or she is still single.',
      ]),
      n('ubutane', '14', 'divorce', null, null, [
        'Ubutane bugira ingaruka ku bana.',
        'Divorce affects children.',
      ]),
      n('uburere', '14', 'upbringing, manners', null, null, [
        'Uyu mwana afite uburere bwiza.',
        'This child has good manners.',
      ]),
      n('ubuvandimwe', '14', 'brotherhood, kinship', null, null, [
        'Ubuvandimwe bwacu burakomeye.',
        'Our brotherhood is strong.',
      ]),
      n('abashakanye', '2', 'married couple', null, null, [
        'Abashakanye bagomba kubahana.',
        'A married couple should respect each other.',
      ]),
      v('gushakana', 'shakan', 'to get married (to each other)', 'get married', 'gets married', [
        'Bashakanye umwaka ushize.',
        'They got married last year.',
      ]),
      v('gutana', 'tan', 'to divorce', 'divorce', 'divorces', [
        'Baratanye nyuma y’imyaka itatu.',
        'They divorced after three years.',
      ]),
      v(
        'gusezerana',
        'sezeran',
        'to exchange vows, to promise each other',
        'exchange vows',
        'exchanges vows',
        ['Basezeranye imbere y’amategeko.', 'They made their vows before the law.'],
      ),
    ],
  },
];
