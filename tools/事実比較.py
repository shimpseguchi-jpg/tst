# -*- coding: utf-8 -*-
"""書き直した章が、事実を動かしていないかを確かめる（執筆規則 第三版 §9）。

    python3 tools/事実比較.py 作品01_灯を消さない家/01章.md          # 直前のコミットと比べる
    python3 tools/事実比較.py 作品01_灯を消さない家/01章.md 33ddf84  # 指定したコミットと比べる
    python3 tools/事実比較.py 作品01_灯を消さない家                  # 一篇まとめて

  比べるのは三つ。**どれも、書き直しで動いてはいけないものである。**

  - **数の語**——漢数字に助数詞がついたもの（十一、二十五年、三日前、二両）
  - **台詞**——行頭が「の行。**言い方を整えたら、ここに差が出る。差が出たら読んで確かめる**
  - **固有名詞**——作中の名前・地名・屋号（その篇に出てくるものを本文から拾う）

  差が出ても、すぐに誤りとはかぎらない。地の文に畳まれていた台詞を独立行に出すと
  「台詞が増えた」と出る。**差を一つずつ読んで、意図したものかを決める。**
"""
import io, os, re, sys, glob, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

数_re = re.compile(r'[〇一二三四五六七八九十百千万]+(?:[年月日時分秒つ本袋個台人度回枚冊両軒歩円通章番階冊箱段畳坪間]|ぶん|か月|週|歳|センチ|メートル|キロ|パック|ページ)|'
                   r'[〇一二三四五六七八九十百千万]+(?=あった|ある|あり|しか|だけ|ずつ|ぐらい|くらい)')
名_re = re.compile(r'[一-龥ァ-ヶー]{2,}(?=さん|ちゃん|くん|様|先生)|'
                   r'『[^』]{1,20}』|'
                   r'[ァ-ヶー]{3,}')


def 旧(path, rev):
    rel = os.path.relpath(path, ROOT)
    r = subprocess.run(["git", "show", "%s:%s" % (rev, rel)], cwd=ROOT, capture_output=True, text=True)
    return r.stdout if r.returncode == 0 else None


def 指紋(t):
    body = "\n".join(t.split("\n")[1:])
    nums = sorted(数_re.findall(body))
    lines = [l.strip() for l in body.split("\n") if l.strip().startswith("「")]
    names = sorted(set(名_re.findall(body)))
    return nums, lines, names


def 差(a, b):
    from collections import Counter
    ca, cb = Counter(a), Counter(b)
    return sorted((ca - cb).elements()), sorted((cb - ca).elements())


def 比べる(path, rev):
    old = 旧(path, rev)
    if old is None:
        print("%s　（%s に無い。新しい章）" % (os.path.relpath(path, ROOT), rev))
        return 0
    new = io.open(path, encoding="utf-8").read()
    o, n = 指紋(old), 指紋(new)
    problems = 0
    print("■ %s" % os.path.relpath(path, ROOT))
    for label, i in [("数の語", 0), ("台詞", 1), ("固有名詞", 2)]:
        gone, added = 差(o[i], n[i])
        if not gone and not added:
            print("  %s　同じ（%d）" % (label, len(o[i])))
            continue
        problems += len(gone) + len(added)
        print("  %s　元%d → 新%d" % (label, len(o[i]), len(n[i])))
        for x in gone:
            print("    − %s" % x[:50])
        for x in added:
            print("    ＋ %s" % x[:50])
    return problems


if __name__ == "__main__":
    a = sys.argv[1:]
    if not a:
        print(__doc__)
        sys.exit(1)
    target = a[0] if os.path.isabs(a[0]) else os.path.join(ROOT, a[0].rstrip("/"))
    rev = a[1] if len(a) > 1 else "HEAD"
    files = sorted(glob.glob(os.path.join(target, "*章.md"))) if os.path.isdir(target) else [target]
    total = sum(比べる(f, rev) for f in files)
    print()
    print("差 %d 件。**一つずつ読んで、意図したものかを決める。**" % total if total else "差なし。")
