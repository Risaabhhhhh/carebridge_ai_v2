from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from llm.model_loader import ModelLoader
from engines.post_rejection_engine import PostRejectionEngine
from engines.pre_purchase_engine import PrePurchaseEngine
from engines.policy_comparison_engine import PolicyComparisonEngine

from schemas.request import PostRejectionRequest
from schemas.chat import ReportChatResponse
from schemas.policy_comparison import PolicyComparisonReport

from services.report_chat_service import run_report_chat
from services.chat_memory import create_session


# --------------------------------------
# FastAPI App Init
# --------------------------------------

app = FastAPI(title="CareBridge AI – CareBridge Backend v2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------
# Load Model Once
# --------------------------------------

model_loader = ModelLoader()
model, tokenizer = model_loader.get_model()

engine = PostRejectionEngine(model, tokenizer)
prepurchase_engine = PrePurchaseEngine(model, tokenizer)
comparison_engine = PolicyComparisonEngine(model, tokenizer)

# --------------------------------------
# Health Check
# --------------------------------------

@app.get("/")
def health():
    return {"status": "CareBridge AI v2 running"}

# --------------------------------------
# Post-Rejection Audit
# --------------------------------------

@app.post("/audit")
def audit(request: PostRejectionRequest):
    result = engine.run(request)
    return result.model_dump()

# --------------------------------------
# Pre-Purchase Endpoint
# --------------------------------------

class PrePurchaseRequest(BaseModel):
    policy_text: str


@app.post("/prepurchase")
def prepurchase(request: PrePurchaseRequest):
    result = prepurchase_engine.run(request.policy_text)
    return result.model_dump()

# --------------------------------------
# Report Chat (one-shot)
# --------------------------------------

class ReportChatRequest(BaseModel):
    report_data: dict
    question: str


@app.post("/report-chat", response_model=ReportChatResponse)
def report_chat(request: ReportChatRequest):
    result = run_report_chat(
        model=model,
        tokenizer=tokenizer,
        report_data=request.report_data,
        user_question=request.question
    )
    return result.model_dump()

# --------------------------------------
# Chat Session
# --------------------------------------

class CreateChatSessionRequest(BaseModel):
    report_data: dict


class ContinueChatRequest(BaseModel):
    session_id: str
    question: str


@app.post("/chat-session")
def create_chat_session(request: CreateChatSessionRequest):
    session_id = create_session(request.report_data)
    return {"session_id": session_id}


@app.post("/chat")
def continue_chat(request: ContinueChatRequest):
    result = run_report_chat(
        model=model,
        tokenizer=tokenizer,
        session_id=request.session_id,
        user_question=request.question
    )
    return result.model_dump()

# --------------------------------------
# Policy Comparison
# --------------------------------------

class PolicyComparisonRequest(BaseModel):
    policy_a_text: str
    policy_b_text: str


@app.post("/compare", response_model=PolicyComparisonReport)
def compare_policies(request: PolicyComparisonRequest):
    result = comparison_engine.compare(
        policy_a_text=request.policy_a_text,
        policy_b_text=request.policy_b_text
    )
    return result.model_dump()
