# ocr/extractor.py
#
# ══════════════════════════════════════════════════════════════════════════════
# CareBridge AI — OCR / Text Extraction Engine
#
# Handles 4 input types:
#   1. Plain text paste    → returned as-is (already text)
#   2. PDF (bytes)         → pdfplumber → pymupdf fallback → pdfminer fallback
#   3. Image (bytes)       → pytesseract with Indian language packs
#   4. Mixed PDF+images    → per-page: text layer first, OCR if blank
#
# WHY ALL CLAUSES RETURN "Not Found"
# ───────────────────────────────────
# When a user uploads a scanned PDF or image of a policy, the file arrives as
# bytes. Without OCR, policy_text = "" or raw binary garbage. The rule engine
# finds no keywords → all fields "Not Found". MedGemma gets empty context →
# outputs "Not Found" for everything. Score = 57 (all-Not-Found baseline).
#
# This file fixes that by extracting clean text before the engine runs.
#
# DEPENDENCIES (add to requirements.txt if not present):
#   pdfplumber>=0.10.0
#   pymupdf>=1.23.0          (import as fitz)
#   pdfminer.six>=20221105
#   pytesseract>=0.3.10
#   Pillow>=10.0.0
#   python-magic>=0.4.27     (MIME detection)
#
# TESSERACT SYSTEM INSTALL (Ubuntu/Debian):
#   sudo apt-get install tesseract-ocr tesseract-ocr-hin tesseract-ocr-mar \
#                        tesseract-ocr-tam tesseract-ocr-eng
# ══════════════════════════════════════════════════════════════════════════════

from __future__ import annotations

import io
import os
import re
import logging
from pathlib import Path
from typing import Union

logger = logging.getLogger(__name__)

# ── Optional dependency imports (graceful degradation) ───────────────────────

try:
    import pdfplumber
    _HAS_PDFPLUMBER = True
except ImportError:
    _HAS_PDFPLUMBER = False
    logger.warning("pdfplumber not installed — PDF text extraction degraded")

try:
    import fitz  # pymupdf
    _HAS_PYMUPDF = True
except ImportError:
    _HAS_PYMUPDF = False

try:
    from pdfminer.high_level import extract_text as pdfminer_extract
    _HAS_PDFMINER = True
except ImportError:
    _HAS_PDFMINER = False

try:
    import pytesseract
    from PIL import Image
    _HAS_TESSERACT = True
except ImportError:
    _HAS_TESSERACT = False
    logger.warning("pytesseract/Pillow not installed — image OCR unavailable")

try:
    import magic
    _HAS_MAGIC = True
except ImportError:
    _HAS_MAGIC = False


# ── Constants ─────────────────────────────────────────────────────────────────

# Tesseract language string — covers all 4 CareBridge languages
# Falls back to eng-only if Indian packs not installed
_TESS_LANG_FULL = "eng+hin+mar+tam"
_TESS_LANG_ENG  = "eng"

# Minimum characters to consider a page "text-bearing" (not blank/scanned)
_MIN_TEXT_PAGE_CHARS = 30

# Max characters to pass to the LLM (MedGemma context window safety)
_MAX_OUTPUT_CHARS = 4000


# ══════════════════════════════════════════════════════════════════════════════
# PUBLIC API
# ══════════════════════════════════════════════════════════════════════════════

