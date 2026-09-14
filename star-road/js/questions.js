/* まなびスターロード - もんだいエンジン（小学1年生むけ）
 * Questions.make(subject, difficulty) -> {subject, category, prompt, choices[4], answer, note}
 * subject: '国語' | '算数' | '英語'   difficulty: 1 | 2 | 3
 */
(function (global) {
  'use strict';

  // ---------- 小道具 ----------
  const rnd = n => Math.floor(Math.random() * n);
  const pick = a => a[rnd(a.length)];
  const range = (min, max) => min + rnd(max - min + 1);
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function build(subject, category, prompt, ans, wrongs, note, filler) {
    const A = String(ans);
    const out = [A];
    for (const w of shuffle(wrongs.slice())) {
      const s = String(w);
      if (s !== '' && !out.includes(s)) out.push(s);
      if (out.length >= 4) break;
    }
    let guard = 0;
    while (out.length < 4 && guard++ < 80) {
      const s = String(filler ? filler(guard) : '―'.repeat(guard));
      if (!out.includes(s)) out.push(s);
    }
    while (out.length < 4) out.push('？'.repeat(out.length));
    const choices = shuffle(out.slice(0, 4));
    return { subject, category, prompt, choices, answer: choices.indexOf(A), note: note || '' };
  }
  function numWrongs(ans, deltas) {
    const set = [];
    for (const d of deltas) {
      const v = ans + d;
      if (v !== ans && v >= 0 && !set.includes(v)) set.push(v);
    }
    return set;
  }
  const numFiller = ans => (i => Math.max(0, ans + (i % 2 ? i : -i) * 2));
  function poolWrongs(pool, ansText, n) {
    return shuffle(pool.filter(x => x !== ansText)).slice(0, n || 6);
  }

  // ============================================================
  //  さんすう（1年生：かず・たしざん・ひきざん・とけい）
  // ============================================================
  const DOT = '●';
  const mathGen = {
    // レベル1：10までのかず
    1: [
      function add10() {
        const a = range(1, 8);
        const b = range(1, 9 - a);
        const ans = a + b;
        return build('算数', 'たしざん', `${a} + ${b} = ?`, ans,
          numWrongs(ans, [1, -1, 2, -2]),
          `${a} と ${b} で ${ans}`, numFiller(ans));
      },
      function sub10() {
        const a = range(4, 10), b = range(1, a - 1);
        const ans = a - b;
        return build('算数', 'ひきざん', `${a} - ${b} = ?`, ans,
          numWrongs(ans, [1, -1, 2, -2]),
          `${a} から ${b} をとると ${ans}`, numFiller(ans));
      },
      function ikutsu() {
        const t = range(5, 10), a = range(1, t - 1);
        const ans = t - a;
        return build('算数', 'いくつといくつ', `${t} は ${a} と いくつ?`, ans,
          numWrongs(ans, [1, -1, 2, -2]),
          `${a} と ${ans} で ${t}`, numFiller(ans));
      },
      function kazoeru() {
        const ans = range(3, 10);
        return build('算数', 'かずをかぞえる', `${DOT.repeat(ans)}　いくつ ある?`, ans,
          numWrongs(ans, [1, -1, 2, -2]),
          `${ans}こ あるよ`, numFiller(ans));
      },
      function narabi() {
        const start = range(1, 5), hole = range(1, 3);
        const seq = [];
        for (let i = 0; i < 5; i++) seq.push(start + i);
        const ans = seq[hole];
        const shown = seq.map((v, i) => i === hole ? '□' : v).join('、');
        return build('算数', 'かずのならび', `${shown}　□に はいる かずは?`, ans,
          numWrongs(ans, [1, -1, 2, -2]),
          `${seq.join('、')} の じゅんばん`, numFiller(ans));
      }
    ],
    // レベル2：くり上がり・くり下がり
    2: [
      function addCarry() {
        const a = range(5, 9), b = range(11 - a, 9);
        const ans = a + b;
        return build('算数', 'くりあがり', `${a} + ${b} = ?`, ans,
          numWrongs(ans, [1, -1, 10, -10, -(a + b - 10)]),
          `${a} に ${10 - a} たして 10、のこり ${b - (10 - a)} で ${ans}`, numFiller(ans));
      },
      function subBorrow() {
        const ans = range(2, 9), b = range(11 - ans > 9 ? 2 : 11 - ans, 9);
        const a = ans + b;
        return build('算数', 'くりさがり', `${a} - ${b} = ?`, ans,
          numWrongs(ans, [1, -1, 2, -2, 10]),
          `10 - ${b} = ${10 - b}、${10 - b} + ${a - 10} = ${ans}`, numFiller(ans));
      },
      function tenAnd() {
        const b = range(1, 9);
        const ans = 10 + b;
        return build('算数', '10といくつ', `10 と ${b} で いくつ?`, ans,
          numWrongs(ans, [1, -1, 10, -10]),
          `10 と ${b} で ${ans}`, numFiller(ans));
      },
      function three() {
        const a = range(1, 5), b = range(1, 4), c = range(1, 4);
        const ans = a + b + c;
        return build('算数', '3つのかず', `${a} + ${b} + ${c} = ?`, ans,
          numWrongs(ans, [1, -1, c, -c, 2]),
          `${a}+${b}=${a + b}、${a + b}+${c}=${ans}`, numFiller(ans));
      },
      function bunsho() {
        const a = range(6, 15), b = range(2, 5);
        if (rnd(2)) {
          const ans = a + b;
          return build('算数', 'ぶんしょうだい',
            `あめが ${a}こ あります。${b}こ もらいました。ぜんぶで なんこ?`, ans,
            numWrongs(ans, [1, -1, b, -b, 10]),
            `${a} + ${b} = ${ans}こ`, numFiller(ans));
        }
        const ans = a - b;
        return build('算数', 'ぶんしょうだい',
          `いちごが ${a}こ あります。${b}こ たべました。のこりは なんこ?`, ans,
          numWrongs(ans, [1, -1, b, -b, 10]),
          `${a} - ${b} = ${ans}こ`, numFiller(ans));
      },
      function ookii() {
        const a = range(6, 19); let b = range(6, 19);
        while (b === a) b = range(6, 19);
        const ans = String(Math.max(a, b));
        return build('算数', 'かずくらべ', `${a} と ${b}　おおきいのは どっち?`, ans,
          [String(Math.min(a, b)), 'おなじ', String(a + b)],
          `${Math.max(a, b)} のほうが おおきい`);
      }
    ],
    // レベル3：100までのかず・とけい・20までの計算
    3: [
      function ten1() {
        const t = range(2, 9), o = range(1, 9);
        const ans = t * 10 + o;
        return build('算数', '100までのかず', `10が ${t}こ と 1が ${o}こ で いくつ?`, ans,
          numWrongs(ans, [10, -10, 1, -1, t + o - ans]),
          `10が${t}こ＝${t * 10}、あわせて ${ans}`, numFiller(ans));
      },
      function tokei() {
        const h = range(1, 12);
        if (rnd(2)) {
          const ans = `${h}じ`;
          return build('算数', 'とけい',
            `みじかい はりが ${h}、ながい はりが 12。なんじ?`, ans,
            [`${h}じはん`, `${h === 12 ? 1 : h + 1}じ`, `12じ`, `${h}ふん`],
            `ながい はりが 12 なら ちょうど ${h}じ`);
        }
        const ans = `${h}じはん`;
        return build('算数', 'とけい',
          `みじかい はりが ${h}と${h === 12 ? 1 : h + 1}の あいだ、ながい はりが 6。なんじ?`, ans,
          [`${h}じ`, `${h === 12 ? 1 : h + 1}じはん`, `6じ`, `${h}じ6ふん`],
          `ながい はりが 6 なら 「はん」。${ans}`);
      },
      function add20() {
        const a = range(11, 18), b = range(2, 9);
        const ans = a + b;
        return build('算数', 'たしざん', `${a} + ${b} = ?`, ans,
          numWrongs(ans, [1, -1, 10, -10, 2]),
          `${a} + ${b} = ${ans}`, numFiller(ans));
      },
      function sub20() {
        const a = range(12, 20), b = range(2, 9);
        const ans = a - b;
        return build('算数', 'ひきざん', `${a} - ${b} = ?`, ans,
          numWrongs(ans, [1, -1, 10, -10, 2]),
          `${a} - ${b} = ${ans}`, numFiller(ans));
      },
      function nanbanme() {
        const n = range(5, 9), k = range(2, n - 1);
        const ans = n - k;
        return build('算数', 'なんばんめ',
          `${n}人が ならんで います。まえから ${k}ばんめの 人の うしろには なん人 いる?`, ans,
          numWrongs(ans, [1, -1, k, 2]),
          `${n} - ${k} = ${ans}人`, numFiller(ans));
      },
      function chigai() {
        const a = range(8, 18), b = range(2, 7);
        const ans = a - b;
        return build('算数', 'ちがいは いくつ',
          `あかい はなが ${a}本、しろい はなが ${b}本。ちがいは なん本?`, ans,
          numWrongs(ans, [1, -1, b, 10]),
          `${a} - ${b} = ${ans}本`, numFiller(ans));
      }
    ]
  };

  // ============================================================
  //  こくご（1年生）
  // ============================================================
  // かんじの よみ [ことば, よみ, [ちがうよみ3つ]]
  const KANJI = {
    1: [
      ['山', 'やま', ['かわ', 'いし', 'そら']],
      ['川', 'かわ', ['やま', 'うみ', 'た']],
      ['花', 'はな', ['くさ', 'き', 'め']],
      ['犬', 'いぬ', ['ねこ', 'むし', 'とり']],
      ['虫', 'むし', ['かい', 'とり', 'いぬ']],
      ['空', 'そら', ['あめ', 'ゆき', 'かぜ']],
      ['石', 'いし', ['つち', 'すな', 'いと']],
      ['糸', 'いと', ['いし', 'たけ', 'くさ']],
      ['貝', 'かい', ['むし', 'たま', 'いし']],
      ['草', 'くさ', ['はな', 'き', 'もり']],
      ['竹', 'たけ', ['き', 'くさ', 'はやし']],
      ['耳', 'みみ', ['め', 'くち', 'て']],
      ['目', 'め', ['みみ', 'て', 'あし']],
      ['口', 'くち', ['め', 'みみ', 'て']],
      ['手', 'て', ['あし', 'め', 'くち']],
      ['足', 'あし', ['て', 'みみ', 'め']],
      ['水', 'みず', ['ひ', 'つち', 'き']],
      ['火', 'ひ', ['みず', 'つち', 'かぜ']],
      ['木', 'き', ['もり', 'はやし', 'たけ']],
      ['月', 'つき', ['ひ', 'ほし', 'そら']]
    ],
    2: [
      ['学校', 'がっこう', ['がくこう', 'まなびこう', 'がっこ']],
      ['先生', 'せんせい', ['せんせ', 'さきせい', 'せんしょう']],
      ['名前', 'なまえ', ['めいぜん', 'なぜん', 'なまい']],
      ['天気', 'てんき', ['あまき', 'てんぎ', 'てんけ']],
      ['森', 'もり', ['はやし', 'き', 'たけ']],
      ['林', 'はやし', ['もり', 'き', 'くさ']],
      ['町', 'まち', ['むら', 'さと', 'ちょう']],
      ['村', 'むら', ['まち', 'さと', 'そん']],
      ['車', 'くるま', ['しゃりん', 'くるみ', 'でんしゃ']],
      ['音', 'おと', ['こえ', 'うた', 'みみ']],
      ['字', 'じ', ['ことば', 'もじ', 'ぶん']],
      ['花火', 'はなび', ['かび', 'はなひ', 'はなほ']],
      ['大きい', 'おおきい', ['たいきい', 'だいきい', 'おきい']],
      ['小さい', 'ちいさい', ['しょうさい', 'こさい', 'ちさい']],
      ['白い', 'しろい', ['はくい', 'あおい', 'しらい']],
      ['青い', 'あおい', ['せいい', 'あかい', 'あうい']],
      ['赤い', 'あかい', ['せきい', 'あおい', 'あき']],
      ['早い', 'はやい', ['そうい', 'はよい', 'おそい']],
      ['正しい', 'ただしい', ['せいしい', 'まさしい', 'ただし']],
      ['休み', 'やすみ', ['きゅうみ', 'やみ', 'やすめ']]
    ],
    3: [
      ['一年生', 'いちねんせい', ['ひとねんせい', 'いちとしせい', 'いちねんい']],
      ['男の子', 'おとこのこ', ['だんのこ', 'おのこ', 'おとこのし']],
      ['女の子', 'おんなのこ', ['じょのこ', 'めのこ', 'おなのこ']],
      ['王さま', 'おうさま', ['おおさま', 'のうさま', 'たまさま']],
      ['夕日', 'ゆうひ', ['ゆうび', 'せきひ', 'ゆひ']],
      ['力もち', 'ちからもち', ['りきもち', 'ちかもち', 'つよもち']],
      ['文しょう', 'ぶんしょう', ['もんしょう', 'ふんしょう', 'ぶんそう']],
      ['出る', 'でる', ['いでる', 'だる', 'しゅつる']],
      ['入る', 'はいる', ['いる', 'にゅうる', 'はる']],
      ['立つ', 'たつ', ['りつ', 'たいつ', 'だつ']],
      ['見る', 'みる', ['けんる', 'みえる', 'みらる']],
      ['生きる', 'いきる', ['せいきる', 'なまきる', 'うきる']],
      ['円', 'えん', ['まる', 'げん', 'わ']],
      ['右手', 'みぎて', ['うて', 'ゆうて', 'みぎで']],
      ['左足', 'ひだりあし', ['さあし', 'ひだりそく', 'ひだしあし']],
      ['中', 'なか', ['うち', 'ちゅう', 'そと']],
      ['上る', 'のぼる', ['うえる', 'じょうる', 'あがる']],
      ['下る', 'くだる', ['したる', 'おりる', 'げる']],
      ['金いろ', 'きんいろ', ['かねいろ', 'こんいろ', 'ぎんいろ']],
      ['雨つぶ', 'あめつぶ', ['うつぶ', 'あまつぶ', 'あめぶ']]
    ]
  };
  // はんたいの ことば [ことば, はんたい, レベル]
  const HANTAI = [
    ['おおきい', 'ちいさい', 1], ['たかい', 'ひくい', 1], ['ながい', 'みじかい', 1],
    ['おおい', 'すくない', 1], ['あつい', 'さむい', 1], ['うえ', 'した', 1],
    ['まえ', 'うしろ', 1], ['みぎ', 'ひだり', 1], ['あかるい', 'くらい', 2],
    ['つよい', 'よわい', 2], ['ふとい', 'ほそい', 2], ['あたらしい', 'ふるい', 2],
    ['はやい', 'おそい', 2], ['ひろい', 'せまい', 2], ['おもい', 'かるい', 2],
    ['あける', 'しめる', 3], ['いれる', 'だす', 3], ['のぼる', 'おりる', 3],
    ['はじまる', 'おわる', 3], ['わらう', 'なく', 3], ['ちかい', 'とおい', 3]
  ];
  // かぞえかた [もの, かぞえかた, レベル]
  const KAZOE = [
    ['えんぴつ', '本（ほん）', 1], ['ほん', 'さつ', 1], ['いぬ', 'ひき', 1],
    ['かみ', 'まい', 1], ['くるま', 'だい', 2], ['ひと', 'にん', 1],
    ['とり', 'わ', 3], ['くつ', 'そく', 3], ['いえ', 'けん', 3], ['はこ', 'こ', 2]
  ];
  // ただしい かきかた [ただしい, まちがい, レベル]
  const KAKIKATA = [
    ['おとうさん', 'おとおさん', 1], ['おおきい', 'おうきい', 1], ['おねえさん', 'おねいさん', 1],
    ['こおり', 'こうり', 2], ['とおい', 'とうい', 2], ['ふうせん', 'ふおせん', 2],
    ['ほうき', 'ほおき', 2], ['せんせい', 'せんせえ', 1], ['がっこう', 'がっこお', 1],
    ['きゅうしょく', 'きゅおしょく', 3], ['しんごう', 'しんごお', 3], ['とけい', 'とけえ', 2]
  ];
  // なかまの ことば [なかま, [ことば...], レベル]
  const NAKAMA = [
    ['のりもの', ['バス', 'でんしゃ', 'ひこうき', 'じてんしゃ'], 1],
    ['どうぶつ', ['いぬ', 'ねこ', 'うさぎ', 'ぞう'], 1],
    ['くだもの', ['りんご', 'みかん', 'バナナ', 'いちご'], 1],
    ['やさい', ['にんじん', 'きゃべつ', 'トマト', 'なす'], 2],
    ['からだ', ['あたま', 'て', 'あし', 'みみ'], 1],
    ['てんき', ['はれ', 'あめ', 'くもり', 'ゆき'], 2],
    ['がっこうの もの', ['ランドセル', 'こくばん', 'きゅうしょく', 'きょうしつ'], 2],
    ['むし', ['ちょう', 'かぶとむし', 'せみ', 'あり'], 3],
    ['たべもの', ['パン', 'ごはん', 'カレー', 'たまご'], 1],
    ['いろ', ['あか', 'あお', 'きいろ', 'みどり'], 1]
  ];
  // カタカナで かく ことば
  const KATAKANA = ['パン', 'テレビ', 'バス', 'ケーキ', 'ノート', 'ピアノ', 'ボール', 'コップ',
    'カレー', 'プール', 'ランドセル', 'ジュース', 'アイス', 'ロボット'];
  const HIRAGANA_WORD = ['ごはん', 'みず', 'いぬ', 'はな', 'つくえ', 'くつ', 'そら', 'やま',
    'さかな', 'ほん', 'かさ', 'まど'];

  const kokugoGen = {
    kanji(d) {
      const it = pick(KANJI[d]);
      return build('国語', 'かんじの よみ', `「${it[0]}」の よみかたは?`, it[1], it[2],
        `${it[0]} ＝ ${it[1]}`);
    },
    hantai(d) {
      const list = HANTAI.filter(x => x[2] <= d);
      const it = pick(list.length ? list : HANTAI);
      const flip = rnd(2);
      const q = flip ? it[1] : it[0], a = flip ? it[0] : it[1];
      const pool = HANTAI.flatMap(x => [x[0], x[1]]);
      return build('国語', 'はんたいの ことば', `「${q}」の はんたいは?`, a,
        poolWrongs(pool.filter(x => x !== q), a), `${it[0]} ⇔ ${it[1]}`);
    },
    kazoe(d) {
      const list = KAZOE.filter(x => x[2] <= d);
      const it = pick(list.length ? list : KAZOE);
      return build('国語', 'かぞえかた', `「${it[0]}」は なんと かぞえる?`, it[1],
        poolWrongs(KAZOE.map(x => x[1]), it[1]), `${it[0]} は 1${it[1]} と かぞえるよ`);
    },
    kakikata(d) {
      const list = KAKIKATA.filter(x => x[2] <= d);
      const it = pick(list.length ? list : KAKIKATA);
      const others = poolWrongs(KAKIKATA.map(x => x[1]), it[1], 2);
      return build('国語', 'ただしい かきかた', 'ただしい かきかたは どれ?', it[0],
        [it[1]].concat(others), `「${it[0]}」が ただしい かきかた`);
    },
    nakama(d) {
      const list = NAKAMA.filter(x => x[2] <= d);
      const it = pick(list.length ? list : NAKAMA);
      const ans = pick(it[1]);
      const others = NAKAMA.filter(x => x[0] !== it[0]).flatMap(x => x[1]);
      return build('国語', 'なかまの ことば', `つぎの うち 「${it[0]}」は どれ?`, ans,
        poolWrongs(others, ans), `${ans} は ${it[0]} の なかま`);
    },
    katakana() {
      const ans = pick(KATAKANA);
      return build('国語', 'カタカナ', 'カタカナで かく ことばは どれ?', ans,
        poolWrongs(HIRAGANA_WORD, ans), `そとの くにから きた ことばは カタカナで かくよ`);
    }
  };

  // ============================================================
  //  えいご（1年生：いろ・どうぶつ・かず・あいさつ・アルファベット）
  // ============================================================
  // [えいご, にほんご, レベル, なかま]
  const WORDS = [
    ['red', 'あか', 1, 'color'], ['blue', 'あお', 1, 'color'], ['yellow', 'きいろ', 1, 'color'],
    ['green', 'みどり', 1, 'color'], ['black', 'くろ', 2, 'color'], ['white', 'しろ', 2, 'color'],
    ['pink', 'ピンク', 1, 'color'], ['brown', 'ちゃいろ', 3, 'color'],
    ['dog', 'いぬ', 1, 'animal'], ['cat', 'ねこ', 1, 'animal'], ['bird', 'とり', 1, 'animal'],
    ['fish', 'さかな', 1, 'animal'], ['rabbit', 'うさぎ', 2, 'animal'], ['monkey', 'さる', 2, 'animal'],
    ['elephant', 'ぞう', 2, 'animal'], ['lion', 'ライオン', 2, 'animal'], ['bear', 'くま', 2, 'animal'],
    ['pig', 'ぶた', 3, 'animal'], ['horse', 'うま', 3, 'animal'], ['mouse', 'ねずみ', 3, 'animal'],
    ['apple', 'りんご', 1, 'food'], ['banana', 'バナナ', 1, 'food'], ['milk', 'ぎゅうにゅう', 2, 'food'],
    ['egg', 'たまご', 2, 'food'], ['bread', 'パン', 2, 'food'], ['cake', 'ケーキ', 1, 'food'],
    ['water', 'みず', 2, 'food'], ['rice', 'ごはん', 3, 'food'], ['juice', 'ジュース', 1, 'food'],
    ['pen', 'ペン', 1, 'thing'], ['book', 'ほん', 1, 'thing'], ['bag', 'かばん', 2, 'thing'],
    ['desk', 'つくえ', 2, 'thing'], ['chair', 'いす', 2, 'thing'], ['hat', 'ぼうし', 2, 'thing'],
    ['ball', 'ボール', 1, 'thing'], ['car', 'くるま', 1, 'thing'], ['house', 'いえ', 2, 'thing'],
    ['school', 'がっこう', 2, 'thing'], ['tree', 'き', 2, 'thing'], ['flower', 'はな', 2, 'thing'],
    ['sun', 'たいよう', 3, 'thing'], ['star', 'ほし', 3, 'thing'], ['shoes', 'くつ', 3, 'thing'],
    ['hand', 'て', 2, 'body'], ['eye', 'め', 2, 'body'], ['ear', 'みみ', 3, 'body'],
    ['head', 'あたま', 3, 'body'], ['foot', 'あし', 3, 'body']
  ];
  // かず
  const NUMS = [['one', 1], ['two', 2], ['three', 3], ['four', 4], ['five', 5],
    ['six', 6], ['seven', 7], ['eight', 8], ['nine', 9], ['ten', 10]];
  // あいさつ [えいご, にほんご, レベル]
  const AISATSU = [
    ['Hello', 'こんにちは', 1], ['Good morning', 'おはよう', 1], ['Good night', 'おやすみ', 1],
    ['Thank you', 'ありがとう', 1], ['Goodbye', 'さようなら', 1], ["I'm sorry", 'ごめんなさい', 2],
    ['Yes', 'はい', 1], ['No', 'いいえ', 1], ['Nice to meet you', 'はじめまして', 3],
    ['See you', 'またね', 2], ['Good afternoon', 'こんにちは（ひるすぎ）', 3], ['Excuse me', 'すみません', 3]
  ];
  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const eigoGen = {
    e2j(d) {
      const list = WORDS.filter(w => w[2] <= d);
      const it = pick(list.length ? list : WORDS);
      const pool = WORDS.filter(w => w[3] === it[3]).map(w => w[1]);
      return build('英語', 'えいご→にほんご', `「${it[0]}」は にほんごで?`, it[1],
        poolWrongs(pool.length >= 4 ? pool : WORDS.map(w => w[1]), it[1]), `${it[0]} ＝ ${it[1]}`);
    },
    j2e(d) {
      const list = WORDS.filter(w => w[2] <= d);
      const it = pick(list.length ? list : WORDS);
      const pool = WORDS.filter(w => w[3] === it[3]).map(w => w[0]);
      return build('英語', 'にほんご→えいご', `「${it[1]}」は えいごで?`, it[0],
        poolWrongs(pool.length >= 4 ? pool : WORDS.map(w => w[0]), it[0]), `${it[1]} ＝ ${it[0]}`);
    },
    num(d) {
      const it = pick(NUMS.slice(0, d === 1 ? 5 : d === 2 ? 8 : 10));
      if (rnd(2)) {
        return build('英語', 'かず', `「${it[0]}」は いくつ?`, it[1],
          poolWrongs(NUMS.map(n => n[1]), it[1]), `${it[0]} ＝ ${it[1]}`);
      }
      return build('英語', 'かず', `${it[1]} を えいごで?`, it[0],
        poolWrongs(NUMS.map(n => n[0]), it[0]), `${it[1]} ＝ ${it[0]}`);
    },
    aisatsu(d) {
      const list = AISATSU.filter(w => w[2] <= d);
      const it = pick(list.length ? list : AISATSU);
      if (rnd(2)) {
        return build('英語', 'あいさつ', `「${it[0]}」は どんな いみ?`, it[1],
          poolWrongs(AISATSU.map(a => a[1]), it[1]), `${it[0]} ＝ ${it[1]}`);
      }
      return build('英語', 'あいさつ', `「${it[1]}」は えいごで?`, it[0],
        poolWrongs(AISATSU.map(a => a[0]), it[0]), `${it[1]} ＝ ${it[0]}`);
    },
    alphabet(d) {
      const i = rnd(24);
      const c = ALPHA[i];
      if (d === 1 || rnd(2)) {
        const ans = c.toLowerCase();
        return build('英語', 'アルファベット', `大文字「${c}」の 小文字は?`, ans,
          poolWrongs(ALPHA.map(x => x.toLowerCase()), ans), `${c} ⇔ ${ans}`);
      }
      const ans = ALPHA[i + 1];
      return build('英語', 'アルファベット', `「${c}」の つぎの アルファベットは?`, ans,
        poolWrongs(ALPHA, ans), `… ${c} → ${ans} …`);
    }
  };

  // ============================================================
  const SUBJECTS = ['国語', '算数', '英語'];

  function make(subject, difficulty) {
    const d = Math.max(1, Math.min(3, (difficulty | 0) || 1));
    let q;
    if (subject === '算数') {
      q = pick(mathGen[d])();
    } else if (subject === '国語') {
      q = kokugoGen[pick(['kanji', 'kanji', 'hantai', 'nakama', 'kazoe', 'kakikata', 'katakana'])](d);
    } else {
      q = eigoGen[pick(['e2j', 'e2j', 'j2e', 'num', 'aisatsu', 'alphabet'])](d);
    }
    q.difficulty = d;
    return q;
  }

  global.Questions = {
    make, SUBJECTS,
    _banks: { KANJI, HANTAI, KAZOE, KAKIKATA, NAKAMA, WORDS, NUMS, AISATSU },
    _util: { shuffle, pick, range, rnd }
  };
})(typeof window !== 'undefined' ? window : globalThis);
