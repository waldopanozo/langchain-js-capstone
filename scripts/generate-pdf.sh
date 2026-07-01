#!/bin/sh
set -eu

cd "$(dirname "$0")/.."

OUT="docs/TDD-PR-Description-RAG.pdf"

echo "Generating PDF from docs/TDD.md ..."
npx --yes md-to-pdf docs/TDD.md \
  --stylesheet docs/pdf-style.css \
  --pdf-options '{"format":"A4","margin":{"top":"20mm","bottom":"20mm","left":"18mm","right":"18mm"}}'

if [ -f "docs/TDD.pdf" ]; then
  mv docs/TDD.pdf "$OUT"
fi

echo "Done: $OUT"
