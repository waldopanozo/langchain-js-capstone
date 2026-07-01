#!/bin/sh
set -eu

cd "$(dirname "$0")/.."

echo "Starting Ollama (Docker) ..."
docker compose up -d ollama

export LLM_PROVIDER=local
export OLLAMA_BASE_URL=http://localhost:11434
export OLLAMA_CHAT_MODEL="${OLLAMA_CHAT_MODEL:-qwen2.5:0.5b}"
export OLLAMA_EMBEDDING_MODEL="${OLLAMA_EMBEDDING_MODEL:-nomic-embed-text}"

./scripts/wait-for-ollama.sh

echo "Running app in Docker ..."
docker compose --profile run run --rm app "$@"
