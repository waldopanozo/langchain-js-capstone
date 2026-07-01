FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN chmod +x scripts/wait-for-ollama.sh

ENV LLM_PROVIDER=local \
    OLLAMA_BASE_URL=http://ollama:11434 \
    OLLAMA_CHAT_MODEL=qwen2.5:0.5b \
    OLLAMA_EMBEDDING_MODEL=nomic-embed-text

ENTRYPOINT ["./scripts/wait-for-ollama.sh"]
CMD ["npm", "run", "demo"]
