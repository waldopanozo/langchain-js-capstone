import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import type { Embeddings } from "@langchain/core/embeddings";
import { BaseRetriever } from "@langchain/core/retrievers";

const CHILD_CHUNK_SIZE = 400;
const CHILD_CHUNK_OVERLAP = 80;

export interface ParentDocumentStore {
  retriever: BaseRetriever;
  parentCount: number;
  childCount: number;
}

class ParentDocumentRetriever extends BaseRetriever {
  lc_namespace = ["pr-rag", "parent-document-retriever"];

  constructor(
    private readonly baseRetriever: BaseRetriever,
    private readonly parentById: Map<string, Document>,
  ) {
    super();
  }

  async _getRelevantDocuments(query: string): Promise<Document[]> {
    const childHits = await this.baseRetriever.invoke(query);
    const seen = new Set<string>();
    const parentsOut: Document[] = [];

    for (const hit of childHits) {
      const parentId = String(hit.metadata.parentId);
      if (seen.has(parentId)) continue;
      seen.add(parentId);

      const parent = this.parentById.get(parentId);
      if (parent) parentsOut.push(parent);
    }

    return parentsOut;
  }
}

/**
 * Parent Document Retrieval: small child chunks power semantic search;
 * matched children return their full parent diff hunk for richer LLM context.
 */
export async function buildParentDocumentRetriever(
  parents: Document[],
  embeddings: Embeddings,
): Promise<ParentDocumentStore> {
  const parentById = new Map<string, Document>();
  for (const parent of parents) {
    const id = String(parent.metadata.parentId ?? parent.metadata.source);
    parentById.set(id, parent);
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHILD_CHUNK_SIZE,
    chunkOverlap: CHILD_CHUNK_OVERLAP,
  });

  const childDocs: Document[] = [];
  for (const parent of parents) {
    const parentId = String(parent.metadata.parentId ?? parent.metadata.source);
    const chunks = await splitter.splitDocuments([
      new Document({
        pageContent: parent.pageContent,
        metadata: { ...parent.metadata, parentId },
      }),
    ]);

    for (const [index, chunk] of chunks.entries()) {
      childDocs.push(
        new Document({
          pageContent: chunk.pageContent,
          metadata: {
            ...chunk.metadata,
            parentId,
            childIndex: index,
          },
        }),
      );
    }
  }

  const vectorStore = await MemoryVectorStore.fromDocuments(
    childDocs,
    embeddings,
  );

  const baseRetriever = vectorStore.asRetriever({ k: 4 });
  const retriever = new ParentDocumentRetriever(baseRetriever, parentById);

  return {
    retriever,
    parentCount: parents.length,
    childCount: childDocs.length,
  };
}
