# -*- coding: utf-8 -*-
"""執筆規則（第三版）のうち、機械で確かめられるものを全部ここで数える。

    python3 tools/点検.py                    # 本編三十一篇の一覧
    python3 tools/点検.py 作品04_餃子パン    # 一篇の詳細（どの章の何行目か）
    python3 tools/点検.py --前後 作品04_餃子パン  # 書き直しの前後比較用に、数だけを一行で

  規則の正は `.claude/skills/小説執筆/SKILL.md`。ここは**その写し**ではなく、
  **規則が本文で守られているかを数える道具**である。規則を変えたら、ここも変える。

  出すものは二種類ある。

  - **違反**：機械で確実に判定できる。〇にする
      章の字数／語り手の表記／ダッシュ／三点リーダー／算用数字／忌避表現／読点の下限
  - **要確認**：候補を拾うだけ。**人が読んで決める**。〇にしなくてよい
      いまの会話の畳み込み／性格の説明／数の申告／地の文の十二時間制

  **要確認を全部消そうとしない。**「この人は二階にいる」は性格の説明ではない。
  候補が多い篇は、読むときにそこを気にする、というだけの数である。

  番外編と二次創作は数えない。**壊してあることが中身なので、この規則の外にある。**
"""
import io, os, re, sys, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))

try:
    import signal
    signal.signal(signal.SIGPIPE, signal.SIG_DFL)
except Exception:
    pass

# ---------------------------------------------------------------- 規則の数

章の下限, 章の上限 = 2700, 3400        # CLAUDE.md「一章の長さ」
読点の下限 = 20                         # 全作共通。目標は 設定.md が決める

忌避 = ["めっちゃ", "ヤバい", "やばい", "ぶっちゃけ", "てゆうか",
        "ドキッ", "ドキドキ", "ワクワク", "ゾクッ", "胸が締めつけ", "涙が溢れ",
        "何！？", "何!?"]
# 「的な」は「合理的な」「一般的な」「目的なので」がある。禁じるのは仮名のあとの口癖だけ
# 「まるで」は「まるで気持ちが入っていない」（＝全然）がある。禁じるのは直喩だけ
# 「〜すぎる」は「言いすぎる」「重くなりすぎる」がある。量を言うのはよいので、ここでは数えない
忌避_re = re.compile(r'(' + "|".join(map(re.escape, 忌避)) + r'|[ぁ-んァ-ヶー]的な|まるで[^。」]{0,24}(ような|ように|みたい))')

# 規格名・型番は算用数字のままでよい（A4、B5、6AR5）
算用_re = re.compile(r'(?<![A-Za-zＡ-Ｚａ-ｚ0-9０-９])[0-9０-９]+(?![A-Za-zＡ-Ｚａ-ｚ0-9０-９])')
規格_re = re.compile(r'[A-Za-zＡ-Ｚａ-ｚ]+[0-9０-９]+|[0-9０-９]+[A-Za-zＡ-Ｚａ-ｚ]+')

# いまの会話を地の文に畳んでいる形。回想・伝聞・仮定は除きたいが、機械には分からない
畳み_re = re.compile(r'「[^」]{1,40}」と(言|聞|答|返|呟|叫|続け|足)(っ|い|わ|う|え|た|て|ま)')
回想_re = re.compile(r'(とき|ころ|頃|前に|昔|去年|年前|あのとき|以前|だろう|はずだ|かもしれ|言われ|聞かれ|と言う。|と言うだろう)')

性格_re = re.compile(r'(この人は|あの人は|あの子は|この子は).{0,40}(人である|人だ|人です|人じゃ|ところがある|癖がある)|'
                     r'(人である|人なのである)。|'
                     r'[一二三四五六七八九十百]+年、そう(しとる|している|してきた|です)')
申告_re = re.compile(r'[一二三四五六七八九十百千〇]+字(です|じゃ|でした|を超え|ちょうど)|'
                     r'[一二三四五六七八九十]+度[一二三四五六七八九十]*分?(です|じゃ)')

