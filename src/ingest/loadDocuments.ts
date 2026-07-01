import { readFile } from "node:fs/promises";
import path from "node:path";
import { Document } from "@langchain/core/documents";

export interface Ticket {
  key: string;
  title: string;
  type: string;
  priority: string;
  description: string;
  acceptanceCriteria: string[];
  labels: string[];
}

export async function loadTicket(filePath: string): Promise<Ticket> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as Ticket;
}

export async function loadDiff(filePath: string): Promise<string> {
  return readFile(filePath, "utf8");
}

/** Split a unified diff into parent documents (one per file hunk). */
export function diffToParentDocuments(diffText: string): Document[] {
  const sections = diffText.split(/^diff --git /m).filter(Boolean);
  return sections.map((section, index) => {
    const body = section.startsWith("diff --git ")
      ? section
      : `diff --git ${section}`;
    const headerLine = body.split("\n")[0] ?? `section-${index}`;
    const fileMatch = headerLine.match(/a\/(.+?) b\//);
    const filePath = fileMatch?.[1] ?? `unknown-${index}`;

    return new Document({
      pageContent: body.trim(),
      metadata: {
        source: filePath,
        docType: "diff-hunk",
        parentId: filePath,
      },
    });
  });
}

export function ticketToDocument(ticket: Ticket): Document {
  const criteria = ticket.acceptanceCriteria.map((c) => `- ${c}`).join("\n");
  return new Document({
    pageContent: [
      `Ticket ${ticket.key}: ${ticket.title}`,
      `Type: ${ticket.type} | Priority: ${ticket.priority}`,
      `Labels: ${ticket.labels.join(", ")}`,
      "",
      ticket.description,
      "",
      "Acceptance criteria:",
      criteria,
    ].join("\n"),
    metadata: {
      source: ticket.key,
      docType: "ticket",
      parentId: ticket.key,
    },
  });
}

export function resolveDataPath(relativePath: string): string {
  return path.resolve(process.cwd(), relativePath);
}
