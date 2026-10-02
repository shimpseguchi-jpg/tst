# -*- coding: utf-8 -*-
"""章の呼吸を測る。

    python3 tools/文体.py 作品04_餃子パン/02章.md
    python3 tools/文体.py 作品04_餃子パン          # 一篇まとめて

  読点.py が読点だけを見るのに対して、これは一章の速さを十二の数で出す。
  作品の 設定.md に「## 文体の目標」の表があれば、そこと突き合わせて
  外れた行に ← をつける。**目標がない作品は、数を出すだけで何も言わない。**

  この連作は作品ごとに速さが違う。速いほうの端が作品04『餃子パン』、
  遅いほうの端が作品13『重ならない』と作品16『三段目』である。
  どちらが正しいということはない。**その作品が狙った速さから外れていないかだけを見る。**

  **「会話行」と「会話字」は別物である。**台詞の行は十字前後、地の文の行は
  二十五字前後あるので、行で数えると台詞が多く見える。
  作品04は会話行 55%だが、**字で数えると 33%で、三分の二は地の文である。**
  読む人が感じるのは字のほうなので、迷ったら「会話字」を見る。

  **文の長さは、地の文だけで測る。**台詞を混ぜると短く出る。
  作品04 の文を混みで数えると 10字だが、**地の文だけなら 14字である。**
"""
import io, os, re, sys, glob, statistics as st

KEYS = ["地の文の文", "長文", "一行の文数", "地の一行",
        "地の連（字）", "地の連（行）",
        "会話字", "会話行", "会話一行", "会話の連（行）", "読点", "場面"]
UNIT = {"地の文の文": "字", "長文": "%", "一行の文数": "文", "地の一行": "字",
        "地の連（字）": "字", "地の連（行）": "行",
        "会話字": "%", "会話行": "%", "会話一行": "字", "会話の連（行）": "行",
        "読点": "字に一つ", "場面": "／章"}


def 幅(s):
    """全角を二つ、半角を一つで数える。表をそろえるためだけに使う"""
    import unicodedata
    return sum(2 if unicodedata.east_asian_width(c) in "WFA" else 1 for c in s)


def pad(s, w):
    return s + " " * max(1, w - 幅(s))


def 本文(path):
    raw = io.open(path, encoding="utf-8").read()
    return "\n".join(raw.split("\n")[1:])          # 一行目の見出しを落とす


def 台詞(s):
    return s.startswith("「") or s.startswith("『")


def 連なり(seq, pred):
    """続いた塊を（行数, 字数）で返す。

       **行だけで数えると足をすくわれる。**台詞の行は十字前後、
       地の文の行は二十五字前後あるので、行の数は量を表さない。
    """
    out, c, k = [], 0, 0
    for x in seq:
        if pred(x):
            c += 1
            k += len(re.sub(r'\s', '', x))
        else:
            if c:
                out.append((c, k))
            c = k = 0
    if c:
        out.append((c, k))
    return out


def 測る(paths):
    chars = tou = long_ = 0
    lines, talk, scenes = [], 0, 0
    sent, tl, nl, tr, nr, per = [], [], [], [], [], []
    talkc = narrc = 0
    for p in paths:
        b = 本文(p)
        chars += len(re.sub(r'\s', '', b))
        tou += b.count("、")
        # 場面の切れ目は二通りある。空行二つで切るものと、行頭の「——」で起こすもの。
        # 幕間は後者しか使っていないので、両方を数えないと一章＝一場面に見えてしまう
        scenes += len([x for x in re.split(r'\n{3,}', b.strip()) if x.strip()])
        scenes += len(re.findall(r'^\s*——', b, flags=re.M))
        L = [l.strip() for l in b.split("\n") if l.strip()]
        lines += L
        tr += 連なり(L, 台詞)
        nr += 連なり(L, lambda s: not 台詞(s))
        for s in L:
            n = len(re.sub(r'\s', '', s))
            if 台詞(s):
                talk += 1
                tl.append(n)
                talkc += n
                continue
            # 地の文だけを測る。**台詞を混ぜると文が短く出る。**
            # 台詞の行は十字前後なので、混ぜると中央値がそちらへ引かれる
            nl.append(n)
            narrc += n
            ones = [x for x in re.split(r'(?<=[。？！])', s) if x.strip()]
            per.append(len(ones))
            for one in ones:
                c = len(re.sub(r'\s', '', one))
                if c:
                    sent.append(c)
                    if c > 40:
                        long_ += 1
    n = len(paths)
    return {
        "地の文の文":     st.median(sent) if sent else 0.0,
        "長文":           long_ / len(sent) * 100 if sent else 0.0,
        "一行の文数":     st.mean(per) if per else 0.0,
        "地の一行":       st.mean(nl) if nl else 0.0,
        "地の連（字）":   st.mean([b for a, b in nr]) if nr else 0.0,
        "地の連（行）":   st.mean([a for a, b in nr]) if nr else 0.0,
        "会話字":         talkc / (talkc + narrc) * 100 if (talkc + narrc) else 0.0,
        "会話行":         talk / len(lines) * 100,
        "会話一行":       st.mean(tl) if tl else 0.0,
        "会話の連（行）": st.mean([a for a, b in tr]) if tr else 0.0,
        "読点":           chars / tou if tou else 0.0,
        "場面":           scenes / n,
    }, chars, n


