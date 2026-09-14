/* まなびスターロード - キャラ・てき・レリック・イベントの データ */
(function (global) {
  'use strict';

  // ===== キャラクター =====
  // subject が そのまま 「ぞくせい」。てきの じゃくてん と あわせると じゃくてんを つける。
  const CHARS = [
    {
      id: 'kotonoha', name: 'ことのは', subject: '国語', color: '#ff6b8b',
      role: 'かいふく', emoji: '📖',
      desc: 'ことばの ちからで みんなを げんきに する。',
      base: { hp: 1250, atk: 95, def: 80, spd: 98, crit: 5, critDmg: 50 },
      basic: { name: 'ことばの や', mult: 1.0, target: 'one', toughness: 10, ep: 20 },
      skill: {
        name: 'はげましの うた', sp: 1, mult: 0, target: 'ally-all', toughness: 0, ep: 30,
        heal: { mult: 0.55, flat: 90 },
        text: 'みんなの HPを かいふく する'
      },
      ult: {
        name: 'みんなの ものがたり', mult: 0.6, target: 'all', toughness: 10,
        heal: { mult: 1.0, flat: 200 }, buffAtk: 0.3, buffTurns: 2,
        text: 'みんなを おおきく かいふく ＋ こうげき アップ'
      }
    },
    {
      id: 'kazuma', name: 'かずま', subject: '算数', color: '#5cc8ff',
      role: 'ぜんたい こうげき', emoji: '🔢',
      desc: 'けいさんの ちからで てき ぜんいんを ふきとばす。',
      base: { hp: 1100, atk: 108, def: 72, spd: 94, crit: 5, critDmg: 50 },
      basic: { name: 'けいさん パンチ', mult: 1.0, target: 'one', toughness: 10, ep: 20 },
      skill: {
        name: 'たしざん ほうだん', sp: 1, mult: 1.0, target: 'all', toughness: 10, ep: 30,
        text: 'てき ぜんたいに こうげき'
      },
      ult: {
        name: 'ひっさん ビーム', mult: 1.9, target: 'all', toughness: 20,
        text: 'てき ぜんたいに おおきな こうげき'
      }
    },
    {
      id: 'emily', name: 'エミリー', subject: '英語', color: '#ffd45c',
      role: 'いちげき こうげき', emoji: '🔤',
      desc: 'するどい はつおんで ひとりの てきを うちぬく。',
      base: { hp: 980, atk: 122, def: 62, spd: 112, crit: 8, critDmg: 55 },
      basic: { name: 'はつおん シュート', mult: 1.0, target: 'one', toughness: 10, ep: 20 },
      skill: {
        name: 'スペリング ブレイク', sp: 1, mult: 1.75, target: 'one', toughness: 25, ep: 30,
        text: 'ひとりに つよい こうげき（じゃくてんを おおきく けずる）'
      },
      ult: {
        name: 'グレート ボイス', mult: 2.9, target: 'one', toughness: 20, advance: 1.0,
        text: 'ひとりに とても つよい こうげき ＋ すぐ もう いちど うごける'
      }
    }
  ];

  // ===== てき =====
  // w: じゃくてん（きょうか）／ tough: じゃくてんバーの おおきさ
  const ENEMIES = {
    normal: [
      { id: 'slime', name: 'ケアレス・スライム', emoji: '🟢', hp: 520, atk: 100, def: 30, spd: 88, tough: 40, w: ['算数'],
        moves: [{ name: 'ぬめぬめ たいあたり', mult: 1.0, target: 'one' }] },
      { id: 'inu', name: 'まちがイヌ', emoji: '🐕', hp: 560, atk: 104, def: 32, spd: 92, tough: 40, w: ['国語'],
        moves: [{ name: 'かみつき', mult: 1.05, target: 'one' }] },
      { id: 'bat', name: 'アルファ・コウモリ', emoji: '🦇', hp: 470, atk: 96, def: 26, spd: 108, tough: 40, w: ['英語'],
        moves: [{ name: 'つばさ ばたばた', mult: 0.95, target: 'one' }] },
      { id: 'gomu', name: 'けしゴム ゴーレム', emoji: '🗿', hp: 760, atk: 112, def: 48, spd: 74, tough: 60, w: ['国語', '算数'],
        moves: [{ name: 'けしけし パンチ', mult: 1.15, target: 'one' },
                { name: 'まるごと けしけし', mult: 0.7, target: 'all' }] },
      { id: 'neko', name: 'いねむり ネコ', emoji: '🐈', hp: 600, atk: 98, def: 34, spd: 96, tough: 50, w: ['英語', '算数'],
        moves: [{ name: 'ねこ パンチ', mult: 1.0, target: 'one' },
                { name: 'ねむけ を ふりまく', mult: 0.6, target: 'all' }] },
      { id: 'karasu', name: 'おしゃべり カラス', emoji: '🐦‍⬛', hp: 540, atk: 106, def: 28, spd: 104, tough: 40, w: ['国語', '英語'],
        moves: [{ name: 'うるさい こえ', mult: 1.0, target: 'one' }] },
      { id: 'obake', name: 'くりあがり オバケ', emoji: '👻', hp: 640, atk: 108, def: 36, spd: 90, tough: 50, w: ['算数'],
        moves: [{ name: 'こんらん の かぜ', mult: 1.05, target: 'one' },
                { name: 'くりあがり あらし', mult: 0.75, target: 'all' }] },
      { id: 'zombie', name: 'カタカナ ゾンビ', emoji: '🧟', hp: 700, atk: 102, def: 40, spd: 80, tough: 50, w: ['国語'],
        moves: [{ name: 'にごった こえ', mult: 1.1, target: 'one' }] }
    ],
    elite: [
      { id: 'drill', name: 'ドリル まじん', emoji: '📚', hp: 1600, atk: 138, def: 58, spd: 98, tough: 70, w: ['算数', '国語'],
        moves: [{ name: 'れんぞく もんだい', mult: 1.2, target: 'one' },
                { name: 'いっせい テスト', mult: 0.9, target: 'all' }] },
      { id: 'test', name: 'テストの ぬし', emoji: '📝', hp: 1500, atk: 132, def: 52, spd: 106, tough: 70, w: ['英語', '算数'],
        moves: [{ name: 'あかペン ぎり', mult: 1.25, target: 'one' },
                { name: 'ぬきうち テスト', mult: 0.95, target: 'all' }] },
      { id: 'kumo', name: 'しゅくだい グモ', emoji: '🕷️', hp: 1750, atk: 128, def: 66, spd: 88, tough: 80, w: ['国語', '英語'],
        moves: [{ name: 'しゅくだい の いと', mult: 1.15, target: 'one' },
                { name: 'まきつく あみ', mult: 0.9, target: 'all' }] }
    ],
    boss: [
      { id: 'rakugaki', name: 'まよいの ラクガキ王', emoji: '🖍️', hp: 2400, atk: 150, def: 62, spd: 96, tough: 90,
        w: ['国語', '算数'],
        moves: [{ name: 'ぐるぐる らくがき', mult: 1.3, target: 'one' },
                { name: 'いろえんぴつ あらし', mult: 1.0, target: 'all' }] },
      { id: 'tokei', name: 'じかんどろぼう トケイダー', emoji: '⏰', hp: 3300, atk: 168, def: 74, spd: 112, tough: 100,
        w: ['算数', '英語'],
        moves: [{ name: 'びょうしん スラッシュ', mult: 1.35, target: 'one' },
                { name: 'じかん ぎゃくてん', mult: 1.05, target: 'all' }] },
      { id: 'maou', name: 'テスト まおう ゼンモン', emoji: '👹', hp: 4200, atk: 182, def: 84, spd: 104, tough: 110,
        w: ['国語', '算数', '英語'],
        moves: [{ name: 'まんてん プレッシャー', mult: 1.4, target: 'one' },
                { name: 'さんきょうか らんぶ', mult: 1.1, target: 'all' },
                { name: 'きまぐれ しつもん', mult: 1.6, target: 'one' }] }
    ]
  };

  // ===== レリック =====
  // hooks: statMod(char, stat) / flags
  const RELICS = [
    { id: 'pencil', name: 'きんの えんぴつ', emoji: '✏️', desc: 'ことのは（国語）の こうげき +15%',
      atkBySubject: { '国語': 0.15 } },
    { id: 'calc', name: 'まほうの けいさんき', emoji: '🧮', desc: 'かずま（算数）の こうげき +15%',
      atkBySubject: { '算数': 0.15 } },
    { id: 'card', name: 'ひかる たんごカード', emoji: '🃏', desc: 'エミリー（英語）の こうげき +15%',
      atkBySubject: { '英語': 0.15 } },
    { id: 'clock', name: 'めざまし どけい', emoji: '⏱️', desc: 'みんなの すばやさ +10', spdFlat: 10 },
    { id: 'omamori', name: 'おまもり', emoji: '🧿', desc: 'みんなの さいだいHP +15%', hpPct: 0.15 },
    { id: 'redpen', name: 'あかペン', emoji: '🖊️', desc: 'まちがえても ダメージが へりにくい', wrongDamage: 0.6 },
    { id: 'stopwatch', name: 'ストップウォッチ', emoji: '⌛', desc: 'せいげんじかん +6びょう', timeBonus: 6 },
    { id: 'bunko', name: 'がっきゅう ぶんこ', emoji: '📚', desc: 'たたかいの はじめに SP +1', startSp: 1 },
    { id: 'note', name: 'よしゅう ノート', emoji: '📓', desc: 'たたかいの はじめに ひっさつゲージ +25', startEp: 25 },
    { id: 'hanamaru', name: 'はなまる シール', emoji: '🌸', desc: 'れんぞく せいかいで かいしんりつ アップ（さいだい +25%）', streakCrit: 5 },
    { id: 'hachimaki', name: 'はちまき', emoji: '🎽', desc: 'かいしん ダメージ +25%', critDmg: 25 },
    { id: 'pan', name: 'きゅうしょくの パン', emoji: '🍞', desc: 'きゅうけいの かいふくりょう +50%', restBonus: 0.5 },
    { id: 'drillcharm', name: 'ドリルの おまもり', emoji: '🔩', desc: 'じゃくてん を ついた ときの ダメージ +30%', breakDmg: 0.3 },
    { id: 'glasses', name: 'ヒント めがね', emoji: '👓', desc: 'たたかい 1かいに 1ど、こたえを 2つに しぼれる', hint: 1 },
    { id: 'okou', name: 'げんきの おこう', emoji: '🕯️', desc: 'たたかいの あと HPが すこし かいふく（さいだいの 8%）', afterBattleHeal: 0.08 },
    { id: 'kirakira', name: 'きらきら ノート', emoji: '✨', desc: 'とっくんで ふえる ちからが +1', trainBonus: 1 },
    { id: 'ribbon', name: 'がんばり リボン', emoji: '🎀', desc: 'みんなの まもり +12', defFlat: 12 },
    { id: 'star', name: 'ほしの かけら', emoji: '⭐', desc: 'みんなの かいしんりつ +8%', crit: 8 }
  ];

  // ===== イベント =====
  // choices[].effect(ctx) は engine が よぶ
  const EVENTS = [
    {
      id: 'oldbook', emoji: '📕', title: 'ふるい もんだいしゅう',
      text: 'みちばたに ぼろぼろの もんだいしゅうが おちて いる。ひらいて みる?',
      choices: [
        { label: 'といてみる（もんだい 1もん）', kind: 'quiz', reward: 'relic', penalty: 'hp10' },
        { label: 'そっと とじる', kind: 'none', note: 'なにも おこらなかった。' }
      ]
    },
    {
      id: 'fountain', emoji: '⛲', title: 'ちしきの いずみ',
      text: 'きらきら ひかる いずみが ある。のむと げんきに なりそう。',
      choices: [
        { label: 'のむ（HPが 30% かいふく）', kind: 'heal', value: 0.3 },
        { label: 'ビンに つめる（さいだいHP +60）', kind: 'maxhp', value: 60 }
      ]
    },
    {
      id: 'teacher', emoji: '👩‍🏫', title: 'たびの せんせい',
      text: '「ひとつ おしえて あげよう。どの きょうかが いい?」',
      choices: [
        { label: '国語を おしえて もらう', kind: 'train', subject: '国語' },
        { label: '算数を おしえて もらう', kind: 'train', subject: '算数' },
        { label: '英語を おしえて もらう', kind: 'train', subject: '英語' }
      ]
    },
    {
      id: 'cat', emoji: '🐱', title: 'まいごの こねこ',
      text: 'こねこが ないて いる。おうちまで つれて いく?',
      choices: [
        { label: 'つれて いく（じかんが かかる／HP -8%、レリックを もらう）', kind: 'catgood' },
        { label: 'なでて わかれる（HPが 10% かいふく）', kind: 'heal', value: 0.1 }
      ]
    },
    {
      id: 'shop', emoji: '🎁', title: 'ふしぎな はこ',
      text: 'ぴかぴかの はこが おいて ある。あけてみる?',
      choices: [
        { label: 'あける（レリックを 1こ もらう）', kind: 'relic' },
        { label: 'あけない（SPが さいだいに なる）', kind: 'fullsp' }
      ]
    },
    {
      id: 'ghost', emoji: '👻', title: 'なぞなぞ オバケ',
      text: '「もんだいを 2もん だす。ぜんぶ せいかいしたら たからを やろう」',
      choices: [
        { label: 'ちょうせん する（2もん）', kind: 'quiz2', reward: 'relic', penalty: 'hp15' },
        { label: 'にげる', kind: 'none', note: 'そっと とおりすぎた。' }
      ]
    },
    {
      id: 'bench', emoji: '🪑', title: 'こうえんの ベンチ',
      text: 'ひなたぼっこに ちょうど いい ベンチ。すこし やすんで いこうか。',
      choices: [
        { label: 'やすむ（HPが 25% かいふく）', kind: 'heal', value: 0.25 },
        { label: 'ストレッチする（みんなの すばやさ +4）', kind: 'stat', stat: 'spd', value: 4 }
      ]
    },
    {
      id: 'mirror', emoji: '🪞', title: 'まなびの かがみ',
      text: 'かがみに うつった じぶんが 「いちばん とくいな ことを おしえて」と いう。',
      choices: [
        { label: 'こくご！（ことのは の こうげき +6）', kind: 'stat', who: 'kotonoha', stat: 'atk', value: 6 },
        { label: 'さんすう！（かずま の こうげき +6）', kind: 'stat', who: 'kazuma', stat: 'atk', value: 6 },
        { label: 'えいご！（エミリー の こうげき +6）', kind: 'stat', who: 'emily', stat: 'atk', value: 6 }
      ]
    },
    {
      id: 'lunch', emoji: '🍙', title: 'おべんとう タイム',
      text: 'おいしそうな おにぎりを みつけた。',
      choices: [
        { label: 'みんなで たべる（HPが 20% かいふく ＋ さいだいHP +40）', kind: 'lunch' },
        { label: 'とっておく（ひっさつゲージ +30）', kind: 'ep', value: 30 }
      ]
    },
    {
      id: 'wind', emoji: '🌪️', title: 'テストようしの つむじかぜ',
      text: 'テストようしが まいあがって いる。1まい つかまえる?',
      choices: [
        { label: 'つかまえる（もんだい 1もん・せいかいで ちから アップ）', kind: 'quiz', reward: 'stat', penalty: 'none' },
        { label: 'みおくる（HPが 12% かいふく）', kind: 'heal', value: 0.12 }
      ]
    }
  ];

  global.GameData = { CHARS, ENEMIES, RELICS, EVENTS };
})(typeof window !== 'undefined' ? window : globalThis);
