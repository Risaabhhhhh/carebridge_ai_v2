# main.py

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from llm.model_loader import ModelLoader
from engines.post_rejection_engine import PostRejectionEngine
from engines.pre_purchase_engine import PrePurchaseEngine
from engines.policy_comparison_engine import PolicyComparisonEngine

from schemas.request import PostRejectionRequest, PrePurchaseRequest
from schemas.chat import ReportChatResponse
from schemas.policy_comparison import PolicyComparisonReport

from services.report_chat_service import run_report_chat
from services.chat_memory import create_session
from services.document_parser import extract_text_from_file

# ── OCR extractor (new) ───────────────────────────────────────────────────────
# Falls back gracefully to document_parser if ocr/extractor.py not yet present
try:
    from ocr.extractor import extract_text_from_bytes as ocr_extract
    _HAS_OCR = True
    print("✅ OCR engine loaded")
except ImportError:
    _HAS_OCR = False
    print("⚠️  ocr/extractor.py not found — file uploads use document_parser only")


# ══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def _extract_upload(filename: str, content_type: str, content: bytes) -> str:
    """
    Unified extraction: tries ocr.extractor first (pdfplumber + Tesseract),
    falls back to services.document_parser (existing logic).
    """
    text = ""

    if _HAS_OCR:
        try:
            text = ocr_extract(
                data      = content,
                filename  = filename,
                mime_type = content_type or "",
            )
        except Exception as e:
            print(f"⚠️  ocr_extract failed ({e}) — trying document_parser")

    if not text or len(text.strip()) < 30:
        try:
            text = extract_text_from_file(
                filename     = filename,
                content_type = content_type,
                content      = content,
            )
        except Exception as e:
            print(f"⚠️  document_parser failed ({e})")

    return text.strip()


def _lang_from_request(obj) -> str:
    """Safely extract lang from a request object, default 'en'."""
    return getattr(obj, "lang", None) or "en"


# ══════════════════════════════════════════════════════════════════════════════
# ENGINE REGISTRY
# ══════════════════════════════════════════════════════════════════════════════

_engines: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🔄 CareBridge AI starting up...")

    loader = ModelLoader()
    model, tokenizer = loader.get_model()

    _engines["post_rejection"] = PostRejectionEngine(model, tokenizer)
    _engines["pre_purchase"]   = PrePurchaseEngine(model, tokenizer)
    _engines["comparison"]     = PolicyComparisonEngine(model, tokenizer)
    _engines["model"]          = model
    _engines["tokenizer"]      = tokenizer

    print("✅ All engines ready")
    yield
    print("🔄 CareBridge AI shutting down...")


# ══════════════════════════════════════════════════════════════════════════════
# APP
# ══════════════════════════════════════════════════════════════════════════════

app = FastAPI(
    title="CareBridge AI",
    version="2.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/")
def health():
    return {
        "status":  "CareBridge AI v2.1 running",
        "ocr":     _HAS_OCR,
        "engines": list(_engines.keys()),
    }


# ══════════════════════════════════════════════════════════════════════════════
# PRE-PURCHASE — text
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/prepurchase")
def prepurchase(request: PrePurchaseRequest):
    try:
        result = _engines["pre_purchase"].run(request.policy_text)
        return result.model_dump()
    except Exception as e:
        print("⚠️ /prepurchase error:", e)
        raise HTTPException(500, "Pre-purchase engine error. Please try again.")


# ── Pre-purchase — file upload ────────────────────────────────────────────────

@app.post("/prepurchase/upload")
async def prepurchase_upload(file: UploadFile = File(...)):
    try:
        content = await file.read()

        extracted_text = _extract_upload(
            filename     = file.filename or "",
            content_type = file.content_type or "",
            content      = content,
        )

        print(f"📄 OCR extracted {len(extracted_text)} chars from '{file.filename}'")

        if len(extracted_text) < 80:
            raise HTTPException(
                status_code=422,
                detail=(
                    "Could not extract sufficient text from the document. "
                    "Upload a clearer scan or paste the policy text directly."
                ),
            )

        result = _engines["pre_purchase"].run(extracted_text)
        return result.model_dump()

    except HTTPException:
        raise
    except Exception as e:
        print("⚠️ /prepurchase/upload error:", e)
        raise HTTPException(500, "File processing failed.")


# ══════════════════════════════════════════════════════════════════════════════
# POST-REJECTION AUDIT — text
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/audit")
def audit(request: PostRejectionRequest):
    try:
        result = _engines["post_rejection"].run(request)
        return result.model_dump()
    except Exception as e:
        print("⚠️ /audit error:", e)
        raise HTTPException(500, "Audit engine error. Please try again.")


# ── Audit — file upload ───────────────────────────────────────────────────────
# Accepts policy doc + rejection letter as separate uploads.
# Both are extracted and concatenated with a clear separator.