def 目標(path):
    """作品の 設定.md から「## 文体の目標」の表を読む。無ければ空。"""
    d = path if os.path.isdir(path) else os.path.dirname(path)
    f = os.path.join(d, "設定.md")
    if not os.path.exists(f):
        return {}
    t = io.open(f, encoding="utf-8").read()
    m = re.search(r'^#+ *[-0-9.]* *文体の目標.*?$(.*?)(?=^#+ |\Z)', t, flags=re.M | re.S)
    if not m:
        return {}
    out = {}
    for ln in m.group(1).split("\n"):
        c = [x.strip() for x in ln.strip().strip("|").split("|")]
        if len(c) < 2:
            continue
        key = c[0].replace("**", "").strip()
        if key not in KEYS:
            continue
        v = c[1].replace("**", "")
        nums = [float(x) for x in re.findall(r'\d+(?:\.\d+)?', v)]
        if len(nums) >= 2:
            out[key] = (nums[0], nums[1])
        elif len(nums) == 1:
            if re.search(r'以下|まで|より短|より少', v):
                out[key] = (None, nums[0])
            elif re.search(r'以上|から|より長|より多|あける', v):
                out[key] = (nums[0], None)
            else:
                out[key] = (nums[0], nums[0])
    return out


def 走る(arg):
    if os.path.isdir(arg):
        paths = sorted(glob.glob(os.path.join(arg, "*章.md")))
        if not paths:
            paths = sorted(glob.glob(os.path.join(arg, "*.md")))
    else:
        paths = [arg]
    if not paths:
        print("章が見つからない:", arg)
        return 1
    got, chars, n = 測る(paths)
    tgt = 目標(arg)
    print("%s　%d章　%d字" % (arg, n, chars))
    print("-" * 46)
    外れ = 0
    for k in KEYS:
        v = got[k]
        head = pad(k, 14) + "%7.1f " % v + pad(UNIT[k], 12)
        note = ""
        if k in tgt:
            lo, hi = tgt[k]
            ng = (lo is not None and v < lo) or (hi is not None and v > hi)
            rng = ("%g–%g" % (lo, hi) if lo is not None and hi is not None
                   else "%g以上" % lo if lo is not None else "%g以下" % hi)
            note = "目標 " + rng
            if ng:
                note += "　←"
                外れ += 1
        print((head + note).rstrip())
    一章 = not os.path.isdir(arg)
    if not tgt:
        print("\n（設定.md に「文体の目標」がない。数を出しただけで、良し悪しは言わない）")
    elif 外れ and 一章:
        print("\n%d つ外れている。**一章だけなら外れてよい。**目標は篇でそろえる。" % 外れ)
        print("導入の章は遅く、山の章は速い。**篇ごと測って、それでも外れていたら直す。**")
    elif 外れ:
        print("\n**%d つ外れている。**目標のほうが古いなら、設定.md を直す。" % 外れ)
    else:
        print("\n目標の内側にある。")
    return 0


if __name__ == "__main__":
    try:
        import signal
        signal.signal(signal.SIGPIPE, signal.SIG_DFL)   # head に渡しても落ちないように
    except Exception:
        pass
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    rc = 0
    for a in sys.argv[1:]:
        rc |= 走る(a)
        print()
    sys.exit(rc)
