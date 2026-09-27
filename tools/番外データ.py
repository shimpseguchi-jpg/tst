# -*- coding: utf-8 -*-
"""番外_非公式/非公式二次創作.md を reader/data/x.json にする。
   本編のデータとは別系統。index.json にも guide.json にも載せない。"""
import io, json, os, re

SRC = "番外_非公式/非公式二次創作.md"
OUT = "reader/data/x.json"

lines = io.open(SRC, encoding="utf-8").read().split("\n")

title = note = ""
secs = []
cur = None
buf = []

def flush():
    global buf
    if cur is not None and buf:
        t = "\n".join(buf).strip("\n")
        if t.strip():
            cur["ps"].append(t)
    buf = []

for ln in lines:
    s = ln.rstrip()
    if s.startswith("題:"):
        title = s[2:].strip(); continue
    if s.startswith("但し書き:"):
        note = s[5:].strip(); continue
    if s.startswith("## "):
        flush()
        cur = {"h": s[3:].strip(), "ps": []}
        secs.append(cur)
        continue
    if not s.strip():
        flush(); continue
    buf.append(s.strip("　 ") if not s.startswith("　　") else s.strip())
flush()

body = "".join(p for sc in secs for p in sc["ps"])
chars = len(re.sub(r"\s", "", body))

os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump({"title": title, "note": note, "chars": chars, "secs": secs},
          io.open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print("x.json", len(secs), "節", chars, "字", os.path.getsize(OUT), "bytes")
