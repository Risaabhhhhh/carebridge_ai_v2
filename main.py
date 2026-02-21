# main.py

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
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

from fastapi import File, UploadFile
import pdfplumber
import pytesseract
from PIL import Image
import io


# --------------------------------------------------
# Engine registry — populated at startup
# --------------------------------------------------
_engines: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model and engines once at startup, clean up on shutdown."""
    print("🔄 CareBridge AI starting up...")

    loader = ModelLoader()          # singleton — safe to call
    model, tokenizer = loader.get_model()

    _engines["post_rejection"]  = PostRejectionEngine(model, tokenizer)
    _engines["pre_purchase"]    = PrePurchaseEngine(model, tokenizer)
    _engines["comparison"]      = PolicyComparisonEngine(model, tokenizer)
    _engines["model"]           = model
    _engines["tokenizer"]       = tokenizer

    print("✅ All engines ready")
    yield
    print("🔄 CareBridge AI shutting down...")


# --------------------------------------------------
# CORS — env-driven for prod safety
# --------------------------------------------------
_RAW_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
ALLOWED_ORIGINS = [o.strip() for o in _RAW_ORIGINS.split(",")]


# --------------------------------------------------
# App
# --------------------------------------------------
app = FastAPI(
    title="CareBridge AI",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# Health Check
# --------------------------------------------------

@app.get("/")
def health():
    return {"status": "CareBridge AI v2 running", "engines": list(_engines.keys())}


# --------------------------------------------------
# Post-Rejection Audit
# --------------------------------------------------

@app.post("/audit")
def audit(request: PostRejectionRequest):
    try:
        result = _engines["post_rejection"].run(request)
        return result.model_dump()
    except Exception as e:
        print("⚠️ /audit error:", e)
        raise HTTPException(status_code=500, detail="Audit engine error. Please try again.")


# --------------------------------------------------
# Pre-Purchase Analysis
# --------------------------------------------------

@app.post("/prepurchase")
def prepurchase(request: PrePurchaseRequest):
    try:
        result = _engines["pre_purchase"].run(request.policy_text)
        return result.model_dump()
    except Exception as e:
        print("⚠️ /prepurchase error:", e)
        raise HTTPException(status_code=500, detail="Pre-purchase engine error. Please try again.")


# --------------------------------------------------
# Report Chat — one-shot (no session)
# --------------------------------------------------

class ReportChatRequest(BaseModel):
    report_data: dict
    question:    str


@app.post("/report-chat", response_model=ReportChatResponse)
def report_chat(request: ReportChatRequest):
    try:
        result = run_report_chat(
            model=_engines["model"],
            tokenizer=_engines["tokenizer"],
            report_data=request.report_data,
            user_question=request.question,
        )
        return result.model_dump()
    except Exception as e:
        print("⚠️ /report-chat error:", e)
        raise HTTPException(status_code=500, detail="Chat service error. Please try again.")

# Add these to main.py
# Requires: pip install pdfplumber python-multipart pillow pytesseract

@app.post("/prepurchase/upload")
async def prepurchase_upload(file: UploadFile = File(...)):
    """
    Accept PDF or image, extract text, run pre-purchase analysis.
    """
    try:
        content = await file.read()
        extracted_text = ""

        if file.content_type == "application/pdf" or file.filename.endswith(".pdf"):
            # PDF text extraction
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        extracted_text += page_text + "\n"

        elif file.content_type.startswith("image/"):
            # OCR for images
            image = Image.open(io.BytesIO(content))
            extracted_text = pytesseract.image_to_string(image)

        else:
            # Plain text fallback
            extracted_text = content.decode("utf-8", errors="ignore")

        if not extracted_text or len(extracted_text.strip()) < 100:
            raise HTTPException(
                status_code=422,
                detail="Could not extract sufficient text from the uploaded file. Try pasting the policy text directly."
            )

        result = _engines["pre_purchase"].run(extracted_text)
        return result.model_dump()

    except HTTPException:
        raise
    except Exception as e:
        print("⚠️ /prepurchase/upload error:", e)
        raise HTTPException(status_code=500, detail="File processing failed.")

# --------------------------------------------------
# Chat Session — multi-turn with memory
# --------------------------------------------------

class CreateChatSessionRequest(BaseModel):
    report_data: dict


class ContinueChatRequest(BaseModel):
    session_id: str
    question:   str


@app.post("/chat-session")
def create_chat_session(request: CreateChatSessionRequest):
    try:
        session_id = create_session(request.report_data)
        return {"session_id": session_id}
    except Exception as e:
        print("⚠️ /chat-session error:", e)
        raise HTTPException(status_code=500, detail="Failed to create chat session.")


@app.post("/chat")
def continue_chat(request: ContinueChatRequest):
    try:
        result = run_report_chat(
            model=_engines["model"],
            tokenizer=_engines["tokenizer"],
            session_id=request.session_id,      # session path — no report_data needed
            user_question=request.question,
        )
        return result.model_dump()
    except Exception as e:
        print("⚠️ /chat error:", e)
        raise HTTPException(status_code=500, detail="Chat service error. Please try again.")


# --------------------------------------------------
# Policy Comparison
# --------------------------------------------------

class PolicyComparisonRequest(BaseModel):
    policy_a_text: str
    policy_b_text: str


@app.post("/compare", response_model=PolicyComparisonReport)
def compare_policies(request: PolicyComparisonRequest):
    try:
        result = _engines["comparison"].compare(
            policy_a_text=request.policy_a_text,
            policy_b_text=request.policy_b_text,
        )
        return result.model_dump()
    except Exception as e:
        print("⚠️ /compare error:", e)
        raise HTTPException(status_code=500, detail="Comparison engine error. Please try again.")