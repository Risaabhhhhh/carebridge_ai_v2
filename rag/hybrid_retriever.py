# rag/hybrid_retriever.py

from pathlib import Path
import numpy as np

from sentence_transformers import SentenceTransformer
import faiss


# Minimum relevance threshold — L2 distance below this = relevant
# All-MiniLM-L6-v2 typical range: 0.0 (identical) to ~2.0 (unrelated)
_RELEVANCE_THRESHOLD = 1.2

# Characters per chunk — enough for a complete regulatory paragraph
_CHUNK_SIZE = 400
_CHUNK_OVERLAP = 80


def _chunk_text(text: str, chunk_size: int, overlap: int) -> list[str]:
    """
    Split text into overlapping character-level chunks.
    Overlap preserves context at chunk boundaries.
    """
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end].strip()
        if len(chunk) > 30:   # skip tiny fragments
            chunks.append(chunk)
        start += chunk_size - overlap
    return chunks


class HybridRegulatoryRetriever:
    """
    Semantic retriever over IRDAI regulatory documents.
    Uses sentence-transformers + FAISS with relevance threshold filtering.
    Designed as a singleton — load once, reuse across requests.
    """

    def __init__(self):
        print("🔄 Loading sentence transformer...")
        self.embed_model = SentenceTransformer("all-MiniLM-L6-v2")
        self.text_chunks: list[str] = []
        self.index: faiss.Index | None = None
        self._load_documents()
        self._build_index()
        print(f"✅ Retriever ready — {len(self.text_chunks)} chunks indexed")

    def _load_documents(self):
        base_path = Path("rag/regulatory_docs")
        if not base_path.exists():
            print("⚠️ regulatory_docs directory not found — retriever will return empty results")
            return

        for file in sorted(base_path.glob("*.txt")):
            try:
                content = file.read_text(encoding="utf-8", errors="ignore")
                chunks = _chunk_text(content, _CHUNK_SIZE, _CHUNK_OVERLAP)
                self.text_chunks.extend(chunks)
                print(f"  Loaded {len(chunks)} chunks from {file.name}")
            except Exception as e:
                print(f"⚠️ Failed to load {file.name}: {e}")

    def _build_index(self):
        if not self.text_chunks:
            print("⚠️ No chunks to index — skipping FAISS build")
            return

        embeddings = self.embed_model.encode(
            self.text_chunks,
            batch_size=64,
            show_progress_bar=False,
        )
        dimension = embeddings.shape[1]

        # IndexFlatL2 = exact search, fine for <10k chunks
        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(np.array(embeddings, dtype=np.float32))

    def retrieve(self, query: str, top_k: int = 5) -> str:
        """
        Retrieve top-k relevant regulatory chunks for a query.
        Returns empty string if index not built or no relevant results found.
        """
        if self.index is None or not self.text_chunks:
            return "Regulatory references not available."

        query_embedding = self.embed_model.encode([query])
        distances, indices = self.index.search(
            np.array(query_embedding, dtype=np.float32),
            min(top_k * 2, len(self.text_chunks)),  # fetch extra for threshold filtering
        )

        # ✅ Filter by relevance threshold — don't return irrelevant chunks
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx == -1:
                continue
            if dist > _RELEVANCE_THRESHOLD:
                continue   # too dissimilar — skip
            results.append((dist, self.text_chunks[idx]))

        if not results:
            return "No relevant regulatory references found for this query."

        # ✅ Sort by distance (ascending = most relevant first), deduplicate, take top_k
        results.sort(key=lambda x: x[0])
        seen = set()
        final = []
        for dist, chunk in results:
            if chunk not in seen:
                seen.add(chunk)
                final.append(chunk)
            if len(final) >= top_k:
                break

        return "\n\n".join(final)