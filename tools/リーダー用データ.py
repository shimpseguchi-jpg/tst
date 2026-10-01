import io, json, os, re, glob

OUT = "reader/data"
ROOT = "."

META = {
 "01": ("灯を消さない家", "現代文芸", "新潟の羽室銀座。解体を待つ家に、二十五年ぶりに妹が帰ってくる。姉と妹の十日間。"),
 "02": ("銀星座の二本立て", "商店街・再起", "古びた映画館のマスターは、かつて新進気鋭と呼ばれた。映画好きの女子高生が、その扉を押す。"),
 "03": ("読まない人",     "静かな文芸",   "古書店の店番は、二階に住む店主に一度も会ったことがない。入口にいちばん近い棚の、一段のこと。"),
 "04": ("餃子パン",       "ガール・ミーツ・ガール", "パン屋の娘と中華屋の娘。「じゃあ二人で組んで」の一秒から、商店街を五百メートル運ぶ夜まで。"),
 "05": ("のぼせる",       "ちょっと大人な",       "柏湯の娘は十五歳。月水金にだけ来る客の、タレ目のことばかり考えている。"),
 "06": ("月水金",         "短編・るり視点",       "友達になってひと月後、初めて二人で出かけた日の回想から。意外なことに、るりのほうも。"),
 "07": ("赤いバツ",       "半クロスオーバー長編", "商店街振興組合の事務員は、頼まれてもいないものを三つ預かっている。屋根が外れるまでの一年。"),
 "08": ("十四番地",       "明るいガール・ミーツ・ガール", "屋根の外れた商店街で、七年空いていた店が開く。看板を手で書く人と、百枚刷れる人。"),
 "i1": ("三十七円五十銭", "幕間・あんず視点", "名刺を作りに行く三日間。名前を入れないと決めたのは、あんずだった。"),
 "i2": ("五十八分四十秒", "幕間・夢", "森岡が机で一時間眠る。屋根が戻っていて、閉めた店が全部開いていて、通りは北で羽室につながっている。"),
 "09": ("一人前",         "続編・十八歳の一年",   "パン屋の娘と中華屋の娘の高校三年。週百二十個の注文が来て、ラベルの製造者欄が一つしかないと分かる。"),
 "10": ("逆さに彫る",     "夜の一年",             "借りたいのは店ではなく住所だった。開かない店の一年と、二十二時から四時まで印を彫る人。"),
 "11": ("二百四十個",     "一月だけの話",         "作品10と同じ一月を、二軒隣の中華屋の娘の側から。四年ぶん誰にも言っていないことが一つある。"),
 "i3": ("四百八十円",     "幕間・配信",           "地の文がない。白詰ねむの喋りと、四万人のコメントだけ。午前四時の朝定食の報告をする一晩。"),
 "12": ("〇・二ミリ",     "外から来た人の長編",   "新聞記者が二か月で十四軒を回る。連作でいちばん長い一篇。半ページに入るのは、その六割だけだった。"),
 "i4": ("半人前が六つ", "幕間・息抜き",         "包み終えて数えたら十八個多かった。女六人が夜の中華屋に集まって、食べて、数が合わないまま帰る。"),
 "13": ("重ならない",     "六人・休みの十篇",     "章ごとに語り手が変わる。六人の休みが重なる日は、一年に一日もない。それでも集まるための、たった一つの方法。"),
 "14": ("火曜と四時",     "二組・六章",           "映画館の休みの日と、深夜四時。外出というと味気なく、デートというと近すぎる、その間のオフを二組ぶん。"),
 "15": ("四文字",         "二人・三週間",         "名前も聞かずに一年二か月。印を彫る三週間で、聞かないことが人を傷つける側に回る。連作で二番目に、恋愛として書いた一篇。"),
 "16": ("三段目",         "一年・十二か月",       "同じ部屋に三年いる二人。事件は起きない。章ごとに近づいた量が一つだけ増える。最後に、三段目より上に行く。"),
 "i6": ("二個ずつ",       "幕間・水曜の厨房",     "銀紷堂の二人が水曜の厨房で報告する。二分喋って言い忘れる人と、一行で言う人。焼く数が一人一個から二個になる。"),
 "17": ("十四分",       "二人・一泊二日",       "二周年の旅行。vlogを撮りに行って、撮れたのは午前の十四分だけだった。連作で初めて柏尾の外へ出る一篇。最後の章は、帰ってきた次の水曜の報告。"),
 "18": ("七十二冊",     "二人・七か月",         "古書店の店番は、八年で七十二冊しか読んでいない。その七十二冊を、入口の棚に並べることになる。棚は二百三冊入る。残りは空けたままにする。"),
 "i7": ("二十九枚",     "幕間・二十九軒",       "六人の水曜に、通りが二十九軒ぶん入ってくる。休みが重ならないなら、一日だけ全部閉めればいい。皮が二十九枚足りない。"),
 "i8": ("二十九軒と、一人", "幕間・一月の誕生日", "名簿に二十九軒ある。載っていない人が一人いる。組合の事務員の誕生日を、六人が知ってしまう。渡せるものが見つからない。"),
 "i9": ("五十七個",     "幕間・休みの日",       "柏湯は月水金だけ開ける。木曜は湯を落として床を洗う日。祖母が転んだ一日を、娘が一人で回す。桶は五十七個ある。"),
 "i10": ("角が合う",      "幕間・作品13の裏",     "作品13 第十章の夜を、誘われた側から。用はもうないのに、十年使っていない目覚ましを合わせる。角が合う、は印の言葉である。"),
 "i11": ("双方向性",      "幕間・森岡と六人と、もう一人", "市から無茶が来る。『動画配信等の双方向性を有する手法を含む』。断れないのは、北の抜けに残った四十メートルの点検が今年あるからである。相談に行った部屋に、詳しい人が二人いた。二人とも言わない。そのあと、四人で北の抜けへ行く。行けるかどうかを決めたのは定休日である。"),
 "i12": ("四十メートル",  "幕間・十七曲の上に",   "動画は誰も編めない。かわりに、三十七年誰も挿していない端子に挿す。曲は一つも消さない。上に三分だけ乗せる。四十メートルという長さが、三つ出てくる。"),
 "i13": ("実施体制",      "幕間・欄のこと",       "実績報告の様式に欄が一つ増えた。屋号ではだめで、個人名で書く。市役所は平日の昼で、六人のうち行けるのは一人しかいない。教えた人を書く欄は、この様式にない。"),
 "i14": ("二時四十分",    "幕間・四時のこと",     "祖母が「四時に起こして」と言う。二度目である。一度目を言われたのは一年前で、そのとき本人は隣で粉の話をしていた。覚えているのは、横で聞いていた八番地のほうだった。"),
 "i5": ("四年と三週間", "幕間・水曜の厨房",     "山根ともが自分から言う。「うち、いま付き合っとる人がおる」。その場に、四年その人の配信を聞いている人がいる。"),
}