def extract_text_from_file(file_path: Union[str, Path]) -> str:
    """
    Extract text from a file on disk.
    Detects type from extension. Returns clean UTF-8 string.
    """
    path = Path(file_path)
    suffix = path.suffix.lower()

    with open(path, "rb") as f:
        data = f.read()

    if suffix in (".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".webp"):
        return _ocr_image_bytes(data)
    elif suffix == ".pdf":
        return _extract_pdf_bytes(data)
    elif suffix in (".txt", ".text"):
        return data.decode("utf-8", errors="replace")[:_MAX_OUTPUT_CHARS]
    else:
        # Try PDF first, then image OCR
        return _extract_unknown_bytes(data)


def extract_text_from_bytes(
    data: bytes,
    filename: str = "",
    mime_type: str = "",
) -> str:
    """
    Extract text from raw bytes (FastAPI UploadFile.read()).

    Parameters
    ----------
    data      : raw file bytes
    filename  : original filename (used for extension hint)
    mime_type : MIME type if known (e.g. "application/pdf", "image/jpeg")
    """
    if not data:
        return ""

    # Detect type
    detected = _detect_type(data, filename, mime_type)

    if detected == "pdf":
        return _extract_pdf_bytes(data)
    elif detected == "image":
        return _ocr_image_bytes(data)
    elif detected == "text":
        return data.decode("utf-8", errors="replace")[:_MAX_OUTPUT_CHARS]
    else:
        return _extract_unknown_bytes(data)


# ══════════════════════════════════════════════════════════════════════════════
# TYPE DETECTION
# ══════════════════════════════════════════════════════════════════════════════

def _detect_type(data: bytes, filename: str, mime_type: str) -> str:
    """Returns 'pdf' | 'image' | 'text' | 'unknown'"""

    # 1. Explicit MIME
    if mime_type:
        if "pdf" in mime_type:         return "pdf"
        if "image" in mime_type:       return "image"
        if "text" in mime_type:        return "text"

    # 2. File extension
    ext = Path(filename).suffix.lower()
    if ext == ".pdf":                  return "pdf"
    if ext in (".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".webp"):
        return "image"
    if ext in (".txt", ".text"):       return "text"

    # 3. Magic bytes
    if data[:4] == b"%PDF":            return "pdf"
    if data[:3] == b"\xff\xd8\xff":   return "image"  # JPEG
    if data[:8] == b"\x89PNG\r\n\x1a\n": return "image"  # PNG

    # 4. python-magic fallback
    if _HAS_MAGIC:
        try:
            mime = magic.from_buffer(data[:2048], mime=True)
            if "pdf" in mime:   return "pdf"
            if "image" in mime: return "image"
            if "text" in mime:  return "text"
        except Exception:
            pass

    return "unknown"


# ══════════════════════════════════════════════════════════════════════════════
# PDF EXTRACTION — 3-layer fallback
# ══════════════════════════════════════════════════════════════════════════════

def _extract_pdf_bytes(data: bytes) -> str:
    """
    Layer 1: pdfplumber  — best for structured policy PDFs
    Layer 2: pymupdf     — faster, handles more edge cases
    Layer 3: pdfminer    — slowest but most compatible
    Layer 4: OCR         — scanned PDFs with no text layer
    """
    text = ""

    # ── Layer 1: pdfplumber ───────────────────────────────────────────────────
    if _HAS_PDFPLUMBER and not text:
        try:
            text = _pdfplumber_extract(data)
            if text:
                logger.debug(f"pdfplumber: {len(text)} chars")
        except Exception as e:
            logger.warning(f"pdfplumber failed: {e}")

    # ── Layer 2: pymupdf ──────────────────────────────────────────────────────
    if _HAS_PYMUPDF and not text:
        try:
            text = _pymupdf_extract(data)
            if text:
                logger.debug(f"pymupdf: {len(text)} chars")
        except Exception as e:
            logger.warning(f"pymupdf failed: {e}")

    # ── Layer 3: pdfminer ─────────────────────────────────────────────────────
    if _HAS_PDFMINER and not text:
        try:
            text = pdfminer_extract(io.BytesIO(data)) or ""
            text = _clean(text)
            logger.debug(f"pdfminer: {len(text)} chars")
        except Exception as e:
            logger.warning(f"pdfminer failed: {e}")

    # ── Layer 4: OCR fallback for scanned PDFs ────────────────────────────────
    if not text and _HAS_TESSERACT and _HAS_PYMUPDF:
        try:
            text = _ocr_pdf_via_pymupdf(data)
            logger.debug(f"OCR fallback: {len(text)} chars")
        except Exception as e:
            logger.warning(f"PDF OCR fallback failed: {e}")

    if not text:
        logger.error("All PDF extraction methods failed — returning empty string")

    return text[:_MAX_OUTPUT_CHARS]


def _pdfplumber_extract(data: bytes) -> str:
    """
    pdfplumber with per-page text extraction.
    If a page has <30 chars (scanned), falls back to OCR for that page.
    """
    pages_text: list[str] = []

    with pdfplumber.open(io.BytesIO(data)) as pdf:
        for page_num, page in enumerate(pdf.pages):
            try:
                page_text = page.extract_text(
                    x_tolerance=3,
                    y_tolerance=3,
                    layout=True,
                ) or ""

                if len(page_text.strip()) < _MIN_TEXT_PAGE_CHARS:
                    # Scanned page — try OCR
                    if _HAS_TESSERACT:
                        img = page.to_image(resolution=200).original
                        page_text = _ocr_pil_image(img)
                        logger.debug(f"Page {page_num+1}: OCR fallback ({len(page_text)} chars)")
                    else:
                        logger.debug(f"Page {page_num+1}: blank, no OCR available")

                if page_text.strip():
                    pages_text.append(page_text.strip())

            except Exception as e:
                logger.warning(f"pdfplumber page {page_num+1} error: {e}")
                continue

    return _clean("\n\n".join(pages_text))


def _pymupdf_extract(data: bytes) -> str:
    """pymupdf text extraction — fast and handles rotated/complex PDFs."""
    doc   = fitz.open(stream=data, filetype="pdf")
    pages = []
    for page in doc:
        text = page.get_text("text")
        if text.strip():
            pages.append(text.strip())
    doc.close()
    return _clean("\n\n".join(pages))


def _ocr_pdf_via_pymupdf(data: bytes) -> str:
    """
    Render each PDF page as an image via pymupdf, then run Tesseract.
    Used when the PDF has no text layer (fully scanned).
    """
    doc   = fitz.open(stream=data, filetype="pdf")
    pages = []
    for page in doc:
        # 200 DPI is sufficient for Tesseract accuracy
        mat  = fitz.Matrix(200 / 72, 200 / 72)
        pix  = page.get_pixmap(matrix=mat, alpha=False)
        img  = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        text = _ocr_pil_image(img)
        if text.strip():
            pages.append(text.strip())
    doc.close()
    return _clean("\n\n".join(pages))


# ══════════════════════════════════════════════════════════════════════════════
# IMAGE OCR
# ══════════════════════════════════════════════════════════════════════════════

def _ocr_image_bytes(data: bytes) -> str:
    """Run Tesseract on raw image bytes."""
    if not _HAS_TESSERACT:
        logger.error("pytesseract not installed — cannot OCR image")
        return ""
    try:
        img  = Image.open(io.BytesIO(data))
        return _clean(_ocr_pil_image(img))[:_MAX_OUTPUT_CHARS]
    except Exception as e:
        logger.error(f"Image OCR failed: {e}")
        return ""


def _ocr_pil_image(img: "Image.Image") -> str:
    """
    Run Tesseract on a PIL image.
    Tries full Indian language pack first, falls back to English-only.
    """
    # Pre-process: convert to grayscale for better accuracy
    if img.mode != "L":
        img = img.convert("L")

    # Try with Indian language packs
    try:
        text = pytesseract.image_to_string(
            img,
            lang=_TESS_LANG_FULL,
            config="--psm 3 --oem 3",
        )
        return text
    except pytesseract.TesseractError:
        pass

    # Fallback to English only
    try:
        text = pytesseract.image_to_string(
            img,
            lang=_TESS_LANG_ENG,
            config="--psm 3 --oem 3",
        )
        return text
    except Exception as e:
        logger.error(f"Tesseract fallback failed: {e}")
        return ""


# ══════════════════════════════════════════════════════════════════════════════
# UNKNOWN TYPE FALLBACK
# ══════════════════════════════════════════════════════════════════════════════

def _extract_unknown_bytes(data: bytes) -> str:
    """Try PDF, then image OCR, then raw UTF-8 decode."""
    # Try PDF
    if data[:4] == b"%PDF" or _HAS_PDFPLUMBER:
        try:
            text = _extract_pdf_bytes(data)
            if text:
                return text
        except Exception:
            pass

    # Try image OCR
    if _HAS_TESSERACT:
        try:
            text = _ocr_image_bytes(data)
            if text:
                return text
        except Exception:
            pass

    # Raw decode as last resort
    try:
        return data.decode("utf-8", errors="replace")[:_MAX_OUTPUT_CHARS]
    except Exception:
        return ""


# ══════════════════════════════════════════════════════════════════════════════
# TEXT CLEANING
# ══════════════════════════════════════════════════════════════════════════════

def _clean(text: str) -> str:
    """
    Normalise extracted text for downstream LLM and rule engine processing.
    - Collapse excessive whitespace
    - Remove null bytes and control characters
    - Normalise line endings
    - Keep Devanagari (Hindi/Marathi) and Tamil unicode ranges intact
    """
    if not text:
        return ""

    # Remove null bytes and non-printable control chars (keep newlines/tabs)
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", " ", text)

    # Normalise line endings
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Collapse 3+ consecutive blank lines to 2
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Collapse multiple spaces to single (but preserve newlines)
    text = re.sub(r"[ \t]{2,}", " ", text)

    # Strip leading/trailing whitespace per line
    lines = [line.strip() for line in text.split("\n")]
    text  = "\n".join(lines)

    return text.strip()