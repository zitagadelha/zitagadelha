import os
import re
import urllib.request

css_url = "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&display=swap"
req = urllib.request.Request(
    css_url,
    headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"},
)
css = urllib.request.urlopen(req, timeout=30).read().decode()

base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
fonts_dir = os.path.join(base, "fonts")
os.makedirs(fonts_dir, exist_ok=True)

subset_re = re.compile(r"/\*\s*(latin-ext|latin)\s*\*/")
blocks = []
for match in subset_re.finditer(css):
    subset = match.group(1)
    chunk = css[match.end() : css.find("}", match.end()) + 1]
    if "@font-face" not in chunk:
        continue
    weight = re.search(r"font-weight:\s*(\d+)", chunk)
    url = re.search(r"url\((https://[^)]+)\)", chunk)
    unicode_range = re.search(r"unicode-range:\s*([^;]+);", chunk)
    if not (weight and url and unicode_range):
        continue
    blocks.append(
        {
            "subset": subset,
            "weight": weight.group(1),
            "url": url.group(1),
            "unicode_range": unicode_range.group(1).strip(),
        }
    )

downloaded = {}
faces = []
for block in blocks:
    key = (block["subset"], block["url"])
    if key not in downloaded:
        fname = f"montserrat-{block['subset']}-{len(downloaded) + 1}.woff2"
        path = os.path.join(fonts_dir, fname)
        urllib.request.urlretrieve(block["url"], path)
        downloaded[key] = fname
    faces.append({**block, "file": downloaded[key]})

css_lines = []
seen = set()
for block in faces:
    signature = (block["weight"], block["subset"], block["file"], block["unicode_range"])
    if signature in seen:
        continue
    seen.add(signature)
    css_lines.append(
        f"""@font-face {{
  font-family: "Montserrat";
  font-style: normal;
  font-weight: {block["weight"]};
  font-display: swap;
  unicode-range: {block["unicode_range"]};
  src: url("../fonts/{block["file"]}") format("woff2");
}}"""
    )

css_path = os.path.join(base, "css", "fonts.css")
with open(css_path, "w", encoding="utf-8") as fh:
    fh.write("\n\n".join(css_lines) + "\n")

for path in sorted(set(downloaded.values())):
    size = os.path.getsize(os.path.join(fonts_dir, path))
    print(path, f"{size // 1024}KB")
