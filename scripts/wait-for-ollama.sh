#!/bin/sh
set -eu

BASE_URL="${OLLAMA_BASE_URL:-http://localhost:11434}"
HOST="${BASE_URL#http://}"
HOST="${HOST#https://}"

echo "Waiting for Ollama at ${BASE_URL} ..."

until curl -sf "${BASE_URL}/api/tags" >/dev/null; do
  sleep 2
done

echo "Ollama is up."

CHAT_MODEL="${OLLAMA_CHAT_MODEL:-qwen2.5:0.5b}"
EMBED_MODEL="${OLLAMA_EMBEDDING_MODEL:-nomic-embed-text}"

for model in "$CHAT_MODEL" "$EMBED_MODEL"; do
  if curl -sf "${BASE_URL}/api/tags" | grep -q "\"name\":\"${model}\""; then
    echo "Model already present: ${model}"
  else
    echo "Pulling model: ${model} (first run may take several minutes) ..."
    curl -sf "${BASE_URL}/api/pull" -d "{\"name\":\"${model}\"}" >/dev/null
    echo "Pulled: ${model}"
  fi
done

if [ "$#" -gt 0 ]; then
  exec "$@"
fi
