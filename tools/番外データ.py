# -*- coding: utf-8 -*-
"""番外_非公式/*.md を、本編と同じ形のデータにする。

   出力
     reader/data/x.json         番外の一覧（index.json と同じ形）
     reader/data/x1.json 他     一篇ぶん（作品の .json と同じ形）

   これは正史ではない。index.json にも guide.json にも載せない。
   既刊表にも年表にも字数の合計にも入れない。
   本文中の {{ }} は、そのまま通す（リーダー側で黒い帯になる）。
"""
import io, json, os, re

SRC = ["番外_非公式/非公式二次創作.md",
       "番外_非公式/非公式二次創作_甘々.md",
       "番外_非公式/非公式二次創作_オールナイト.md",
       "番外_非公式/非公式二次創作_ゲスト回.md",
       "番外_非公式/非公式二次創作_尾行.md"]
OUT = "reader/data"

def count(s):
    s = re.sub(r'^#.*$', '', s, flags=re.M)
    return len(re.sub(r'\s', '', s))

def parse(path):
    raw = io.open(path, encoding="utf-8").read()
    head = {}
    body_lines = []
    for ln in raw.split("\n"):
        m = re.match(r'^(番号|題名|副題|紹介):\s*(.*)$', ln)
        if m and not body_lines:
            head[m.group(1)] = m.group(2).strip()
        else:
            body_lines.append(ln)
    body = "\n".join(body_lines)

    # ## 見出し で章に割る
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
for p in SRC:
    head, chapters = parse(p)
    num = head["番号"]
    total = sum(c["chars"] for c in chapters)
    w = {"num": num, "title": head["題名"], "genre": head["副題"],
         "blurb": head["紹介"], "chars": total, "chapters": chapters}
    json.dump(w, io.open(os.path.join(OUT, num + ".json"), "w", encoding="utf-8"),
              ensure_ascii=False, separators=(",", ":"))
    index.append({"num": num, "title": head["題名"], "genre": head["副題"],
                  "blurb": head["紹介"], "chars": total, "count": len(chapters),
                  "chapters": [c["title"] for c in chapters]})

json.dump(index, io.open(os.path.join(OUT, "x.json"), "w", encoding="utf-8"),
          ensure_ascii=False, separators=(",", ":"))
for w in index:
    print('%s %s\t%d節\t%d字' % (w["num"], w["title"], w["count"], w["chars"]))
print("total", sum(w["chars"] for w in index), "（本編の合計には入れない）")
