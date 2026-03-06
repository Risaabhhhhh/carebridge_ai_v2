"use client";

// ── Web Speech API type declarations ─────────────────────────────────────────
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}
interface SpeechRecognition extends EventTarget {
  lang:            string;
  continuous:      boolean;
  interimResults:  boolean;
  maxAlternatives: number;
  start():  void;
  stop():   void;
  abort():  void;
  onstart:  ((e: Event) => void) | null;
  onend:    ((e: Event) => void) | null;
  onerror:  ((e: Event) => void) | null;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
}
declare var SpeechRecognition: {
  new(): SpeechRecognition;
  prototype: SpeechRecognition;
};
// ── End Speech API declarations ───────────────────────────────────────────────

import { useState, useRef, useEffect, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
type Lang = "en" | "hi" | "mr" | "ta";
type ReportType = "prepurchase" | "audit";

interface Message {
  id:       string;
  role:     "user" | "assistant";
  content:  string;
  sources?: string[];
}

interface Props {
  reportData:  any;
  sessionId?:  string;
  reportType?: ReportType;
  className?:  string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const SPEECH_LANG: Record<Lang, string> = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
  ta: "ta-IN",
};

const LANG_LABELS: Record<Lang, string> = {
  en: "English",
  hi: "हिन्दी",
  mr: "मराठी",
  ta: "தமிழ்",
};

const UI: Record<string, Record<Lang, string>> = {
  title: {
    en: "Ask About This Report",
    hi: "इस रिपोर्ट के बारे में पूछें",
    mr: "या रिपोर्टबद्दल विचारा",
    ta: "இந்த அறிக்கையைப் பற்றி கேளுங்கள்",
  },
  placeholder: {
    en: "Ask about your report…",
    hi: "अपनी रिपोर्ट के बारे में पूछें…",
    mr: "तुमच्या रिपोर्टबद्दल विचारा…",
    ta: "உங்கள் அறிக்கையைப் பற்றி கேளுங்கள்…",
  },
  listening: {
    en: "Listening…",
    hi: "सुन रहा है…",
    mr: "ऐकत आहे…",
    ta: "கேட்கிறேன்…",
  },
  thinking: {
    en: "Thinking…",
    hi: "सोच रहा है…",
    mr: "विचार करत आहे…",
    ta: "யோசிக்கிறேன்…",
  },
  send: {
    en: "Send", hi: "भेजें", mr: "पाठवा", ta: "அனுப்பு",
  },
  sources: {
    en: "Regulatory sources",
    hi: "नियामक स्रोत",
    mr: "नियामक स्रोत",
    ta: "ஒழுங்குமுறை ஆதாரங்கள்",
  },
  greeting_prepurchase: {
    en: "Ask me anything about this policy analysis — clauses, score, waiting periods, or whether to buy.",
    hi: "इस पॉलिसी विश्लेषण के बारे में कुछ भी पूछें — खंड, स्कोर, प्रतीक्षा अवधि, या खरीदना चाहिए या नहीं।",
    mr: "या पॉलिसी विश्लेषणाबद्दल काहीही विचारा — खंड, स्कोअर, प्रतीक्षा कालावधी, किंवा खरेदी करावी का.",
    ta: "இந்த பாலிசி பகுப்பாய்வைப் பற்றி எதையும் கேளுங்கள் — விதிகள், மதிப்பெண், காத்திருப்பு காலம் அல்லது வாங்க வேண்டுமா.",
  },
  greeting_audit: {
    en: "Ask me about your claim rejection — appeal strength, next steps, evidence to gather, or your IRDAI rights.",
    hi: "अपने क्लेम rejection के बारे में पूछें — अपील की ताकत, अगले कदम, दस्तावेज़, या IRDAI अधिकार।",
    mr: "तुमच्या दावा नाकारण्याबद्दल विचारा — अपीलची ताकद, पुढील पावले, पुरावे, किंवा IRDAI हक्क.",
    ta: "உங்கள் கோரிக்கை நிராகரிப்பைப் பற்றி கேளுங்கள் — மேல்முறையீட்டு வலிமை, அடுத்த படிகள், IRDAI உரிமைகள்.",
  },
  speak: {
    en: "Read aloud", hi: "पढ़कर सुनाएं", mr: "वाचून सांगा", ta: "சத்தமாக படி",
  },
  stop_speak: {
    en: "Stop", hi: "रोकें", mr: "थांबा", ta: "நிறுத்து",
  },
};

const u = (key: string, lang: Lang): string =>
  UI[key]?.[lang] ?? UI[key]?.["en"] ?? key;

// ── Component ─────────────────────────────────────────────────────────────────
export default function ReportVoiceChat({
  reportData,
  sessionId,
  reportType = "prepurchase",
  className = "",
}: Props) {
  const [lang, setLang]               = useState<Lang>("en");
  const [messages, setMessages]       = useState<Message[]>([]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [listening, setListening]     = useState(false);
  const [voiceEnabled, setVoice]      = useState(true);
  const [transcript, setTranscript]   = useState("");
  const [currentSession, setSession]  = useState<string | undefined>(sessionId);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isSpeaking, setIsSpeaking]   = useState(false);
  const [speakingId, setSpeakingId]   = useState<string | null>(null);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const recognizer = useRef<SpeechRecognition | null>(null);

  // ── Initialize greeting ────────────────────────────────────────────────────
  useEffect(() => {
    const greetKey = reportType === "audit" ? "greeting_audit" : "greeting_prepurchase";
    setMessages([{
      id:      "greeting",
      role:    "assistant",
      content: u(greetKey, lang),
    }]);
  }, [lang, reportType]);

  // ── Scroll to bottom ───────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Check Speech API support ───────────────────────────────────────────────
  useEffect(() => {
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SR);
  }, []);

  // ── Stop speaking when lang changes ───────────────────────────────────────
  useEffect(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setSpeakingId(null);
  }, [lang]);

  // ── Voice output ───────────────────────────────────────────────────────────
  const speak = useCallback((text: string, l: Lang, msgId?: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const cleaned = text
      .replace(/[*_`#]/g, "")
      .replace(/\n+/g, ". ")
      .replace(/•/g, "")
      .trim();

    const utt  = new SpeechSynthesisUtterance(cleaned);
    utt.lang   = SPEECH_LANG[l];
    utt.rate   = 0.9;
    utt.pitch  = 1.0;

    // Try to find a matching voice
    const voices = window.speechSynthesis.getVoices();
    const langPrefix = SPEECH_LANG[l].split("-")[0];
    const match = voices.find(v => v.lang.startsWith(langPrefix))
                ?? voices.find(v => v.lang.startsWith("en"));
    if (match) utt.voice = match;

    utt.onstart = () => { setIsSpeaking(true); if (msgId) setSpeakingId(msgId); };
    utt.onend   = () => { setIsSpeaking(false); setSpeakingId(null); };
    utt.onerror = () => { setIsSpeaking(false); setSpeakingId(null); };

    window.speechSynthesis.speak(utt);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setSpeakingId(null);
  }, []);

  // ── Send question ──────────────────────────────────────────────────────────
  const send = useCallback(async (text: string) => {
    const question = text.trim();
    if (!question || loading) return;

    const userMsg: Message = {
      id:      `u-${Date.now()}`,
      role:    "user",
      content: question,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    stopSpeaking();

    try {
      const body: Record<string, unknown> = {
        question,
        lang,           // ← always send lang to backend
        ...(currentSession
          ? { session_id: currentSession }
          : { report_data: reportData }),
      };

      const res = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const answer:  string   = data.answer  ?? "";
      const sources: string[] = data.sources ?? [];

      if (data.session_id && !currentSession) {
        setSession(data.session_id);
      }

      const aId = `a-${Date.now()}`;
      const assistantMsg: Message = {
        id:      aId,
        role:    "assistant",
        content: answer,
        sources,
      };
      setMessages(prev => [...prev, assistantMsg]);

      // Auto-speak if voice enabled
      if (voiceEnabled && answer) {
        // Small delay so voices list is ready
        setTimeout(() => speak(answer, lang, aId), 150);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, {
        id:      `err-${Date.now()}`,
        role:    "assistant",
        content: "Something went wrong. Please try again.",
      }]);
    } finally {
      setLoading(false);
    }
  }, [loading, lang, currentSession, reportData, voiceEnabled, speak, stopSpeaking]);

  // ── Voice input ────────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) return;

    if (recognizer.current) {
      recognizer.current.stop();
      recognizer.current = null;
    }

    stopSpeaking();

    const r = new SR() as SpeechRecognition;
    r.lang            = SPEECH_LANG[lang];
    r.continuous      = false;
    r.interimResults  = true;
    r.maxAlternatives = 1;

    r.onstart  = () => { setListening(true); setTranscript(""); };
    r.onend    = () => { setListening(false); setTranscript(""); };
    r.onerror  = () => { setListening(false); setTranscript(""); };

    r.onresult = (e: SpeechRecognitionEvent) => {
      const result = e.results[e.resultIndex];
      const text   = result[0].transcript;
      setTranscript(text);
      if (result.isFinal && text.trim()) {
        setInput(text.trim());
        send(text.trim());
      }
    };

    recognizer.current = r;
    r.start();
  }, [lang, send, stopSpeaking]);

  const stopListening = useCallback(() => {
    recognizer.current?.stop();
    setListening(false);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className={`flex flex-col ${className}`}
      style={{
        background:   "#F5F0E8",
        border:       "1px solid #D4C9A8",
        borderRadius: "12px",
        fontFamily:   "'Space Mono', monospace",
        overflow:     "hidden",
        height:       "100%",
        minHeight:    "480px",
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{
        background:     "#2D5A27",
        padding:        "14px 18px",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        gap:            "10px",
      }}>
        <span style={{
          color: "#F5F0E8", fontFamily: "'EB Garamond', serif",
          fontSize: "17px", fontWeight: 600,
        }}>
          {u("title", lang)}
        </span>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {/* Language selector */}
          <select
            value={lang}
            onChange={e => setLang(e.target.value as Lang)}
            style={{
              background: "#1A3A16", color: "#C8A96E",
              border: "1px solid #C8A96E", borderRadius: "6px",
              padding: "4px 8px", fontSize: "12px",
              fontFamily: "'Space Mono', monospace", cursor: "pointer",
            }}
          >
            {(Object.entries(LANG_LABELS) as [Lang, string][]).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>

          {/* TTS toggle */}
          <button
            onClick={() => { setVoice(v => !v); if (voiceEnabled) stopSpeaking(); }}
            title={voiceEnabled ? "Disable auto-read" : "Enable auto-read"}
            style={{
              background:   voiceEnabled ? "#C8A96E22" : "transparent",
              border:       `1px solid ${voiceEnabled ? "#C8A96E" : "#6B8C5A"}`,
              borderRadius: "6px",
              color:        voiceEnabled ? "#C8A96E" : "#8BA87A",
              padding:      "4px 8px", fontSize: "12px", cursor: "pointer",
            }}
          >
            {voiceEnabled ? "🔊" : "🔇"}
          </button>
        </div>
      </div>

      {/* ── Messages ──────────────────────────────────────────────────────── */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "16px",
        display: "flex", flexDirection: "column", gap: "12px",
      }}>
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            lang={lang}
            isSpeaking={speakingId === msg.id}
            onSpeak={() => {
              if (speakingId === msg.id) {
                stopSpeaking();
              } else {
                speak(msg.content, lang, msg.id);
              }
            }}
          />
        ))}

        {/* Loading indicator */}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              background: "#2D5A2722", border: "1px solid #2D5A2744",
              borderRadius: "10px 10px 10px 2px", padding: "10px 14px",
              color: "#2D5A27", fontSize: "13px", fontStyle: "italic",
            }}>
              <PulseDots /> {u("thinking", lang)}
            </div>
          </div>
        )}

        {/* Transcript preview */}
        {listening && transcript && (
          <div style={{
            color: "#8B7355", fontSize: "12px",
            fontStyle: "italic", padding: "0 4px",
          }}>
            ◎ {transcript}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input row ──────────────────────────────────────────────────────── */}
      <div style={{
        padding: "12px 16px", borderTop: "1px solid #D4C9A8",
        background: "#EDE8DC", display: "flex", gap: "8px", alignItems: "center",
      }}>
        {/* Mic button */}
        {speechSupported && (
          <button
            onClick={() => listening ? stopListening() : startListening()}
            title={listening ? u("listening", lang) : "Voice input"}
            style={{
              width: "40px", height: "40px", borderRadius: "50%",
              border:     `2px solid ${listening ? "#C8A96E" : "#2D5A27"}`,
              background: listening ? "#C8A96E22" : "transparent",
              color:      listening ? "#C8A96E" : "#2D5A27",
              fontSize: "18px", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              animation: listening ? "pulse 1s infinite" : "none",
            }}
          >
            {listening ? "◎" : "🎙"}
          </button>
        )}

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={listening ? u("listening", lang) : input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder={u("placeholder", lang)}
          disabled={listening || loading}
          style={{
            flex: 1, background: "#F5F0E8",
            border: "1px solid #C4BAA0", borderRadius: "8px",
            padding: "9px 12px", fontSize: "13px",
            fontFamily: "'Space Mono', monospace",
            color: "#1A2A1A", outline: "none",
          }}
        />

        {/* Send button */}
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || loading || listening}
          style={{
            background:   (!input.trim() || loading || listening) ? "#C4BAA0" : "#2D5A27",
            color:        "#F5F0E8", border: "none", borderRadius: "8px",
            padding:      "9px 14px", fontSize: "12px",
            fontFamily:   "'Space Mono', monospace",
            cursor:       (!input.trim() || loading || listening) ? "not-allowed" : "pointer",
            flexShrink:   0,
          }}
        >
          {u("send", lang)}
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(1.08); }
        }
        @keyframes dotBlink {
          0%, 80%, 100% { opacity: 0; }
          40%            { opacity: 1; }
        }
        @keyframes speakPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

// ── MessageBubble ─────────────────────────────────────────────────────────────
function MessageBubble({
  msg, lang, isSpeaking, onSpeak,
}: {
  msg: Message;
  lang: Lang;
  isSpeaking: boolean;
  onSpeak: () => void;
}) {
  const isUser = msg.role === "user";

  return (
    <div style={{
      display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", gap: "8px",
    }}>
      {!isUser && (
        <div style={{
          width: "28px", height: "28px", borderRadius: "50%",
          background: "#2D5A27", color: "#F5F0E8",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "13px", flexShrink: 0, marginTop: "2px",
        }}>
          ✦
        </div>
      )}

      <div style={{ maxWidth: "82%", display: "flex", flexDirection: "column", gap: "4px" }}>
        <div style={{
          background:   isUser ? "#2D5A27" : "#FFFFFF",
          color:        isUser ? "#F5F0E8" : "#1A2A1A",
          border:       isUser ? "none" : "1px solid #D4C9A8",
          borderRadius: isUser ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
          padding:      "10px 14px", fontSize: "13px",
          lineHeight:   "1.55", whiteSpace: "pre-wrap",
        }}>
          {msg.content}
        </div>

        {/* Speak button — only on assistant messages */}
        {!isUser && (
          <button
            onClick={onSpeak}
            title={isSpeaking ? "Stop reading" : "Read aloud"}
            style={{
              alignSelf:    "flex-start",
              background:   isSpeaking ? "#2D5A2715" : "transparent",
              border:       `1px solid ${isSpeaking ? "#2D5A27" : "#C4BAA0"}`,
              borderRadius: "6px",
              color:        isSpeaking ? "#2D5A27" : "#8B7355",
              padding:      "3px 9px",
              fontSize:     "11px",
              fontFamily:   "'Space Mono', monospace",
              cursor:       "pointer",
              display:      "flex",
              alignItems:   "center",
              gap:          "5px",
              animation:    isSpeaking ? "speakPulse 1.2s infinite" : "none",
            }}
          >
            {isSpeaking ? "⏹ Stop" : "🔊 Read"}
          </button>
        )}

        {/* Regulatory sources */}
        {msg.sources && msg.sources.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", paddingLeft: "2px" }}>
            <span style={{ fontSize: "11px", color: "#8B7355", marginRight: "2px" }}>
              {UI.sources[lang]}:
            </span>
            {msg.sources.map(src => (
              <span key={src} style={{
                background: "#2D5A2715", border: "1px solid #2D5A2730",
                borderRadius: "4px", padding: "1px 6px",
                fontSize: "10px", color: "#2D5A27",
                fontFamily: "'Space Mono', monospace",
              }}>
                {src}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PulseDots() {
  return (
    <span style={{ display: "inline-flex", gap: "3px", marginRight: "6px" }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: "5px", height: "5px", borderRadius: "50%",
          background: "#2D5A27", display: "inline-block",
          animation: `dotBlink 1.2s ${i * 0.2}s infinite`,
        }} />
      ))}
    </span>
  );
}