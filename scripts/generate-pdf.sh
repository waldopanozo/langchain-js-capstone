#!/bin/sh
set -eu

cd "$(dirname "$0")/.."

OUT="docs/TDD-PR-Description-RAG.pdf"
MD="docs/TDD.md"
HTML="/tmp/langchain-capstone-tdd.html"

if [ ! -f "$MD" ]; then
  echo "Missing $MD"
  exit 1
fi

echo "Converting $MD to HTML ..."
npx --yes marked "$MD" > /tmp/tdd-body.html

cat > "$HTML" <<'WRAPPER'
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Technical Design Document — PR Description RAG</title>
<style>
WRAPPER

cat docs/pdf-style.css >> "$HTML"

cat >> "$HTML" <<'WRAPPER'
</style>
</head>
<body>
WRAPPER

cat /tmp/tdd-body.html >> "$HTML"

cat >> "$HTML" <<'WRAPPER'
</body>
</html>
WRAPPER

CHROME=""
for candidate in google-chrome google-chrome-stable chromium chromium-browser; do
  if command -v "$candidate" >/dev/null 2>&1; then
    CHROME="$candidate"
    break
  fi
done

if [ -z "$CHROME" ]; then
  echo "No Chrome/Chromium found. Install google-chrome or run: npm install -g md-to-pdf"
  exit 1
fi

echo "Rendering PDF with $CHROME ..."
"$CHROME" \
  --headless=new \
  --disable-gpu \
  --no-sandbox \
  --print-to-pdf="$OUT" \
  "file://$HTML"

rm -f "$HTML" /tmp/tdd-body.html
echo "Done: $OUT ($(wc -c < "$OUT") bytes)"