def load_notes(path="資料/一言.md"):
    """章末の一言を読む。

       ## 01            作品番号（幕間は i1 のように書く）
       ### 3            その作品の何章目か（一から数える）
       **名前**         選んだ人
       　本文           一言（複数行なら改行で区切る）

       本文の .md には一行も書かない。ここだけに置く。
    """
    notes = {}
    if not os.path.exists(path):
        return notes
    work = chap = who = None
    buf = []

    def flush():
        if work and chap and who and buf:
            notes.setdefault(work, {})[chap] = {"who": who, "text": "\n".join(buf)}

    for ln in io.open(path, encoding="utf-8").read().split("\n"):
        t = ln.strip()
        if t.startswith("## "):
            flush(); who, buf = None, []
            work = t[3:].split("\u3000")[0].split()[0].strip()
            chap = None
        elif t.startswith("### "):
            flush(); who, buf = None, []
            chap = int(t[4:].strip())
        elif set(t) == {"-"} and len(t) >= 3:
            pass                      # 見出しのあいだの区切り線。一言には入れない
        elif chap and t and who is None:
            who = t.strip("*").strip()
        elif chap and who is not None and t:
            buf.append(t.lstrip("\u3000"))
    flush()
    return notes


NOTES = load_notes()


def load_periods(path="商店街連作設定.md"):
    """既刊表の「時期」を読む。時系列の並べ替えは、この列だけで決める。

       表に並んでいる順そのものが作者の決めた時系列なので、
       日付が同じときは表の順で割る。手で二重管理しない。
    """
    src = io.open(path, encoding="utf-8").read()
    seg = src[src.index("## 本編（既刊）"):src.index("番号は執筆順")]
    out = {}
    for i, ln in enumerate(seg.split("\n")):
        m = re.match(r'^\|\s*([0-9]{2}|i[0-9]{1,2})\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|', ln)
        if not m:
            continue
        num, period = m.group(1), m.group(3)
        d = re.match(r'(\d{4})年(?:(\d{1,2})月)?(?:(\d{1,2})日)?', period)
        y  = int(d.group(1)) if d else 9999
        mo = int(d.group(2)) if (d and d.group(2)) else 4      # 月がないものは年度の頭に置く
        da = int(d.group(3)) if (d and d.group(3)) else 1
        out[num] = {"period": period, "key": (y, mo, da, i)}
    return out


