# -*- coding: utf-8 -*-
"""読点の密度を測る。目安は本文24字に1つ。20字を切ったら多い。

増える原因は二つある。
  1. 文頭の短い主語のあとの「〜は、」「〜が、」
  2. 動作をつなぐだけの「〜て、」
どちらも件数を出す。固有名詞の一覧に頼ると取りこぼすので、
主語は「短い語＋は／が」の形で拾う。
"""
import sys, re, glob, os

# 文頭（行頭または。の直後）の、短い主語＋は/が＋読点。後ろの節も短いもの。
SUBJ = re.compile(r'(?:^　|。)[^、。「」\n]{1,6}[はが]、(?=[^、。「」\n]{1,24}[。」])', re.M)
# 動作をつなぐだけの て、（後ろの節が短い）
TE   = re.compile(r'[^、。「」\n]{2,8}[てで]、(?=[^、。「」\n]{1,16}[。」])')

def targets(args):
    out = []
    for a in args:
        out += sorted(glob.glob(os.path.join(a, '*章.md'))) if os.path.isdir(a) else [a]
    return out

print(f"{'ファイル':30}{'字数':>7}{'、':>6}{'字/、':>7}{'主語は、':>8}{'〜て、':>7}  判定")
for p in targets(sys.argv[1:]):
    raw = open(p, encoding='utf-8').read()
    t = re.sub(r'^#.*$', '', raw, flags=re.M)
    body = len(re.sub(r'\s', '', t))
    ten = t.count('、')
    if not ten:
        continue
    per = body / ten
    mark = "多い" if per < 20 else ("やや多い" if per < 22 else "よい")
    print(f"{os.path.basename(p):30}{body:>7}{ten:>6}{per:>7.1f}"
          f"{len(SUBJ.findall(t)):>8}{len(TE.findall(t)):>7}  {mark}")
