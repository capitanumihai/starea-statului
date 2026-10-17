import html
import json
import re
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

base = "https://serviciipublice.gov.ro"
rows = []
page_number = 1
while True:
    url = base + "/institutii" + ("?page=" + str(page_number) if page_number > 1 else "")
    request = urllib.request.Request(url, headers={"User-Agent": "StareaStatului/0.1 catalog research"})
    document = urllib.request.urlopen(request, timeout=20).read().decode("utf-8")
    articles = re.findall(r"<article\b[^>]*>(.*?)</article>", document, re.S)
    for article in articles:
        identifier = re.search(r'href="/institutii/(\d+)"', article)
        heading = re.search(r"<h3[^>]*>(.*?)</h3>", article, re.S)
        parent = re.search(r"Subordonat[ăa].*?</p>", article, re.S)
        clean = lambda value: html.unescape(re.sub(r"<[^>]*>", "", value)).strip()
        if identifier and heading:
            rows.append({"id": identifier.group(1), "name": clean(heading.group(1)), "source": base + "/institutii/" + identifier.group(1), "reportedParent": clean(parent.group(0)) if parent else None})
    pages = [int(number) for number in re.findall(r'href="/institutii\?page=(\d+)"', document)]
    if not pages or page_number >= max(pages):
        break
    page_number += 1
    if page_number > 100:
        raise RuntimeError("Limita paginării a fost depășită")
    time.sleep(0.4)

identifiers = [item["id"] for item in rows]
if len(identifiers) != len(set(identifiers)) or not rows:
    raise RuntimeError("Catalogul sursă este gol sau conține înregistrări duplicate")
root = Path(__file__).resolve().parent.parent
destination = root / "data" / "reference"
destination.mkdir(parents=True, exist_ok=True)
payload = {"source": base + "/institutii", "fetchedAt": datetime.now(timezone.utc).isoformat(), "count": len(rows), "note": "Sursă de cercetare, nu import automat în catalogul public. Include instituții din afara scopului și poate conține denumiri istorice. Validarea rămâne necesară.", "institutions": rows}
(destination / "adr-institutions.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"count": len(rows), "pages": page_number, "saved": str(destination / "adr-institutions.json")}, ensure_ascii=False))
