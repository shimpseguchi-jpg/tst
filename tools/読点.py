# -*- coding: utf-8 -*-
"""読点の密度を測る。目安は本文24字に1つ。20字を切ったら多い。"""
import sys, re, glob, os

NAMES = r'(?:わたし|森岡|あんず|なつ|律子|塚本|すず|いと|蓮見|黒江|さえ|るり|ふゆ|燈子|二人|石垣|三枝|久世|まひる|きい|澪|とき|靖子|タカ)'
DROPPABLE = re.compile(r'(　?' + NAMES + r')は、([^、。「」\n]{1,12}[。」])')

def targets(args):
    out = []
    for a in args:
        out += sorted(glob.glob(os.path.join(a, '*章.md'))) if os.path.isdir(a) else [a]
    return out

print(f"{'ファイル':34}{'字数':>7}{'、':>6}{'字/、':>7}{'「〜は、」':>9}  判定")
for p in targets(sys.argv[1:]):
    raw = open(p, encoding='utf-8').read()
    t = re.sub(r'^#.*$', '', raw, flags=re.M)
    body = len(re.sub(r'\s', '', t))
    ten = t.count('、')
    if not ten:
        continue
    per = body / ten
    drop = len(DROPPABLE.findall(t))
    mark = "多い" if per < 20 else ("やや多い" if per < 22 else "よい")
    print(f"{os.path.basename(p):34}{body:>7}{ten:>6}{per:>7.1f}{drop:>9}  {mark}")
