import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { z } from "zod";
import { getProvider } from "../config.js";

function extractJsonObject(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return text.slice(start, end + 1);

  return text.trim();
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    if (value == null) return [];
    if (typeof value === "object") {
      return Object.entries(value as Record<string, unknown>).map(
        ([key, item]) =>
          typeof item === "string" ? `${key}: ${item}` : `${key}: ${JSON.stringify(item)}`,
      );
    }
    return [String(value)];
  }

  return value.map((item) => {
    if (typeof item === "string") return item;
    if (item && typeof item === "object") {
      const obj = item as Record<string, unknown>;
      if (typeof obj.text === "string") return obj.text;
      if (typeof obj.description === "string") return obj.description;
      return JSON.stringify(item);
    }
    return String(item);
  });
}

/** Coerce messy JSON from tiny local models before Zod validation. */
export function coercePrShape(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const obj = raw as Record<string, unknown>;

  return {
    title: typeof obj.title === "string" ? obj.title : String(obj.title ?? ""),
    summary:
      typeof obj.summary === "string" ? obj.summary : String(obj.summary ?? ""),
    changes: toStringList(obj.changes),
    testPlan: toStringList(obj.testPlan),
    risks: toStringList(obj.risks),
    ticketMapping: toStringList(obj.ticketMapping),
  };
}

async function invokeJsonFallback<T extends z.ZodTypeAny>(
  llm: BaseChatModel,
  schema: T,
  prompt: ChatPromptTemplate,
  values: Record<string, string>,
): Promise<z.infer<T>> {
  const baseMessages = await prompt.formatMessages(values);
  const contextText = baseMessages
    .map((m) => `${m._getType().toUpperCase()}:\n${String(m.content)}`)
    .join("\n\n");

  const jsonPrompt = ChatPromptTemplate.fromTemplate(
    `{context}

Return ONE JSON object only (no markdown). Every array item must be a plain string.
Keys: title (string), summary (string), changes (string[]), testPlan (string[]), risks (string[]), ticketMapping (string[]).`,
  );

  const raw = await jsonPrompt
    .pipe(llm)
    .pipe(new StringOutputParser())
    .invoke({ context: contextText });

  const parsed = JSON.parse(extractJsonObject(raw));
  return schema.parse(coercePrShape(parsed));
}

/**
 * OpenAI: native structured output. Local tiny models: JSON prompt + Zod parse.
 */
export async function invokeStructuredOutput<T extends z.ZodTypeAny>(
  llm: BaseChatModel,
  schema: T,
  prompt: ChatPromptTemplate,
  values: Record<string, string>,
): Promise<z.infer<T>> {
  if (getProvider() === "local") {
    return invokeJsonFallback(llm, schema, prompt, values);
  }

  const structured = llm.withStructuredOutput(schema);
  return prompt.pipe(structured).invoke(values);
}
