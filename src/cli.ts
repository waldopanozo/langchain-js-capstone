import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import {
  diffToParentDocuments,
  loadDiff,
  loadTicket,
  resolveDataPath,
  ticketToDocument,
} from "./ingest/loadDocuments.js";
import { createEmbeddings, getModelLabels } from "./config.js";
import { buildParentDocumentRetriever } from "./retrieval/parentDocumentRetriever.js";
import {
  generatePrDescription,
  generatePrDescriptionV1,
} from "./chains/prDescriptionChain.js";

const DEFAULT_TICKET = "sample-data/ticket.json";
const DEFAULT_DIFF = "sample-data/changes.diff";
const EVIDENCE_DIR = "evidence";

async function ensureEvidenceDir(): Promise<void> {
  await mkdir(resolveDataPath(EVIDENCE_DIR), { recursive: true });
}

async function buildRetriever(ticketPath: string, diffPath: string) {
  const ticket = await loadTicket(ticketPath);
  const diffText = await loadDiff(diffPath);
  const diffParents = diffToParentDocuments(diffText);
  const parents = [ticketToDocument(ticket), ...diffParents];

  const store = await buildParentDocumentRetriever(parents, createEmbeddings());
  console.log(
    `Indexed ${store.parentCount} parent docs (${store.childCount} child chunks for retrieval).`,
  );

  return { ticket, retriever: store.retriever };
}

async function cmdIngest(): Promise<void> {
  const ticketPath = resolveDataPath(DEFAULT_TICKET);
  const diffPath = resolveDataPath(DEFAULT_DIFF);
  await buildRetriever(ticketPath, diffPath);
  console.log("Ingestion complete (in-memory index built for this run).");
}

async function cmdGenerate(): Promise<void> {
  const ticketPath = resolveDataPath(DEFAULT_TICKET);
  const diffPath = resolveDataPath(DEFAULT_DIFF);
  const { ticket, retriever } = await buildRetriever(ticketPath, diffPath);

  const result = await generatePrDescription({ ticket, retriever });
  console.log(JSON.stringify(result, null, 2));
}

async function cmdDemo(): Promise<void> {
  await ensureEvidenceDir();
  const ticketPath = resolveDataPath(DEFAULT_TICKET);
  const diffPath = resolveDataPath(DEFAULT_DIFF);
  const { ticket, retriever } = await buildRetriever(ticketPath, diffPath);

  console.log("--- Iteration 1 (generic prompt, high temperature) ---");
  const v1 = await generatePrDescriptionV1({ ticket, retriever });
  const v1Path = resolveDataPath(`${EVIDENCE_DIR}/iteration-v1-raw.txt`);
  await writeFile(v1Path, v1, "utf8");
  console.log(v1.slice(0, 500) + (v1.length > 500 ? "\n...[truncated]" : ""));
  console.log(`Saved: ${v1Path}`);

  console.log("\n--- Iteration 2 (structured output + injection guard) ---");
  const v2 = await generatePrDescription({
    ticket,
    retriever,
    extraInstructions:
      "Map each acceptance criterion explicitly. Mention 429 and Retry-After if present in diff.",
  });
  const v2Path = resolveDataPath(`${EVIDENCE_DIR}/iteration-v2-structured.json`);
  await writeFile(v2Path, JSON.stringify(v2, null, 2), "utf8");
  console.log(JSON.stringify(v2, null, 2));
  console.log(`Saved: ${v2Path}`);

  const logPath = resolveDataPath(`${EVIDENCE_DIR}/run-log.txt`);
  await writeFile(
    logPath,
    [
      "PR Description RAG — demo run",
      `ticket: ${ticket.key}`,
      "",
      "Issue in v1: unstructured wall of text, easy to hallucinate file names.",
      "Fix in v2: Zod schema + lower temperature + explicit AC mapping + parent doc retrieval.",
      "",
      "LangSmith: set LANGCHAIN_TRACING_V2=true in .env for trace screenshots.",
    ].join("\n"),
    "utf8",
  );
  console.log(`\nRun log: ${logPath}`);
}

async function main(): Promise<void> {
  const command = process.argv[2] ?? "demo";
  const models = getModelLabels();
  console.log(
    `Provider: ${models.provider} | chat: ${models.chatModel} | embeddings: ${models.embeddingModel}`,
  );

  switch (command) {
    case "ingest":
      await cmdIngest();
      break;
    case "generate":
      await cmdGenerate();
      break;
    case "demo":
      await cmdDemo();
      break;
    default:
      console.error(`Unknown command: ${command}. Use ingest | generate | demo`);
      process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
