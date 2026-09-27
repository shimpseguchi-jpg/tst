# -*- coding: utf-8 -*-
"""番外_非公式/*.md を reader/data/x.json にまとめる。
   本編のデータとは別系統。index.json にも guide.json にも載せない。
   これは正史ではない。既刊表にも年表にも字数の合計にも入れない。"""
import io, json, os, re

SRC = ["番外_非公式/非公式二次創作.md",
       "番外_非公式/非公式二次創作_甘々.md"]
OUT = "reader/data/x.json"

def parse(path):
    label = title = note = ""
    secs, cur, buf = [], None, []

    def flush():
        nonlocal buf
        if cur is not None and buf:
            t = "\n".join(buf).strip("\n")
            if t.strip():
                cur["ps"].append(t)
        buf = []

    for ln in io.open(path, encoding="utf-8").read().split("\n"):
        s = ln.rstrip()
        if s.startswith("ラベル:"):
            label = s[4:].strip(); continue
        if s.startswith("題:"):
            title = s[2:].strip(); continue
        if s.startswith("但し書き:"):
            note = s[5:].strip(); continue
        if s.startswith("## "):
            flush()
            cur = {"h": s[3:].strip(), "ps": []}
            secs.append(cur); continue
        if not s.strip():
            flush(); continue
        buf.append(s.strip("　 "))
    flush()

    body = "".join(p for sc in secs for p in sc["ps"])
    return {"label": label or title[:6],
            "title": title, "note": note,
            "chars": len(re.sub(r"\s", "", body)),
            "secs": secs}

items = [parse(p) for p in SRC]
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump({"items": items}, io.open(OUT, "w", encoding="utf-8"),
          ensure_ascii=False, separators=(",", ":"))
for it in items:
    print(it["label"], len(it["secs"]), "節", it["chars"], "字")
print("x.json", os.path.getsize(OUT), "bytes")
