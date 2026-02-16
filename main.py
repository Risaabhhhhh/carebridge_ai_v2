from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from llm.model_loader import ModelLoader
from engines.post_rejection_engine import PostRejectionEngine
from schemas.request import PostRejectionRequest
from services.report_chat_service import run_report_chat
from schemas.chat import ReportChatResponse
from services.report_chat_service import run_report_chat
from pydantic import BaseModel
from services.chat_memory import create_session

from pydantic import BaseModel


class ReportChatRequest(BaseModel):
    report_data: dict
    question: str

app = FastAPI(title="CareBridge AI – Post Rejection Engine v2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model once
model_loader = ModelLoader()
model, tokenizer = model_loader.get_model()

engine = PostRejectionEngine(model, tokenizer)


@app.get("/")
def health():
    return {"status": "CareBridge AI v2 running"}


@app.post("/audit")
def audit(request: PostRejectionRequest):
    result = engine.run(request)
    return result.model_dump()

from pydantic import BaseModel


@app.post("/report-chat", response_model=ReportChatResponse)
def report_chat(request: ReportChatRequest):

    result = run_report_chat(
        model,
        tokenizer,
        request.report_data,
        request.question
    )

    return result.model_dump()

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
        model,
        tokenizer,
        request.session_id,
        request.question
    )

    return result.model_dump()