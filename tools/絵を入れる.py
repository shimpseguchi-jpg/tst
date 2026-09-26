# -*- coding: utf-8 -*-
"""生成した一枚絵を、リーダーが読める形にして reader/portraits/ に入れる。

    python3 tools/絵を入れる.py                     ← _取り込み/ の中を全部
    python3 tools/絵を入れる.py 適当な名前.png ...   ← ファイルを直に指定

やること
  ・グレースケールにする（鉛筆画なので色は要らない）
  ・長辺を九百ピクセルに縮める（大きいものだけ。小さいものは拡大しない）
  ・WebP 品質八十二で保存する
  ・人物詳細.py の art= が指す名前に付け替える

ファイル名は適当でよい。『藤木』でも『fujiki』でも『kanae』でも拾う。
拾えなかったものは何もせずに残し、最後に一覧で出す。

Pillow が要る。無ければ  pip install Pillow
"""
import json, os, re, sys, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GUIDE = os.path.join(ROOT, "reader", "data", "guide.json")
OUT = os.path.join(ROOT, "reader", "portraits")
INBOX = os.path.join(OUT, "_取り込み")
LONG_EDGE = 900
QUALITY = 82
EXT = (".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff")

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow が入っていません。  pip install Pillow")


def norm(s):
    """比較用に、小文字・記号なしに均す。"""
    s = unicodedata.normalize("NFKC", s).lower()
    return re.sub(r"[^0-9a-z぀-ヿ一-鿿]", "", s)


def people():
    """[(表示名, 出力名, [手がかり…])] を返す。手がかりは長い順。"""
    out = []
    for p in json.load(open(GUIDE, encoding="utf-8"))["people"]:
        if not p.get("art"):
            continue
        base = os.path.basename(p["art"])
        slug = os.path.splitext(base)[0]
        keys = {slug, slug.replace("-", "")} | set(slug.split("-"))
        keys |= {p["name"].replace(" ", "")} | set(p["name"].split())
        keys |= {p.get("yomi", "").replace(" ", "")} | set(p.get("yomi", "").split())
        keys = {norm(k) for k in keys if len(norm(k)) >= 2}
        out.append((p["name"], base, sorted(keys, key=len, reverse=True)))
    return out


def match(stem, table):
    """名前の手がかりがいちばん長く当たった人を返す。当たらなければ None。"""
    n = norm(stem)
    best, best_len = None, 0
    for name, base, keys in table:
        for k in keys:
            if k in n and len(k) > best_len:
                best, best_len = (name, base), len(k)
    return best


def convert(src, dst):
    im = Image.open(src)
    if im.mode in ("RGBA", "LA", "P"):          # 透過は白で潰す
        bg = Image.new("RGBA", im.size, (255, 255, 255, 255))
        im = Image.alpha_composite(bg, im.convert("RGBA"))
    im = im.convert("L")
    w, h = im.size
    if max(w, h) > LONG_EDGE:
        r = LONG_EDGE / float(max(w, h))
        im = im.resize((max(1, round(w * r)), max(1, round(h * r))), Image.LANCZOS)
    im.convert("RGB").save(dst, "WEBP", quality=QUALITY, method=6)
    return im.size


def main():
    table = people()
    args = sys.argv[1:]
    if args:
        files = [a for a in args if os.path.isfile(a)]
    else:
        if not os.path.isdir(INBOX):
            os.makedirs(INBOX, exist_ok=True)
            sys.exit("%s を作った。ここに画像を置いてから、もう一度実行する。" % INBOX)
        files = [os.path.join(INBOX, f) for f in sorted(os.listdir(INBOX))
                 if f.lower().endswith(EXT)]
    if not files:
        sys.exit("画像が見つからない。")

    done, unknown, clash = [], [], {}
    for f in files:
        hit = match(os.path.splitext(os.path.basename(f))[0], table)
        if not hit:
            unknown.append(os.path.basename(f))
            continue
        name, base = hit
        clash.setdefault(name, []).append(os.path.basename(f))
        dst = os.path.join(OUT, base)
        size = convert(f, dst)
        kb = os.path.getsize(dst) / 1024.0
        done.append((name, base, size, kb))

    for name, base, size, kb in done:
        mark = "" if kb <= 200 else "　← 重い。品質を下げるか、長辺を縮める"
        print("  %-12s → %-26s %dx%d  %.0fKB%s" % (name, base, size[0], size[1], kb, mark))
    print("取り込んだ: %d枚" % len(done))

    dup = {k: v for k, v in clash.items() if len(v) > 1}
    if dup:
        print("\n同じ人に二枚以上あたった。あとの一枚だけが残っている")
        for name, fs in dup.items():
            print("  %s ← %s" % (name, "、".join(fs)))
        print("  採らないほうは、先に別の場所へ移してから実行する。")

    if unknown:
        print("\n誰の絵か分からなかった（そのまま残してある）")
        for u in unknown:
            print("  ", u)
        print("  ファイル名に名前かスラッグを入れるか、出力名で直に置く。")

    missing = [n for n, b, k in table if not os.path.exists(os.path.join(OUT, b))]
    if missing:
        print("\nまだ絵が無い: %d人" % len(missing))
        print("  " + "、".join(missing))
    else:
        print("\n十五人ぶん、そろっている。")


if __name__ == "__main__":
    main()