# 地の文の十二時間制。「三時に」があって、同じ文に午後・夕方・夜があれば候補
時刻_re = re.compile(r'(?<![十二])([一二三四五六七八九]|十|十一)時')
午後_re = re.compile(r'(午後|夕方|夕暮|夜|晩|日暮|昼すぎ|昼過ぎ|夕飯|夕食)')


def 本編():
    out = []
    for d in sorted(glob.glob(os.path.join(ROOT, "作品*_*"))) + \
             sorted(glob.glob(os.path.join(ROOT, "幕間*_*")),
                    key=lambda p: int(re.search(r'幕間(\d+)', p).group(1))):
        if os.path.isdir(d) and glob.glob(os.path.join(d, "*章.md")):
            out.append(d)
    return out


def 章たち(d):
    return sorted(glob.glob(os.path.join(d, "*章.md")),
                  key=lambda p: int(re.search(r'(\d+)章', os.path.basename(p)).group(1)))


def 字数(body):
    return len(re.sub(r'\s', '', body))


def 下限の理由(d):
    """設定.md に、一章を短く取る理由が書いてあるか"""
    f = os.path.join(d, "設定.md")
    if not os.path.exists(f):
        return False
    t = io.open(f, encoding="utf-8").read()
    return bool(re.search(r'(一章|章の幅|各章).{0,30}(短く|下げ|二千[一二三四五六]百|千[0-9一二三四五六七八九]百)', t)) \
        and bool(re.search(r'(理由|ため|からである)', t))


def 点検(d):
    v = {k: [] for k in ["短章", "長章", "語り手", "ダッシュ", "三点", "算用", "忌避", "読点",
                         "畳み", "性格", "申告", "時刻"]}
    chs = 章たち(d)
    heads = [io.open(f, encoding="utf-8").readline().strip() for f in chs]
    語り手あり = [bool(re.search(r'（[^）]+）\s*$', h)) for h in heads]
    total = 0
    for f, h, named in zip(chs, heads, 語り手あり):
        lines = io.open(f, encoding="utf-8").read().split("\n")
        body = "\n".join(lines[1:])
        n = 字数(body)
        total += n
        tag = os.path.basename(f)
        if n < 章の下限:
            v["短章"].append((tag, 0, "%d字" % n))
        if n > 章の上限:
            v["長章"].append((tag, 0, "%d字" % n))
        if any(語り手あり) and not named:
            v["語り手"].append((tag, 1, h))
        tou = body.count("、")
        if tou and n / tou < 読点の下限:
            v["読点"].append((tag, 0, "%.1f字に一つ" % (n / tou)))
        for i, l in enumerate(lines[1:], start=2):
            s = l.strip()
            if not s:
                continue
            台詞 = s.startswith("「") or s.startswith("『")
            if "——" in s or re.search(r'(?<!―)―(?!―)', s):
                v["ダッシュ"].append((tag, i, s[:40]))
            if re.search(r'(?<!…)…(?!…)', s) or "・・・" in s or "..." in s:
                v["三点"].append((tag, i, s[:40]))
            書類 = s[:1] in "・■□◆＊※〇●" or s.startswith("　・")
            地 = re.sub(r'『[^』]*』', '', s)      # 作中に書かれた字（手帳・札・看板）は除く
            for m in ([] if 書類 else 算用_re.finditer(地)):
                around = 地[max(0, m.start() - 3):m.end() + 3]
                if not 規格_re.search(around):
                    v["算用"].append((tag, i, s[:40]))
                    break
            if 忌避_re.search(s):
                v["忌避"].append((tag, i, 忌避_re.search(s).group(0) + "｜" + s[:30]))
            if 台詞:
                continue
            # ここから下は地の文だけ
            for one in re.split(r'(?<=。)', s):
                if 畳み_re.search(one) and not 回想_re.search(one):
                    v["畳み"].append((tag, i, one[:44]))
                if 性格_re.search(one):
                    v["性格"].append((tag, i, one[:44]))
                if 申告_re.search(one):
                    v["申告"].append((tag, i, one[:44]))
                if 時刻_re.search(one) and 午後_re.search(one):
                    v["時刻"].append((tag, i, one[:44]))
    短い理由 = 下限の理由(d)
    return v, len(chs), total, 短い理由


