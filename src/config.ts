import "dotenv/config";
import type { Embeddings } from "@langchain/core/embeddings";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";

export type LlmProvider = "local" | "openai";

const OPENAI_CHAT_MODEL = "gpt-4o-mini";
const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";
const OLLAMA_CHAT_MODEL = "qwen2.5:0.5b";
const OLLAMA_EMBEDDING_MODEL = "nomic-embed-text";

export function getProvider(): LlmProvider {
  const raw = process.env.LLM_PROVIDER?.trim().toLowerCase();
  return raw === "openai" ? "openai" : "local";
}

export function getOllamaBaseUrl(): string {
  return process.env.OLLAMA_BASE_URL?.trim() || "http://localhost:11434";
}

function requireOpenAiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key?.trim()) {
    throw new Error(
      "OPENAI_API_KEY is missing. Set LLM_PROVIDER=openai only when the key is configured.",
    );
  }
  return key;
}

export function createChatModel(temperature = 0.2): BaseChatModel {
  if (getProvider() === "openai") {
    requireOpenAiKey();
    return new ChatOpenAI({
      model: process.env.OPENAI_CHAT_MODEL?.trim() || OPENAI_CHAT_MODEL,
      temperature,
    });
  }

  return new ChatOllama({
    baseUrl: getOllamaBaseUrl(),
    model: process.env.OLLAMA_CHAT_MODEL?.trim() || OLLAMA_CHAT_MODEL,
    temperature,
  });
}

export function createEmbeddings(): Embeddings {
  if (getProvider() === "openai") {
    requireOpenAiKey();
    return new OpenAIEmbeddings({
      model:
        process.env.OPENAI_EMBEDDING_MODEL?.trim() || OPENAI_EMBEDDING_MODEL,
    });
  }

  return new OllamaEmbeddings({
    baseUrl: getOllamaBaseUrl(),
    model:
      process.env.OLLAMA_EMBEDDING_MODEL?.trim() || OLLAMA_EMBEDDING_MODEL,
  });
}

export function getModelLabels(): {
  provider: LlmProvider;
  chatModel: string;
  embeddingModel: string;
} {
  const provider = getProvider();
  if (provider === "openai") {
    return {
      provider,
      chatModel: process.env.OPENAI_CHAT_MODEL?.trim() || OPENAI_CHAT_MODEL,
      embeddingModel:
        process.env.OPENAI_EMBEDDING_MODEL?.trim() || OPENAI_EMBEDDING_MODEL,
    };
  }

  return {
    provider,
    chatModel: process.env.OLLAMA_CHAT_MODEL?.trim() || OLLAMA_CHAT_MODEL,
    embeddingModel:
      process.env.OLLAMA_EMBEDDING_MODEL?.trim() || OLLAMA_EMBEDDING_MODEL,
  };
}
