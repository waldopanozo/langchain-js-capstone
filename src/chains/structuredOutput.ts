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

Return ONE JSON object only (no markdown fences) with keys:
title, summary, changes (array), testPlan (array), risks (array), ticketMapping (array).`,
  );

  const raw = await jsonPrompt
    .pipe(llm)
    .pipe(new StringOutputParser())
    .invoke({ context: contextText });

  return schema.parse(JSON.parse(extractJsonObject(raw)));
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
