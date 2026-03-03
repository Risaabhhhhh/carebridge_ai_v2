# services/document_parser.py

import io
import re
from typing import Optional

import pdfplumber
import pytesseract
from PIL import Image
from pdf2image import convert_from_bytes


def clean_text(text: str) -> str:
    """
    Normalize whitespace and clean OCR artifacts.
    """
    if not text:
        return ""

    text = re.sub(r"\s+", " ", text)
    return text.strip()


def extract_text_from_pdf(content: bytes) -> str:
    """
    Hybrid PDF extraction:
    1. Try pdfplumber (for digital PDFs)
    2. Fallback to OCR if no text found (for scanned PDFs)
    """
    extracted_text = ""

    # First attempt: digital extraction
    try:
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
    except Exception as e:
        print("⚠️ pdfplumber failed:", e)

    # Fallback: OCR
    if not extracted_text.strip():
        print("⚠️ Falling back to OCR for scanned PDF.")
        try:
            images = convert_from_bytes(content)
            for img in images:
                extracted_text += pytesseract.image_to_string(img) + "\n"
        except Exception as e:
            print("⚠️ OCR fallback failed:", e)

    return clean_text(extracted_text)


def extract_text_from_image(content: bytes) -> str:
    """
    OCR extraction for image files.
    """
    try:
        image = Image.open(io.BytesIO(content))
        text = pytesseract.image_to_string(image)
        return clean_text(text)
    except Exception as e:
        print("⚠️ Image OCR failed:", e)
        return ""


def extract_text_from_file(filename: str, content_type: str, content: bytes) -> str:
    """
    Unified entry point for all file types.
    """
    if content_type == "application/pdf" or filename.endswith(".pdf"):
        return extract_text_from_pdf(content)

    elif content_type.startswith("image/"):
        return extract_text_from_image(content)

    else:
        try:
            return clean_text(content.decode("utf-8", errors="ignore"))
        except Exception:
            return ""