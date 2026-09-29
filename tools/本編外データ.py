# -*- coding: utf-8 -*-
"""番外編/*.md と 二次創作/*.md を、本編と同じ形のデータにする。

   分類は 分類.md による。
     番外編   書き方だけを壊した。正史ではないが、正史と矛盾しない
     二次創作 世界のほうを壊した。正史と矛盾する

   出力
     reader/data/x.json         本編の外の一覧（index.json と同じ形。kind つき）
     reader/data/x1.json 他     一篇ぶん（作品の .json と同じ形）

   どちらも正史ではない。index.json にも guide.json にも載せない。
   既刊表にも年表にも字数の合計にも入れない。
   番号（x1〜x17）は書いた順の通し番号で、二つの区分をまたいでいる。
   本文中の {{ }} は、そのまま通す（リーダー側で黒い帯になる）。
"""
import io, json, os, re, glob

DIRS = [("番外編", "番外編"), ("二次創作", "二次創作")]
OUT = "reader/data"

def count(s):
    s = re.sub(r'^#.*$', '', s, flags=re.M)
    return len(re.sub(r'\s', '', s))

def parse(path):
    raw = io.open(path, encoding="utf-8").read()
    head = {}
    body_lines = []
    for ln in raw.split("\n"):
        m = re.match(r'^(番号|題名|区分|副題|紹介):\s*(.*)$', ln)
        if m and not body_lines:
            head[m.group(1)] = m.group(2).strip()
        else:
            body_lines.append(ln)
    body = "\n".join(body_lines)

    # ## 見出し で節に割る
    parts = re.split(r'^## +(.+)$', body, flags=re.M)
    chapters = []
    for i in range(1, len(parts), 2):
        title = parts[i].strip()
        text = parts[i + 1]
        blocks = re.split(r'\n{3,}', text.strip())
        scenes = []
        for b in blocks:
            paras = [p.strip() for p in b.split("\n") if p.strip()]
            if paras:
                scenes.append(paras)
        chapters.append({"title": title, "scenes": scenes,
                         "chars": count(text)})
    return head, chapters

index = []
for d, kind in DIRS:
    for p in sorted(glob.glob(os.path.join(d, "[0-9][0-9]_*.md"))):
        head, chapters = parse(p)
        if head.get("区分") != kind:
            raise SystemExit("区分が folder と合わない: %s（%s）" % (p, head.get("区分")))
        num = head["番号"]
        total = sum(c["chars"] for c in chapters)
        w = {"num": num, "title": head["題名"], "kind": kind, "genre": head["副題"],
             "blurb": head["紹介"], "chars": total, "chapters": chapters}
        json.dump(w, io.open(os.path.join(OUT, num + ".json"), "w", encoding="utf-8"),
                  ensure_ascii=False, separators=(",", ":"))
        index.append({"num": num, "title": head["題名"], "kind": kind,
                      "genre": head["副題"], "blurb": head["紹介"],
                      "chars": total, "count": len(chapters),
                      "chapters": [c["title"] for c in chapters]})

# 書いた順（通番）に並べ替える。x1〜x17
index.sort(key=lambda w: int(w["num"][1:]))
json.dump(index, io.open(os.path.join(OUT, "x.json"), "w", encoding="utf-8"),
          ensure_ascii=False, separators=(",", ":"))
for w in index:
    print('%-4s %-6s %s\t%d節\t%d字' % (w["num"], w["kind"], w["title"], w["count"], w["chars"]))
for _, kind in DIRS:
    rows = [w for w in index if w["kind"] == kind]
    print("%s %d篇 %d節 %d字" % (kind, len(rows), sum(w["count"] for w in rows),
                                 sum(w["chars"] for w in rows)))
print("total", sum(w["chars"] for w in index), "（本編の合計には入れない）")