@app.post("/audit/upload")
async def audit_upload(
    policy_file:    UploadFile = File(...),
    rejection_file: UploadFile = File(...),
    medical_file:   UploadFile | None = File(None),
):
    try:
        # Extract policy document
        policy_bytes = await policy_file.read()
        policy_text  = _extract_upload(
            filename     = policy_file.filename or "",
            content_type = policy_file.content_type or "",
            content      = policy_bytes,
        )
        print(f"📄 Policy OCR: {len(policy_text)} chars")

        # Extract rejection letter
        rejection_bytes = await rejection_file.read()
        rejection_text  = _extract_upload(
            filename     = rejection_file.filename or "",
            content_type = rejection_file.content_type or "",
            content      = rejection_bytes,
        )
        print(f"📄 Rejection OCR: {len(rejection_text)} chars")

        # Extract optional medical records
        medical_text = ""
        if medical_file:
            medical_bytes = await medical_file.read()
            medical_text  = _extract_upload(
                filename     = medical_file.filename or "",
                content_type = medical_file.content_type or "",
                content      = medical_bytes,
            )
            print(f"📄 Medical OCR: {len(medical_text)} chars")

        # Validate minimum content
        if len(policy_text) < 80:
            raise HTTPException(422, "Could not extract policy text. Upload a clearer document.")
        if len(rejection_text) < 40:
            raise HTTPException(422, "Could not extract rejection letter text.")

        # Build a PostRejectionRequest-compatible object
        audit_request = PostRejectionRequest(
            policy_text            = policy_text,
            rejection_text         = rejection_text,
            medical_documents_text = medical_text or None,
            user_explanation       = None,
        )

        result = _engines["post_rejection"].run(audit_request)
        return result.model_dump()

    except HTTPException:
        raise
    except Exception as e:
        print("⚠️ /audit/upload error:", e)
        raise HTTPException(500, "Audit file processing failed.")


# ══════════════════════════════════════════════════════════════════════════════
# REPORT CHAT — one-shot (no session)
# ══════════════════════════════════════════════════════════════════════════════

class ReportChatRequest(BaseModel):
    report_data: dict
    question:    str
    lang:        str = "en"   # ← multilingual support


@app.post("/report-chat", response_model=ReportChatResponse)
def report_chat(request: ReportChatRequest):
    try:
        result = run_report_chat(
            model         = _engines["model"],
            tokenizer     = _engines["tokenizer"],
            report_data   = request.report_data,
            user_question = request.question,
            lang          = request.lang,
        )
        return result.model_dump()
    except Exception as e:
        print("⚠️ /report-chat error:", e)
        raise HTTPException(500, "Chat service error.")


# ══════════════════════════════════════════════════════════════════════════════
# CHAT SESSION — persistent multi-turn
# ══════════════════════════════════════════════════════════════════════════════

class CreateChatSessionRequest(BaseModel):
    report_data: dict


class ContinueChatRequest(BaseModel):
    session_id: str
    question:   str
    lang:       str = "en"   # ← multilingual support


@app.post("/chat-session")
def create_chat_session(request: CreateChatSessionRequest):
    try:
        session_id = create_session(request.report_data)
        return {"session_id": session_id}
    except Exception as e:
        print("⚠️ /chat-session error:", e)
        raise HTTPException(500, "Failed to create chat session.")


@app.post("/chat")
def continue_chat(request: ContinueChatRequest):
    try:
        result = run_report_chat(
            model         = _engines["model"],
            tokenizer     = _engines["tokenizer"],
            session_id    = request.session_id,
            user_question = request.question,
            lang          = request.lang,
        )
        return result.model_dump()
    except Exception as e:
        print("⚠️ /chat error:", e)
        raise HTTPException(500, "Chat service error.")


# ══════════════════════════════════════════════════════════════════════════════
# POLICY COMPARISON
# ══════════════════════════════════════════════════════════════════════════════

class PolicyComparisonRequest(BaseModel):
    policy_a_text: str
    policy_b_text: str


@app.post("/compare", response_model=PolicyComparisonReport)
def compare_policies(request: PolicyComparisonRequest):
    try:
        result = _engines["comparison"].compare(
            policy_a_text = request.policy_a_text,
            policy_b_text = request.policy_b_text,
        )
        return result.model_dump()
    except Exception as e:
        print("⚠️ /compare error:", e)
        raise HTTPException(500, "Comparison engine error.")


# ── Comparison — file upload ──────────────────────────────────────────────────

@app.post("/compare/upload")
async def compare_upload(
    policy_a_file: UploadFile = File(...),
    policy_b_file: UploadFile = File(...),
):
    try:
        a_bytes = await policy_a_file.read()
        b_bytes = await policy_b_file.read()

        policy_a_text = _extract_upload(
            policy_a_file.filename or "", policy_a_file.content_type or "", a_bytes
        )
        policy_b_text = _extract_upload(
            policy_b_file.filename or "", policy_b_file.content_type or "", b_bytes
        )

        print(f"📄 Compare A: {len(policy_a_text)} chars | B: {len(policy_b_text)} chars")

        if len(policy_a_text) < 80 or len(policy_b_text) < 80:
            raise HTTPException(422, "Could not extract sufficient text from one or both files.")

        result = _engines["comparison"].compare(
            policy_a_text = policy_a_text,
            policy_b_text = policy_b_text,
        )
        return result.model_dump()

    except HTTPException:
        raise
    except Exception as e:
        print("⚠️ /compare/upload error:", e)
        raise HTTPException(500, "Comparison file processing failed.")