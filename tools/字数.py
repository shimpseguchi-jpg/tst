import sys, re, unicodedata
for p in sys.argv[1:]:
    s = open(p, encoding='utf-8').read()
    s = re.sub(r'^#.*$', '', s, flags=re.M)   # 見出しを除く
    s = re.sub(r'\s', '', s)                  # 空白・改行を除く
    print(f"{p}\t{len(s)}字")