def 文体外れ(d):
    try:
        import importlib
        m = importlib.import_module("文体")
        got, _, _ = m.測る(章たち(d))
        tgt = m.目標(d)
        n = 0
        for k, (lo, hi) in tgt.items():
            x = got[k]
            if (lo is not None and x < lo) or (hi is not None and x > hi):
                n += 1
        return n if tgt else None
    except Exception:
        return None


違反 = ["短章", "語り手", "ダッシュ", "三点", "算用", "忌避", "読点"]
要確認 = ["畳み", "性格", "申告", "時刻"]


def 一覧():
    print("本編の点検（執筆規則 第三版）")
    print()
    print("| 篇 | 章 | 一章 | 短章 | 語り手 | ダッシュ | 三点 | 算用 | 忌避 | 読点 | **違反** | 畳み | 性格 | 申告 | 時刻 | 文体 |")
    print("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|")
    sums = {k: 0 for k in 違反 + 要確認}
    for d in 本編():
        v, nch, tot, 理由 = 点検(d)
        name = os.path.basename(d)
        短 = len(v["短章"])
        短s = ("%d※" % 短) if (短 and 理由) else str(短)
        bad = sum(len(v[k]) for k in 違反)
        for k in 違反 + 要確認:
            sums[k] += len(v[k])
        bt = 文体外れ(d)
        print("| %s | %d | %d | %s | %d | %d | %d | %d | %d | %d | **%d** | %d | %d | %d | %d | %s |" % (
            name, nch, tot // nch, 短s, len(v["語り手"]), len(v["ダッシュ"]), len(v["三点"]),
            len(v["算用"]), len(v["忌避"]), len(v["読点"]), bad,
            len(v["畳み"]), len(v["性格"]), len(v["申告"]), len(v["時刻"]),
            "—" if bt is None else str(bt)))
    print()
    print("計　" + "　".join("%s %d" % (k, sums[k]) for k in 違反 + 要確認))
    print()
    print("※ 設定.md に一章を短く取る理由が書いてある。違反には数えるが、直すかどうかは理由を読んで決める")
    print("文体＝設定.md「文体の目標」から外れている項目の数（— は目標が置かれていない）")


def 詳細(arg):
    d = arg if os.path.isabs(arg) else os.path.join(ROOT, arg.rstrip("/"))
    v, nch, tot, 理由 = 点検(d)
    print("%s　%d章　%d字　一章平均%d字" % (os.path.basename(d), nch, tot, tot // nch))
    for group, keys in [("違反（〇にする）", 違反), ("要確認（読んで決める）", 要確認)]:
        print()
        print("■ " + group)
        for k in keys:
            if not v[k]:
                continue
            print("  %s　%d" % (k, len(v[k])))
            for tag, i, s in v[k][:12]:
                print("    %s:%s　%s" % (tag, i, s))
            if len(v[k]) > 12:
                print("    …ほか %d" % (len(v[k]) - 12))


def 前後(arg):
    d = arg if os.path.isabs(arg) else os.path.join(ROOT, arg.rstrip("/"))
    v, nch, tot, _ = 点検(d)
    bt = 文体外れ(d)
    print("%s\t%d章\t%d字\t" % (os.path.basename(d), nch, tot) +
          "\t".join("%s=%d" % (k, len(v[k])) for k in 違反 + 要確認) +
          "\t文体=%s" % ("—" if bt is None else bt))


if __name__ == "__main__":
    a = sys.argv[1:]
    if not a:
        一覧()
    elif a[0] == "--前後":
        for x in a[1:]:
            前後(x)
    else:
        for x in a:
            詳細(x)
            print()
