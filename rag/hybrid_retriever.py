from pathlib import Path
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np


class HybridRegulatoryRetriever:

    def __init__(self):
        self.model = SentenceTransformer("all-MiniLM-L6-v2")
        self.text_chunks = []
        self.index = None
        self._load_documents()
        self._build_index()

    def _load_documents(self):
        base_path = Path("rag/regulatory_docs")
        for file in base_path.glob("*.txt"):
            content = file.read_text()
            chunks = content.split("\n")
            self.text_chunks.extend([c for c in chunks if len(c.strip()) > 20])

    def _build_index(self):
        embeddings = self.model.encode(self.text_chunks)
        dimension = embeddings.shape[1]

        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(np.array(embeddings))

    def retrieve(self, query: str, top_k: int = 5):

        # Keyword pre-filter
        keywords = ["rejection", "waiting", "documentation", "clause", "grievance", "ombudsman"]

        keyword_hits = [
            chunk for chunk in self.text_chunks
            if any(k in chunk.lower() for k in keywords)
        ]

        # If keyword filter too strict, fallback to full set
        candidate_chunks = keyword_hits if len(keyword_hits) > 3 else self.text_chunks

        query_embedding = self.model.encode([query])
        D, I = self.index.search(np.array(query_embedding), top_k)

        semantic_hits = [self.text_chunks[i] for i in I[0]]

        # Combine keyword + semantic
        combined = list(set(candidate_chunks + semantic_hits))

        return "\n".join(combined[:top_k])
