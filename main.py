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
from services.document_parser import extract_text_from_file   # ✅ NEW CLEAN IMPORT


# --------------------------------------------------
# Engine Registry
# --------------------------------------------------

_engines: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Load model & engines at startup.
    """
    print("🔄 CareBridge AI starting up...")

    loader = ModelLoader()
    model, tokenizer = loader.get_model()

    _engines["post_rejection"] = PostRejectionEngine(model, tokenizer)
    _engines["pre_purchase"] = PrePurchaseEngine(model, tokenizer)
    _engines["comparison"] = PolicyComparisonEngine(model, tokenizer)
    _engines["model"] = model
    _engines["tokenizer"] = tokenizer

    print("✅ All engines ready")
    yield
    print("🔄 CareBridge AI shutting down...")


# --------------------------------------------------
# App Initialization
# --------------------------------------------------

app = FastAPI(
    title="CareBridge AI",
    version="2.0.0",
    lifespan=lifespan,
)

# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allows localhost & ngrok
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# Health Check
# --------------------------------------------------

@app.get("/")
def health():
    return {
        "status": "CareBridge AI v2 running",
        "engines": list(_engines.keys())
    }


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
        raise HTTPException(500, "Audit engine error. Please try again.")


# --------------------------------------------------
# Pre-Purchase Analysis (Raw Text)
# --------------------------------------------------

@app.post("/prepurchase")
def prepurchase(request: PrePurchaseRequest):
    try:
        result = _engines["pre_purchase"].run(request.policy_text)
        return result.model_dump()
    except Exception as e:
        print("⚠️ /prepurchase error:", e)
        raise HTTPException(500, "Pre-purchase engine error. Please try again.")


# --------------------------------------------------
# Pre-Purchase Analysis (File Upload)
# --------------------------------------------------

@app.post("/prepurchase/upload")
async def prepurchase_upload(file: UploadFile = File(...)):
    try:
        content = await file.read()

        # ✅ Unified document parsing layer
        extracted_text = extract_text_from_file(
            filename=file.filename,
            content_type=file.content_type,
            content=content
        )

        if not extracted_text or len(extracted_text) < 100:
            raise HTTPException(
                status_code=422,
                detail="Could not extract sufficient text from document."
            )

        print("✅ Extracted text length:", len(extracted_text))

        result = _engines["pre_purchase"].run(extracted_text)
        return result.model_dump()

    except HTTPException:
        raise
    except Exception as e:
        print("⚠️ /prepurchase/upload error:", e)
        raise HTTPException(500, "File processing failed.")


# --------------------------------------------------
# Report Chat
# --------------------------------------------------

class ReportChatRequest(BaseModel):
    report_data: dict
    question: str


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
        raise HTTPException(500, "Chat service error.")


# --------------------------------------------------
# Chat Session Management
# --------------------------------------------------

class CreateChatSessionRequest(BaseModel):
    report_data: dict


class ContinueChatRequest(BaseModel):
    session_id: str
    question: str


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
            model=_engines["model"],
            tokenizer=_engines["tokenizer"],
            session_id=request.session_id,
            user_question=request.question,
        )
        return result.model_dump()
    except Exception as e:
        print("⚠️ /chat error:", e)
        raise HTTPException(500, "Chat service error.")


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
        raise HTTPException(500, "Comparison engine error.")