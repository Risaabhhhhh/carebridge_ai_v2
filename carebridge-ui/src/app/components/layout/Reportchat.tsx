"use client";

import { useState, useRef, useEffect } from "react";
import API from "../../lib/api";

interface Message {
  role:    "user" | "assistant";
  content: string;
  sources?: string[];
}

interface ReportChatProps {
  reportData: Record<string, unknown>;
  context:    "prepurchase" | "audit";
}

const STARTER_QUESTIONS = {
  prepurchase: [
    "What are the biggest risks in this policy?",
    "What does the waiting period mean for me?",
    "How does the compliance score affect my decision?",
    "Should I buy this policy?",
  ],
  audit: [
    "How strong is my appeal case?",
    "What documents do I need for resubmission?",
    "When should I approach the Ombudsman?",
    "What are my next steps?",
  ],
};

export default function ReportChat({ reportData, context }: ReportChatProps) {
  const [messages,   setMessages]   = useState<Message[]>([]);
  const [sessionId,  setSessionId]  = useState<string | null>(null);
  const [input,      setInput]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [open,       setOpen]       = useState(false);
  const [initiated,  setInitiated]  = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initSession = async () => {
    if (initiated) return;
    setInitiated(true);
    try {
      const res = await API.post("/chat-session", { report_data: reportData });
      setSessionId(res.data.session_id);
    } catch {
      console.error("Failed to create chat session");
    }
  };

  const handleOpen = () => {
    setOpen(true);
    initSession();
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      let res;
      if (sessionId) {
        res = await API.post("/chat", { session_id: sessionId, question: text });
      } else {
        res = await API.post("/report-chat", { report_data: reportData, question: text });
      }
      const assistantMsg: Message = {
        role:    "assistant",
        content: res.data.answer,
        sources: res.data.sources ?? [],
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Something went wrong. Please try again.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=DM+Mono:wght@300;400&family=Outfit:wght@300;400&display=swap');

        .chat-trigger {
          display: flex; align-items: center; gap: 12px;
          background: #2d5a3d; color: white;
          border: none; border-radius: 4px;
          padding: 16px 28px; cursor: pointer;
          font-family: 'DM Mono', monospace; font-size: 11px;
          letter-spacing: 0.12em; text-transform: uppercase;
          transition: background 0.2s; width: 100%;
          justify-content: center;
        }
        .chat-trigger:hover { background: #4a7c5f; }
        .chat-trigger-icon { font-size: 16px; }

        .chat-panel {
          background: white; border: 1px solid #ddd8ce;
          border-radius: 4px; overflow: hidden;
          display: flex; flex-direction: column;
        }
        .chat-header {
          padding: 16px 24px; border-bottom: 1px solid #ddd8ce;
          display: flex; justify-content: space-between; align-items: center;
          background: #2d5a3d;
        }
        .chat-header-label {
          font-family: 'DM Mono', monospace; font-size: 10px;
          letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.7);
        }
        .chat-close {
          background: none; border: none; color: rgba(255,255,255,0.6);
          cursor: pointer; font-size: 18px; line-height: 1; padding: 0;
          transition: color 0.2s;
        }
        .chat-close:hover { color: white; }

        .chat-messages {
          flex: 1; overflow-y: auto; padding: 20px;
          display: flex; flex-direction: column; gap: 14px;
          min-height: 280px; max-height: 380px;
          background: #faf8f3;
        }

        .chat-empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; height: 100%; gap: 8px;
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px; font-weight: 300; font-style: italic;
          color: #8fa896; text-align: center;
        }
        .chat-empty-sub {
          font-family: 'DM Mono', monospace; font-size: 10px;
          letter-spacing: 0.08em; color: #c0bfba; font-style: normal;
        }

        .msg { display: flex; flex-direction: column; gap: 4px; max-width: 85%; }
        .msg.user   { align-self: flex-end; align-items: flex-end; }
        .msg.assistant { align-self: flex-start; }

        .msg-bubble {
          padding: 12px 16px; border-radius: 2px;
          font-size: 13px; line-height: 1.65;
        }
        .msg.user .msg-bubble {
          background: #2d5a3d; color: white;
          border-bottom-right-radius: 0;
        }
        .msg.assistant .msg-bubble {
          background: white; color: #0f1512;
          border: 1px solid #ddd8ce;
          border-bottom-left-radius: 0;
        }
        .msg-sources {
          display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;
        }
        .msg-source-chip {
          font-family: 'DM Mono', monospace; font-size: 9px;
          letter-spacing: 0.06em; padding: 3px 8px;
          background: #eef5f0; color: #2d6b3e; border-radius: 2px;
        }

        .typing-indicator {
          display: flex; gap: 4px; padding: 14px 16px;
          background: white; border: 1px solid #ddd8ce;
          border-radius: 2px; border-bottom-left-radius: 0;
          align-self: flex-start;
        }
        .typing-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #8fa896;
          animation: bounce 1.2s infinite;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30%            { transform: translateY(-6px); }
        }

        .starters {
          padding: 12px 20px; border-bottom: 1px solid #ddd8ce;
          display: flex; gap: 6px; flex-wrap: wrap;
          background: white;
        }
        .starter-btn {
          font-family: 'DM Mono', monospace; font-size: 9px;
          letter-spacing: 0.06em; padding: 6px 12px;
          background: #f5f2ec; color: #5a6560;
          border: 1px solid #ddd8ce; border-radius: 2px;
          cursor: pointer; transition: all 0.15s; white-space: nowrap;
        }
        .starter-btn:hover { background: #e8f0ea; color: #2d5a3d; border-color: #2d5a3d; }

        .chat-input-row {
          display: flex; border-top: 1px solid #ddd8ce;
          background: white;
        }
        .chat-input {
          flex: 1; padding: 16px 18px;
          border: none; outline: none;
          font-family: 'Outfit', sans-serif; font-size: 13px;
          color: #0f1512; background: transparent;
        }
        .chat-input::placeholder { color: #c0bfba; }
        .chat-send {
          padding: 0 20px; border: none; border-left: 1px solid #ddd8ce;
          background: none; cursor: pointer;
          font-family: 'DM Mono', monospace; font-size: 10px;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: #2d5a3d; transition: background 0.15s;
        }
        .chat-send:hover:not(:disabled) { background: #eef5f0; }
        .chat-send:disabled { color: #c0bfba; cursor: not-allowed; }
      `}</style>

      {!open ? (
        <button className="chat-trigger" onClick={handleOpen}>
          <span className="chat-trigger-icon">◈</span>
          Ask about this report
        </button>
      ) : (
        <div className="chat-panel">
          <div className="chat-header">
            <span className="chat-header-label">Report Assistant</span>
            <button className="chat-close" onClick={() => setOpen(false)}>×</button>
          </div>

          {/* Starter questions — shown until first message sent */}
          {messages.length === 0 && (
            <div className="starters">
              {STARTER_QUESTIONS[context].map((q, i) => (
                <button key={i} className="starter-btn" onClick={() => sendMessage(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-empty">
                Ask anything about your report
                <span className="chat-empty-sub">clauses · scores · next steps · regulations</span>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`msg ${msg.role}`}>
                  <div className="msg-bubble">{msg.content}</div>
                  {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                    <div className="msg-sources">
                      {msg.sources.map((s, j) => (
                        <span key={j} className="msg-source-chip">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
            {loading && (
              <div className="typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input-row">
            <input
              className="chat-input"
              placeholder="Ask about this report..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              disabled={loading}
            />
            <button
              className="chat-send"
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}