import json, os, re, glob

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
}

def count(s):
    s = re.sub(r'^#.*$', '', s, flags=re.M)
    return len(re.sub(r'\s', '', s))

index = []
dirs = sorted(glob.glob(os.path.join(ROOT, "作品0*"))) + sorted(glob.glob(os.path.join(ROOT, "幕間*")))
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
        chapters.append({"title": head, "scenes": scenes, "chars": n})
    json.dump({"num": num, "title": title, "genre": genre, "blurb": blurb,
               "chars": total, "chapters": chapters},
              open(f"{OUT}/{num}.json", "w", encoding='utf-8'), ensure_ascii=False, separators=(',',':'))
    index.append({"num": num, "title": title, "genre": genre, "blurb": blurb,
                  "chars": total, "count": len(chapters),
                  "chapters": [c["title"] for c in chapters]})

json.dump(index, open(f"{OUT}/index.json", "w", encoding='utf-8'), ensure_ascii=False, separators=(',',':'))
for w in index:
    print(f'{w["num"]} {w["title"]}\t{w["count"]}章\t{w["chars"]}字')
print("total", sum(w["chars"] for w in index))
