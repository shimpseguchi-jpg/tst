/* まなびスターロード - ドット絵（スプライト）
 *
 * 1もじ = 1ドット。PAL の もじで いろを あらわす。
 * みじかい ぎょうは みぎを すかし（'.'）で うめる ので、きっちり そろえなくてよい。
 */
(function (global) {
  'use strict';

  const PAL = {
    '.': null,            // すかし
    K: '#241a33',         // ふちどり
    D: '#3b4358',
    d: '#5b6379',
    g: '#98a1b8',
    w: '#cfd6e4',
    W: '#ffffff',
    R: '#e8433f', r: '#a32222', X: '#ff2d55',
    O: '#f58c34', o: '#b85e12',
    Y: '#ffd45c', y: '#cf9a17',
    G: '#6ddb6d', N: '#2f9440', n: '#1c5e2b',
    C: '#7ae0ff', L: '#b4f0ff',
    B: '#4aa3f0', b: '#2a5fb8',
    P: '#ff8fb0', p: '#cf4f7a',
    M: '#b982ff', m: '#6f3fb5',
    S: '#ffd0a8', s: '#d9996b',
    H: '#8a5a2b', h: '#4a2e14',
    T: '#f7ead0', t: '#c2ab80'
  };

  // ============================================================
  //  なかま（24 × 24）
  // ============================================================
  const kotonoha = [
    '........................',
    '.......KKKKKKKKKK.......',
    '.....KKhhhhhhhhhhKK.....',
    '....KhhhhhhhhhhhhhhK....',
    '...KhhhhhhhhhhhhhhhhK...',
    '...KhhhSSSSSSSSSShhhK...',
    '...KhhSSSSSSSSSSSShhK...',
    '...KhSSKKSSSSSSKKSShK...',
    '...KhSSKWKSSSSKWKSShK...',
    '...KhSSSSSSPPSSSSSShK...',
    '...KhhSSSSSSSSSSSShhK...',
    '....KhhhSSSSSSSShhhK....',
    '.....KKhhhhhhhhhhKK.....',
    '.......KPPPPPPPPK.......',
    '.....KKWWWWWKWWWWWKK....',
    '....KSKWTTTTKTTTTWKSK...',
    '....KSKWTTTTKTTTTWKSK...',
    '....KSKWWWWWKWWWWWKSK...',
    '.....KPPPPPPPPPPPPK.....',
    '.....KPPPPPPPPPPPPK.....',
    '.....KpppppppppppppK....',
    '.....KKKKKKKKKKKKKKK....',
    '......KhhK....KhhK......',
    '......KKKK....KKKK......'
  ];

  const kazuma = [
    '........................',
    '......KKKKKKKKKKKK......',
    '.....KbbbbbbbbbbbbK.....',
    '....KbbbbbbbbbbbbbbK....',
    '...KKKKKKKKKKKKKKKKKK...',
    '...KbbbSSSSSSSSSSbbbK...',
    '...KbbSSSSSSSSSSSSbbK...',
    '...KbSSKKSSSSSSKKSSbK...',
    '...KbSSKWKSSSSKWKSSbK...',
    '...KbSSSSSSSSSSSSSSbK...',
    '...KbbSSSSKKKKSSSSbbK...',
    '....KSSSSSSSSSSSSSSK....',
    '.....KKSSSSSSSSSSKK.....',
    '.......KBBBBBBBBK.......',
    '......KBBBBKYKBBBBK.....',
    '.....KBBBBKYYYKBBBBK....',
    '....KSKBBKYYKYYKBBKSK...',
    '....KSKBKYYKKKYYKBKSK...',
    '.....KBKYYYYYYYYYKBK....',
    '.....KBKKKKKKKKKKKBK....',
    '.....KBBBBBBBBBBBBBK....',
    '.....KKKKKKKKKKKKKKK....',
    '......KbbK....KbbK......',
    '......KKKK....KKKK......'
  ];

  const emily = [
    '........................',
    '.......KKKKKKKKKK.......',
    '.....KKYYYYYYYYYYKK.....',
    '....KYYYYYYYYYYYYYYK....',
    '...KYYYYYYYYYYYYYYYYK...',
    '...KYYYSSSSSSSSSSYYYK...',
    '..KYYYSSSSSSSSSSSSYYYK..',
    '..KYYSSKKSSSSSSKKSSYYK..',
    '..KYYSSKWKSSSSKWKSSYYK..',
    '..KYYSSSSSSPPSSSSSSYYK..',
    '..KYYYSSSSSSSSSSSSYYYK..',
    '...KYYYYSSSSSSSSYYYYK...',
    '....KYYYYYYYYYYYYYYK....',
    '.....KKYYYYYYYYYYKK.KKK.',
    '.......KWWWWWWWWK..KwwwK',
    '......KWWWWWWWWWWK.KwWwK',
    '.....KWWWWWWWWWWWWKKwwwK',
    '....KSKWWWWWWWWWWKSKKgKK',
    '....KSKWWWWWWWWWWKSSKgK.',
    '.....KWWWWWWWWWWWWKKgKK.',
    '.....KYYYYYYYYYYYYKKKK..',
    '.....KKKKKKKKKKKKKK.....',
    '......KYYK....KYYK......',
    '......KKKK....KKKK......'
  ];

  // ============================================================
  //  てき（32 × 32）
  // ============================================================
  const slime = [
    '', '', '', '',
    '..............KKKK..............',
    '.............KKGGKK.............',
    '............KKGGGGKK............',
    '...........KKGGGGGGKK...........',
    '..........KKGGGGGGGGKK..........',
    '.........KKGGGGGGGGGGKK.........',
    '........KKGGGGGGGGGGGGKK........',
    '.......KKGGGGGGGGGGGGGGKK.......',
    '......KKGGGGGGGGGGGGGGGGKK......',
    '.....KKGGGGGGGGGGGGGGGGGGKK.....',
    '....KKGGGGGGGGGGGGGGGGGGGGKK....',
    '...KKGGGGGGGGGGGGGGGGGGGGGGKK...',
    '...KGGGGGGGGGGGGGGGGGGGGGGGGK...',
    '..KGGGGGKKGGGGGGGGGGKKGGGGGGGK..',
    '..KGGGGGKKGGGGGGGGGGKKGGGGGGGK..',
    '..KGGGGGKKGGGGGGGGGGKKGGGGGGGK..',
    '..KGGGGGGGGGGGGGGGGGGGGGGGGGGK..',
    '..KGGGGGGGGGGGKKKKGGGGGGGGGGGK..',
    '..KGGGGGGGGGGKKKKKKGGGGGGGGGGK..',
    '..KGGGGGGGGGGGGGGGGGGGGGGGGGGK..',
    '.KGGGGGGGGGGGGGGGGGGGGGGGGGGGGK.',
    '.KNGGGGGGGGGGGGGGGGGGGGGGGGGGNK.',
    '.KNNGGGGGGGGGGGGGGGGGGGGGGGGNNK.',
    '.KNNNNGGGGGGGGGGGGGGGGGGGGNNNNK.',
    '.KKNNNNNNNNNNNNNNNNNNNNNNNNNNKK.',
    '..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..'
  ];

  const inu = [
    '', '',
    '....KKK....................KKK..',
    '...KHHHK..................KHHHK.',
    '...KHhHHK................KHHhHK.',
    '...KHhhHHKKKKKKKKKKKKKKKKHHhhHK.',
    '...KHhhHHHHHHHHHHHHHHHHHHHHhhHK.',
    '...KHhhHHHHHHHHHHHHHHHHHHHHhhHK.',
    '....KHHHHHHHHHHHHHHHHHHHHHHHHK..',
    '.....KHHHHHHHHHHHHHHHHHHHHHHK...',
    '.....KHHHKKHHHHHHHHHHKKHHHHHK...',
    '.....KHHHKKHHHHHHHHHHKKHHHHHK...',
    '.....KHHHHHHHHHHHHHHHHHHHHHHK...',
    '......KHHHHHHTTTTTTHHHHHHHHK....',
    '......KHHHHHTTTTTTTTHHHHHHHK....',
    '.......KHHHTTTKKKKTTTHHHHHK.....',
    '.......KHHHTTTTTTTTTTHHHHHK.....',
    '........KHHTTTTTTTTTTHHHHK......',
    '.........KKHHHHHHHHHHHHKK.......',
    '..........KHHHHHHHHHHHHK........',
    '.........KHHHHHHHHHHHHHHK.......',
    '........KHHHHHHHHHHHHHHHHK......',
    '........KHHHHHHHHHHHHHHHHK......',
    '........KHHHHHHHHHHHHHHHHK......',
    '........KHHHHHHHHHHHHHHHHK......',
    '.......KHHHHHHHHHHHHHHHHHHK.....',
    '.......KHhHKKHHHHHHHHKKHhHK.....',
    '.......KHhHK.KHHHHHHK.KHhHK.....',
    '.......KKKK..KKKKKKKK..KKKK.....'
  ];

  const bat = [
    '', '', '',
    'KK............................KK',
    'KmK..........................KmK',
    'KmmK.KKKK..............KKKK.KmmK',
    'KmmmKmmmmKKKK......KKKKmmmmKmmmK',
    'KmmmKmmmmmmmmKKKKKKmmmmmmmmKmmmK',
    'KmmmmKmmmmmmmmMMMMmmmmmmmmKmmmmK',
    'KmmmmKmmmmmKKMMMMMMKKmmmmmKmmmmK',
    '.KmmmmKmmmKMMMMMMMMMMKmmmKmmmmK.',
    '.KmmmmKmmKMMMMMMMMMMMMKmmKmmmmK.',
    '..KmmmmKKMMMMMMMMMMMMMMKKmmmmK..',
    '..KmmmmmKMMMKKMMMMKKMMMKmmmmmK..',
    '...KmmmmKMMMKKMMMMKKMMMKmmmmK...',
    '...KmmmmKMMMMMMMMMMMMMMKmmmmK...',
    '....KmmmKMMMMWWWWWWMMMMKmmmK....',
    '....KmmmKMMMMWKKKKWMMMMKmmmK....',
    '.....KmmKMMMMMMMMMMMMMMKmmK.....',
    '.....KmmKMMMMMMMMMMMMMMKmmK.....',
    '......KKKMMMMMMMMMMMMMMKKK......',
    '.........KMMMMMMMMMMMMK.........',
    '..........KMMMMMMMMMMK..........',
    '...........KMMMMMMMMK...........',
    '............KKMMMMKK............',
    '..............KKKK..............'
  ];

  const gomu = [
    '', '',
    '......KKKKKKKKKKKKKKKKKKKK......',
    '.....KWWWWWWWWWWWWWWWWWWWWK.....',
    '....KWWWWWWWWWWWWWWWWWWWWWWK....',
    '....KWWWWWWWWWWWWWWWWWWWWWWK....',
    '....KWWWWKKWWWWWWWWWWKKWWWWK....',
    '....KWWWWKKWWWWWWWWWWKKWWWWK....',
    '....KWWWWWWWWWWWWWWWWWWWWWWK....',
    '....KWWWWWWWWWWWWWWWWWWWWWWK....',
    '....KWWWWWKKKKKKKKKKKKWWWWWK....',
    '....KWWWWWWWWWWWWWWWWWWWWWWK....',
    '....KwwwwwwwwwwwwwwwwwwwwwwK....',
    '..KKKPPPPPPPPPPPPPPPPPPPPPPKKK..',
    '.KPPKPPPPPPPPPPPPPPPPPPPPPPKPPK.',
    '.KPPKPPPPPPPPPPPPPPPPPPPPPPKPPK.',
    '.KPPKPPPPPPPPPPPPPPPPPPPPPPKPPK.',
    '.KPPKPPPPPPPPPPPPPPPPPPPPPPKPPK.',
    '.KPPKPPPPPPPPPPPPPPPPPPPPPPKPPK.',
    '.KPPKpppppppppppppppppppppp KPPK'.replace(' ', 'p'),
    '.KKKKppppppppppppppppppppppKKKK.',
    '....KKKKKKKKKKKKKKKKKKKKKKKK....',
    '.....KpppK..........KpppK.......',
    '.....KpppK..........KpppK.......',
    '.....KKKKK..........KKKKK.......'
  ];

  const neko = [
    '', '', '',
    '.....KKK................KKK.....',
    '....KyyyK..............KyyyK....',
    '....KyOyyK............KyyOyK....',
    '....KyOOyyKKKKKKKKKKKKyyOOyK....',
    '....KyOOyyyyyyyyyyyyyyyyOOyK....',
    '.....KyyyyyyyyyyyyyyyyyyyyK.....',
    '......KyyyyyyyyyyyyyyyyyyK......',
    '.....KyyyyyyyyyyyyyyyyyyyyK.....',
    '....KyyyKKKKyyyyyyKKKKyyyyyK....',
    '....KyyyKKKKyyyyyyKKKKyyyyyK....',
    '....KyyyyyyyyyPPyyyyyyyyyyyK....',
    '....KyyyyyyyyKPPKyyyyyyyyyyK....',
    '....KyywyyKKKKKKKKKKyywyyyyK....',
    '.....KyywyyyyyyyyyyyywyyyyK.....',
    '......KKyyyyyyyyyyyyyyyyKK......',
    '........KyyyyyyyyyyyyyyK........',
    '.......KyyyyyyyyyyyyyyyyK.......',
    '......KyyyyyyyyyyyyyyyyyyK......',
    '......KyyyyyyyyyyyyyyyyyyK......',
    '......KyyyyyyyyyyyyyyyyyyK......',
    '......KyyyKKyyyyyyyyKKyyyK......',
    '......KyyyK.KyyyyyyK.KyyyK......',
    '......KKKKK.KKKKKKKK.KKKKK......'
  ];

  const karasu = [
    '',
    '',
    '.............KKKKKK.............',
    '...........KKDDDDDDKK...........',
    '..........KDDDDDDDDDDK..........',
    '.........KDDDDDDDDDDDDK.........',
    '.........KDDKKDDDDKKDDK.........',
    '.........KDDKYKDDKYKDDK.........',
    '.........KDDKKDDDDKKDDK.........',
    '.........KDDDDDOODDDDDK.........',
    '..........KDDDOOOODDDK..........',
    '...........KDDOOOODDK...........',
    '...KKK......KDDDOODDK.....KKK...',
    '..KDDDKK...KDDDDDDDDDK..KKDDDK..',
    '..KDDDDDKKKDDDDDDDDDDDKKDDDDDK..',
    '..KDDDDDDDDDDDDDDDDDDDDDDDDDDK..',
    '...KDDDDDDDDDDDDDDDDDDDDDDDDK...',
    '....KKDDDDDDDDDDDDDDDDDDDDKK....',
    '......KKDDDDDDDDDDDDDDDDKK......',
    '........KDDDDDDDDDDDDDDK........',
    '.........KDDDDDDDDDDDDK.........',
    '..........KDDDDDDDDDDK..........',
    '...........KDDDDDDDDK...........',
    '...........KKKOOKOOKKK..........',
    '.............KKK.KKK............'
  ];

  const obake = [
    '', '',
    '..........KKKKKKKKKK............',
    '........KKWWWWWWWWWWKK..........',
    '.......KWWWWWWWWWWWWWWK.........',
    '......KWWWWWWWWWWWWWWWWK........',
    '.....KWWWWWWWWWWWWWWWWWWK.......',
    '.....KWWWWWWWWWWWWWWWWWWK.......',
    '....KWWWKKKWWWWWWKKKWWWWWK......',
    '....KWWWKKKWWWWWWKKKWWWWWK......',
    '....KWWWKKKWWWWWWKKKWWWWWK......',
    '....KWWWWWWWWWWWWWWWWWWWWK......',
    '....KWWWWWWWWWWWWWWWWWWWWK......',
    '....KWWWWWWWKKKKWWWWWWWWWK......',
    '....KWWWWWWKKKKKKWWWWWWWWK......',
    '....KWWWWWWWKKKKWWWWWWWWWK......',
    '....KWWWWWWWWWWWWWWWWWWWWK......',
    '....KwwwwwwwwwwwwwwwwwwwwK......',
    '....KwwwwwwwwwwwwwwwwwwwwK......',
    '....KwwwwwwwwwwwwwwwwwwwwK......',
    '....KwwwwwwwwwwwwwwwwwwwwK......',
    '....KwwKKwwwKKwwwKKwwwKKwK......',
    '....KwK..KwK..KwK..KwK..KK......',
    '.....K....K....K....K...........'
  ];

  const zombie = [
    '',
    '',
    '........KKKKKKKKKKKKKK..........',
    '.......KNNNNNNNNNNNNNNK.........',
    '......KNNNNNNNNNNNNNNNNK........',
    '......KNNNNNNNNNNNNNNNNK........',
    '......KNNKKKNNNNNNKKKNNK........',
    '......KNNKXXKNNNNKXXKNNK........',
    '......KNNKKKNNNNNNKKKNNK........',
    '......KNNNNNNNNNNNNNNNNK........',
    '......KNNNKKKKKKKKKKNNNK........',
    '......KNNNKKKKKKKKKKNNNK........',
    '.......KNNNNNNNNNNNNNNK.........',
    '........KKNNNNNNNNNNKK..........',
    'KKKKK......KNNNNNNK.......KKKKK.',
    'KSSSKKKKKKKKNNNNNNKKKKKKKKKSSSK.',
    'KSSSKNNNNNNNNNNNNNNNNNNNNNKSSSK.',
    'KSSSKNNNNNNNNNNNNNNNNNNNNNKSSSK.',
    'KKKKKKKKKKKKNNNNNNKKKKKKKKKKKKK.',
    '..........KNNNNNNNNK............',
    '.........KNNNNNNNNNNK...........',
    '.........KNNNNNNNNNNK...........',
    '.........KNNNNNNNNNNK...........',
    '.........KNNNKKKNNNNK...........',
    '.........KNNNK.KNNNNK...........',
    '.........KKKKK.KKKKKK...........'
  ];

  const drill = [
    '',
    '',
    '....KKKKKKKKKKKKKKKKKKKKKK......',
    '...KrrrrrrrrrrrrrrrrrrrrrrK.....',
    '...KrTTTTTTTTTTTTTTTTTTTTrK.....',
    '...KrTTTTTTTTTTTTTTTTTTTTrK.....',
    '...KrTTKKKKTTTTTTTTKKKKTTrK.....',
    '...KrTTKWWKTTTTTTTTKWWKTTrK.....',
    '...KrTTKKKKTTTTTTTTKKKKTTrK.....',
    '...KrTTTTTTTTTTTTTTTTTTTTrK.....',
    'KKKKrTTTTTKKKKKKKKKKKKTTTTrKKKK.',
    'KSSSKTTTTTKWWWWWWWWWWKTTTTKSSSK.',
    'KSSSKTTTTTKKKKKKKKKKKKTTTTKSSSK.',
    'KKKKrTTTTTTTTTTTTTTTTTTTTrKKKK..',
    '...KrTTTTttttttttttttTTTTrK.....',
    '...KrTTTTTTTTTTTTTTTTTTTTrK.....',
    '...KrTTTTttttttttttttTTTTrK.....',
    '...KrTTTTTTTTTTTTTTTTTTTTrK.....',
    '...KrTTTTttttttttttttTTTTrK.....',
    '...KrTTTTTTTTTTTTTTTTTTTTrK.....',
    '...KrrrrrrrrrrrrrrrrrrrrrrK.....',
    '....KKKKKKKKKKKKKKKKKKKKKK......',
    '......KrrK..........KrrK........',
    '......KrrK..........KrrK........',
    '......KKKK..........KKKK........'
  ];

  const test = [
    '', '',
    '......KKKKKKKKKKKKKKKKKK........',
    '.....KTTTTTTTTTTTTTTTTTTK.......',
    '....KTTTTTTTTTTTTTTTTTTTTK......',
    '....KTTKKKKTTTTTTTTKKKKTTK......',
    '....KTTKKKKTTTTTTTTKKKKTTK......',
    '....KTTTTTTTTTTTTTTTTTTTTK......',
    '....KTTTTTTTTTTTTTTTTTTTTK......',
    '....KTTTTKXXXXXXXXXXKTTTTK......',
    '....KTTTTXXKKKKKKKKXXTTTTK......',
    '....KTTTTTXXXXXXXXXXTTTTTK......',
    '....KTTTTTTTTTTTTTTTTTTTTK......',
    '....KtttttttttttttttttttTK......',
    '....KtttXXXXtttttXXXXtttTK...KK.',
    '....KtttXXXXtttttXXXXtttTK..KXK.',
    '....KttttttttttttttttttTTK.KXXK.',
    '....KtttttttttttttttttTTTKKXXK..',
    '....KttttttttttttttttTTTKXXXK...',
    '....KtttttttttttttttTTTKXXXK....',
    '....KttttttttttttttTTTKXXXK.....',
    '....KtttKKtttKKtttKKTTKKKK......',
    '....KKKK..KKK..KKK..KKK.........'
  ];

  const kumo = [
    '', '',
    'KK...........................KK.',
    'KmK.........KKKKKK..........KmK.',
    'KmK.......KKmmmmmmKK........KmK.',
    'KmmK.....KmmmmmmmmmmK......KmmK.',
    '.KmK....KmmmmmmmmmmmmK.....KmK..',
    '.KmmK...KmmKKmmmmKKmmK....KmmK..',
    '..KmmK..KmmKRKmmKRKmmK...KmmK...',
    '..KmmmKKKmmKKmmmmKKmmKKKKmmmK...',
    '...KmmmmmKmmmmmmmmmmKmmmmmmK....',
    '....KmmmmKmmKKKKKKmmKmmmmmK.....',
    '.....KKmmKmmmmmmmmmmKmmKK.......',
    '.......KKKmmmmmmmmmmKKK.........',
    '.........KMMMMMMMMMMK...........',
    '........KMMMMMMMMMMMMK..........',
    'KK......KMMMMMMMMMMMMK......KK..',
    'KmKK....KMMMKKMMKKMMMK....KKmK..',
    '.KmmKKKKKMMMKKMMKKMMMKKKKKmmK...',
    '..KmmmmmKMMMMMMMMMMMMKmmmmmK....',
    '...KKKKKKMMMMMMMMMMMMKKKKKK.....',
    '.........KMMMMMMMMMMK...........',
    '..........KKMMMMMMKK............',
    '............KKKKKK..............'
  ];

  const rakugaki = [
    '.....K....K....K....K....K......',
    '....KYK..KRK..KCK..KGK..KMK.....',
    '....KYKKKKRKKKKCKKKKGKKKKMK.....',
    '....KYYYYYYYYYYYYYYYYYYYYYK.....',
    '...KKYYYYYYYYYYYYYYYYYYYYYKK....',
    '..KOOOOOOOOOOOOOOOOOOOOOOOOOK...',
    '..KOOOOOOOOOOOOOOOOOOOOOOOOOK...',
    '..KOOKKKKOOOOOOOOOOKKKKOOOOOK...',
    '..KOOKWWKOOOOOOOOOOKWWKOOOOOK...',
    '..KOOKWKKOOOOOOOOOOKKWKOOOOOK...',
    '..KOOKKKKOOOOOOOOOOKKKKOOOOOK...',
    '..KOOOOOOOOOOOOOOOOOOOOOOOOOK...',
    '..KOOOOOOKKKKKKKKKKKKOOOOOOOK...',
    '..KOOOOOKKWWWWWWWWWWKKOOOOOOK...',
    '..KOOOOOOKKKKKKKKKKKKOOOOOOOK...',
    '..KOOOOOOOOOOOOOOOOOOOOOOOOOK...',
    '.KoOOOOOOOOOOOOOOOOOOOOOOOOOoK..',
    '.KooOOOOOOOOOOOOOOOOOOOOOOOooK..',
    '.KoooOOOOOOOOOOOOOOOOOOOOOoooK..',
    '.KooooOOOOOOOOOOOOOOOOOOOooooK..',
    '.KoooooOOOOOOOOOOOOOOOOOoooooK..',
    '.KooooooOOOOOOOOOOOOOOOooooooK..',
    '.KKoooooooooooooooooooooooooKK..',
    '...KKKKKKKKKKKKKKKKKKKKKKKKK....'
  ];

  const tokei = [
    '',
    '..........KK......KK............',
    '.........KYYK....KYYK...........',
    '........KKYYKKKKKKYYKK..........',
    '.......KgggggggggggggggK........',
    '......KgggggggggggggggggK.......',
    '.....KggWWWWWWWWWWWWWWggK.......',
    '....KggWWWWWWWWWWWWWWWWggK......',
    '....KgWWWWWKWWWWWWKWWWWWgK......',
    '....KgWWWWWKWWWWWWKWWWWWgK......',
    '....KgWWWWWWWWWWWWWWWWWWgK......',
    '....KgWWKKWWWWKKWWWWKKWWgK......',
    '....KgWWWWWWWKKKWWWWWWWWgK......',
    '....KgWWWWWWKKKKKWWWWWWWgK......',
    '....KgWWWWWWWWWKKWWWWWWWgK......',
    '....KgWWWWWWWWWWKKWWWWWWgK......',
    '....KgWWKKWWWWWWWWWWKKWWgK......',
    '....KgWWWWWWWWWWWWWWWWWWgK......',
    '....KggWWWWWWWWWWWWWWWWggK......',
    '.....KggWWWWWWWWWWWWWWggK.......',
    '......KggggggggggggggggK........',
    '.....KKddddddddddddddddKK.......',
    '....KddddK..........KddddK......',
    '....KdddK............KdddK......',
    '....KKKKK............KKKKK......'
  ];

  const maou = [
    '.KK........................KK...',
    '.KRK......................KRK...',
    '.KRRK....KKKKKKKKKKKK....KRRK...',
    '..KRRK.KKmmmmmmmmmmmmKK.KRRK....',
    '..KRRKKmmmmmmmmmmmmmmmmKKRRK....',
    '...KRKmmmmmmmmmmmmmmmmmmKRK.....',
    '...KKmmmmmmmmmmmmmmmmmmmmKK.....',
    '..KmmmmmmmmmmmmmmmmmmmmmmmmK....',
    '..KmmmXXXXmmmmmmmmXXXXmmmmmK....',
    '..KmmXXXXXXmmmmmmXXXXXXmmmmK....',
    '..KmmXXKKXXmmmmmmXXKKXXmmmmK....',
    '..KmmmXXXXmmmmmmmmXXXXmmmmmK....',
    '..KmmmmmmmmmmmmmmmmmmmmmmmmK....',
    '..KmmmmWKWKWKWKWKWKWKWmmmmmK....',
    '..KmmmmWKWKWKWKWKWKWKWmmmmmK....',
    '...KmmmmmmmmmmmmmmmmmmmmmmK.....',
    '....KKmmmmmmmmmmmmmmmmmmKK......',
    '..KKKKmmmmmmmmmmmmmmmmmmKKKK....',
    '.KMMKmmmmmmmmmmmmmmmmmmmmKMMK...',
    '.KMMKmmmmmmmmmmmmmmmmmmmmKMMK...',
    '.KMMKmmmmmmmmmmmmmmmmmmmmKMMK...',
    '.KKKKmmmmmmmmmmmmmmmmmmmmKKKK...',
    '....KmmmKKKmmmmmmKKKmmmmK.......',
    '....KKKKK.KKKKKKKK.KKKKKK.......'
  ];

  const SPRITES = {
    kotonoha: { w: 24, h: 24, rows: kotonoha },
    kazuma: { w: 24, h: 24, rows: kazuma },
    emily: { w: 24, h: 24, rows: emily },
    slime: { w: 32, h: 32, rows: slime },
    inu: { w: 32, h: 32, rows: inu },
    bat: { w: 32, h: 32, rows: bat },
    gomu: { w: 32, h: 32, rows: gomu },
    neko: { w: 32, h: 32, rows: neko },
    karasu: { w: 32, h: 32, rows: karasu },
    obake: { w: 32, h: 32, rows: obake },
    zombie: { w: 32, h: 32, rows: zombie },
    drill: { w: 32, h: 32, rows: drill },
    test: { w: 32, h: 32, rows: test },
    kumo: { w: 32, h: 32, rows: kumo },
    rakugaki: { w: 32, h: 32, rows: rakugaki },
    tokei: { w: 32, h: 32, rows: tokei },
    maou: { w: 32, h: 32, rows: maou }
  };

  // みじかい ぎょう・たりない ぎょうを うめて、ぴったりの おおきさに そろえる
  function normalize(sp) {
    if (sp._ok) return sp;
    const rows = [];
    for (let y = 0; y < sp.h; y++) {
      let r = sp.rows[y] || '';
      if (r.length > sp.w) throw new Error('スプライトの ぎょうが ながすぎます: ' + r.length + '>' + sp.w);
      rows.push(r + '.'.repeat(sp.w - r.length));
    }
    sp.rows = rows; sp._ok = true;
    return sp;
  }

  function get(id) {
    const sp = SPRITES[id];
    return sp ? normalize(sp) : null;
  }

  // canvas に えがく（scale は せいすう。ぼやけない ように）
  function draw(ctx, id, scale, ox, oy) {
    const sp = get(id);
    if (!sp) return;
    scale = scale || 1; ox = ox || 0; oy = oy || 0;
    for (let y = 0; y < sp.h; y++) {
      const row = sp.rows[y];
      for (let x = 0; x < sp.w; x++) {
        const c = PAL[row[x]];
        if (!c) continue;
        ctx.fillStyle = c;
        ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale);
      }
    }
  }

  // <canvas> を つくって かえす
  function el(id, scale, cls) {
    const sp = get(id);
    const cv = document.createElement('canvas');
    cv.className = 'sprite' + (cls ? ' ' + cls : '');
    if (!sp) return cv;
    scale = scale || 3;
    cv.width = sp.w * scale;
    cv.height = sp.h * scale;
    draw(cv.getContext('2d'), id, scale);
    return cv;
  }

  // データURLを つくって おぼえておく（おなじ おおきさは つかいまわす）
  const cache = {};
  function url(id, scale) {
    const k = id + '@' + (scale || 3);
    if (cache[k]) return cache[k];
    const cv = el(id, scale);
    try { return (cache[k] = cv.toDataURL()); } catch (e) { return ''; }
  }
  // HTMLの もじれつに うめこめる <img> タグ
  function tag(id, scale, cls) {
    const sp = get(id);
    if (!sp) return '';
    const u = url(id, scale);
    return `<img class="sprite${cls ? ' ' + cls : ''}" alt="" width="${sp.w * (scale || 3)}"` +
      ` height="${sp.h * (scale || 3)}" src="${u}">`;
  }
  function img(id, scale, cls) {
    const i = new Image();
    i.className = 'sprite' + (cls ? ' ' + cls : '');
    i.alt = '';
    const sp = get(id);
    if (sp) { i.width = sp.w * (scale || 3); i.height = sp.h * (scale || 3); i.src = url(id, scale); }
    return i;
  }

  global.Sprites = { PAL, SPRITES, get, draw, el, url, img, tag, normalize };
})(typeof window !== 'undefined' ? window : globalThis);