PERIODS = load_periods()


def count(s):
    s = re.sub(r'^#.*$', '', s, flags=re.M)
    return len(re.sub(r'\s', '', s))

index = []
dirs = sorted(glob.glob(os.path.join(ROOT, "作品[0-9][0-9]_*"))) + sorted(glob.glob(os.path.join(ROOT, "幕間*")))
for d in dirs:
    base = os.path.basename(d)
    num = base[2:4] if base.startswith("作品") else "i" + str(int(base[2:4]))
    title, genre, blurb = META[num]
    chapters = []
    total = 0
    for f in sorted(glob.glob(os.path.join(d, "*章.md"))):
        raw = open(f, encoding='utf-8').read()
        lines = raw.split("\n")
        head = lines[0].lstrip("# ").strip()
        body = "\n".join(lines[1:])
        # split into blocks: two+ blank lines = scene break
        blocks = re.split(r'\n{3,}', body.strip())
        scenes = []
        for b in blocks:
            paras = [p.strip() for p in b.split("\n") if p.strip()]
            if paras:
                scenes.append(paras)
        n = count(raw)
        total += n
        ch = {"title": head, "scenes": scenes, "chars": n}
        note = NOTES.get(num, {}).get(len(chapters) + 1)
        if note:
            ch["note"] = note
        chapters.append(ch)
    json.dump({"num": num, "title": title, "genre": genre, "blurb": blurb,
               "chars": total, "chapters": chapters},
              open(f"{OUT}/{num}.json", "w", encoding='utf-8'), ensure_ascii=False, separators=(',',':'))
    pd = PERIODS.get(num, {"period": "", "key": (9999, 0, 0, 0)})
    index.append({"num": num, "title": title, "genre": genre, "blurb": blurb,
                  "kind": "幕間" if num.startswith("i") else "作品",
                  "period": pd["period"],
                  "chars": total, "count": len(chapters),
                  "chapters": [c["title"] for c in chapters]})

# 時系列の順位を持たせる。並びそのものは執筆順のままにしておく
for r, w in enumerate(sorted(index, key=lambda w: PERIODS.get(w["num"], {"key": (9999,0,0,0)})["key"])):
    w["order"] = r

json.dump(index, open(f"{OUT}/index.json", "w", encoding='utf-8'), ensure_ascii=False, separators=(',',':'))
for w in sorted(index, key=lambda w: w["order"]):
    print(f'{w["order"]:>2} {w["num"]:>3} {w["kind"]} {w["title"]}\t{w["period"]}\t{w["count"]}章\t{w["chars"]}字')
print("total", sum(w["chars"] for w in index))
_n = sum(len(v) for v in NOTES.values())
_c = sum(w["count"] for w in index)
print(f"一言 {_n}/{_c} 章")
