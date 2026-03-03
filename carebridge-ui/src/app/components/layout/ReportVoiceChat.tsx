"use client";

// ── Web Speech API type declarations ─────────────────────────────────────────
// These are not in the standard TS DOM lib. Declared here to avoid needing
// @types/dom-speech-recognition as a dependency.

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
// ... rest of your imports

// ── Types ─────────────────────────────────────────────────────────────────────

type Lang = "en" | "hi" | "mr" | "ta";
type ReportType = "prepurchase" | "audit";

interface Message {
  id:      string;
  role:    "user" | "assistant";
  content: string;
  sources?: string[];
}

interface Props {
  reportData: any;
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
    en: "Ask me about your claim rejection — appeal strength, next steps, what evidence to gather, or your IRDAI rights.",
    hi: "अपने क्लेम rejection के बारे में पूछें — अपील की ताकत, अगले कदम, कौन से दस्तावेज़ चाहिए, या IRDAI अधिकार।",
    mr: "तुमच्या दावा नाकारण्याबद्दल विचारा — अपीलची ताकद, पुढील पावले, कोणते पुरावे गोळा करायचे, किंवा IRDAI हक्क.",
    ta: "உங்கள் கோரிக்கை நிராகரிப்பைப் பற்றி கேளுங்கள் — மேல்முறையீட்டு வலிமை, அடுத்த படிகள், என்ன சாட்சியங்கள் சேகரிக்க வேண்டும், அல்லது IRDAI உரிமைகள்.",
  },
  mic_off: {
    en: "Voice off", hi: "आवाज़ बंद", mr: "आवाज बंद", ta: "குரல் ஆஃப்",
  },
  mic_on: {
    en: "Voice on",  hi: "आवाज़ चालू", mr: "आवाज चालू", ta: "குரல் ஆன்",
  },
  no_support: {
    en: "Voice input not supported in this browser.",
    hi: "इस ब्राउज़र में voice input समर्थित नहीं है।",
    mr: "या ब्राउझरमध्ये voice input समर्थित नाही.",
    ta: "இந்த உலாவியில் குரல் உள்ளீடு ஆதரிக்கப்படவில்லை.",
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
  const [lang, setLang]             = useState<Lang>("en");
  const [messages, setMessages]     = useState<Message[]>([]);
  const [input, setInput]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [listening, setListening]   = useState(false);
  const [voiceEnabled, setVoice]    = useState(true);
  const [transcript, setTranscript] = useState("");
  const [currentSession, setSession]= useState<string | undefined>(sessionId);
  const [speechSupported, setSpeechSupported] = useState(true);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const recognizer = useRef<SpeechRecognition | null>(null);
  const synth      = useRef<SpeechSynthesis | null>(null);

  // Initialise greeting message on mount / lang change
  useEffect(() => {
    const greetKey = reportType === "audit" ? "greeting_audit" : "greeting_prepurchase";
    setMessages([{
      id:      "greeting",
      role:    "assistant",
      content: u(greetKey, lang),
    }]);
  }, [lang, reportType]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Check Speech API support
  useEffect(() => {
     const SR: typeof SpeechRecognition | undefined =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
      if (!SR) return;
      const r: SpeechRecognition = new SR();
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

    try {
      const body: Record<string, unknown> = {
        question,
        lang,
        ...(currentSession
          ? { session_id: currentSession }
          : { report_data: reportData }),
      };

      const res  = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const answer: string   = data.answer ?? "";
      const sources: string[] = data.sources ?? [];

      if (data.session_id && !currentSession) {
        setSession(data.session_id);
      }

      const assistantMsg: Message = {
        id:      `a-${Date.now()}`,
        role:    "assistant",
        content: answer,
        sources,
      };
      setMessages(prev => [...prev, assistantMsg]);

      if (voiceEnabled && answer) {
        speak(answer, lang);
      }
    } catch (err) {
      console.error("Chat error:", err);
      const errMsg: Message = {
        id:      `err-${Date.now()}`,
        role:    "assistant",
        content: "Something went wrong. Please try again.",
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }, [loading, lang, currentSession, reportData, voiceEnabled]);

  // ── Voice input ────────────────────────────────────────────────────────────

  const startListening = useCallback(() => {
    if (!speechSupported) return;
    const SR = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    // Stop existing recognizer
    if (recognizer.current) {
      recognizer.current.stop();
      recognizer.current = null;
    }

    const r = new SR();
    r.lang              = SPEECH_LANG[lang];
    r.continuous        = false;
    r.interimResults    = true;
    r.maxAlternatives   = 1;

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
  }, [speechSupported, lang, send]);

  const stopListening = useCallback(() => {
    recognizer.current?.stop();
    setListening(false);
  }, []);

  // ── Voice output ───────────────────────────────────────────────────────────

  const speak = useCallback((text: string, l: Lang) => {
    if (!synth.current) return;
    synth.current.cancel();

    // Strip markdown-like characters for cleaner TTS
    const cleaned = text.replace(/[*_`#]/g, "").replace(/\n+/g, ". ").trim();
    const utt     = new SpeechSynthesisUtterance(cleaned);
    utt.lang      = SPEECH_LANG[l];
    utt.rate      = 0.92;
    utt.pitch     = 1.0;

    // Try to find a matching voice for the language
    const voices = synth.current.getVoices();
    const match  = voices.find(v => v.lang.startsWith(SPEECH_LANG[l].split("-")[0]));
    if (match) utt.voice = match;

    synth.current.speak(utt);
  }, []);

  const stopSpeaking = useCallback(() => {
    synth.current?.cancel();
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className={`flex flex-col ${className}`}
      style={{
        background: "#F5F0E8",
        border:     "1px solid #D4C9A8",
        borderRadius: "12px",
        fontFamily: "'Space Mono', monospace",
        overflow:   "hidden",
        height:     "100%",
        minHeight:  "480px",
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: "#2D5A27",
          padding:    "14px 18px",
          display:    "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
        }}
      >
        <span style={{ color: "#F5F0E8", fontFamily: "'EB Garamond', serif", fontSize: "17px", fontWeight: 600 }}>
          {u("title", lang)}
        </span>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {/* Language selector */}
          <select
            value={lang}
            onChange={e => setLang(e.target.value as Lang)}
            style={{
              background:   "#1A3A16",
              color:        "#C8A96E",
              border:       "1px solid #C8A96E",
              borderRadius: "6px",
              padding:      "4px 8px",
              fontSize:     "12px",
              fontFamily:   "'Space Mono', monospace",
              cursor:       "pointer",
            }}
          >
            {(Object.entries(LANG_LABELS) as [Lang, string][]).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>

          {/* Voice readback toggle */}
          <button
            onClick={() => { setVoice(v => !v); if (voiceEnabled) stopSpeaking(); }}
            title={voiceEnabled ? u("mic_off", lang) : u("mic_on", lang)}
            style={{
              background:   voiceEnabled ? "#C8A96E22" : "transparent",
              border:       `1px solid ${voiceEnabled ? "#C8A96E" : "#6B8C5A"}`,
              borderRadius: "6px",
              color:        voiceEnabled ? "#C8A96E" : "#8BA87A",
              padding:      "4px 8px",
              fontSize:     "12px",
              cursor:       "pointer",
            }}
          >
            {voiceEnabled ? "🔊" : "🔇"}
          </button>
        </div>
      </div>

      {/* ── Messages ──────────────────────────────────────────────────────── */}
      <div
        style={{
          flex:     1,
          overflowY:"auto",
          padding:  "16px",
          display:  "flex",
          flexDirection: "column",
          gap:      "12px",
        }}
      >
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} lang={lang} />
        ))}

        {/* Loading indicator */}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              background: "#2D5A2722",
              border:     "1px solid #2D5A2744",
              borderRadius: "10px 10px 10px 2px",
              padding:    "10px 14px",
              color:      "#2D5A27",
              fontSize:   "13px",
              fontStyle:  "italic",
            }}>
              <PulseDots /> {u("thinking", lang)}
            </div>
          </div>
        )}

        {/* Transcript preview during recognition */}
        {listening && transcript && (
          <div style={{
            color:     "#8B7355",
            fontSize:  "12px",
            fontStyle: "italic",
            padding:   "0 4px",
          }}>
            ◎ {transcript}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input row ──────────────────────────────────────────────────────── */}
      <div
        style={{
          padding:    "12px 16px",
          borderTop:  "1px solid #D4C9A8",
          background: "#EDE8DC",
          display:    "flex",
          gap:        "8px",
          alignItems: "center",
        }}
      >
        {/* Mic button */}
        {speechSupported && (
          <button
            onMouseDown={startListening}
            onMouseUp={stopListening}
            onTouchStart={startListening}
            onTouchEnd={stopListening}
            title={listening ? u("listening", lang) : u("mic_on", lang)}
            style={{
              width:        "40px",
              height:       "40px",
              borderRadius: "50%",
              border:       `2px solid ${listening ? "#C8A96E" : "#2D5A27"}`,
              background:   listening ? "#C8A96E22" : "transparent",
              color:        listening ? "#C8A96E" : "#2D5A27",
              fontSize:     "18px",
              cursor:       "pointer",
              display:      "flex",
              alignItems:   "center",
              justifyContent: "center",
              flexShrink:   0,
              animation:    listening ? "pulse 1s infinite" : "none",
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
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }}}
          placeholder={u("placeholder", lang)}
          disabled={listening || loading}
          style={{
            flex:         1,
            background:   "#F5F0E8",
            border:       "1px solid #C4BAA0",
            borderRadius: "8px",
            padding:      "9px 12px",
            fontSize:     "13px",
            fontFamily:   "'Space Mono', monospace",
            color:        "#1A2A1A",
            outline:      "none",
          }}
        />

        {/* Send button */}
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || loading || listening}
          style={{
            background:   (!input.trim() || loading || listening) ? "#C4BAA0" : "#2D5A27",
            color:        "#F5F0E8",
            border:       "none",
            borderRadius: "8px",
            padding:      "9px 14px",
            fontSize:     "12px",
            fontFamily:   "'Space Mono', monospace",
            cursor:       (!input.trim() || loading || listening) ? "not-allowed" : "pointer",
            flexShrink:   0,
          }}
        >
          {u("send", lang)}
        </button>
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(1.08); }
        }
        @keyframes dotBlink {
          0%, 80%, 100% { opacity: 0; }
          40%            { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MessageBubble({ msg, lang }: { msg: Message; lang: Lang }) {
  const isUser = msg.role === "user";

  return (
    <div
      style={{
        display:       "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        gap:           "8px",
      }}
    >
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
        <div
          style={{
            background:   isUser ? "#2D5A27" : "#FFFFFF",
            color:        isUser ? "#F5F0E8" : "#1A2A1A",
            border:       isUser ? "none" : "1px solid #D4C9A8",
            borderRadius: isUser ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
            padding:      "10px 14px",
            fontSize:     "13px",
            lineHeight:   "1.55",
            whiteSpace:   "pre-wrap",
          }}
        >
          {msg.content}
        </div>

        {/* Regulatory sources */}
        {msg.sources && msg.sources.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", paddingLeft: "2px" }}>
            <span style={{ fontSize: "11px", color: "#8B7355", marginRight: "2px" }}>
              {UI.sources[lang]}:
            </span>
            {msg.sources.map(src => (
              <span
                key={src}
                style={{
                  background:   "#2D5A2715",
                  border:       "1px solid #2D5A2730",
                  borderRadius: "4px",
                  padding:      "1px 6px",
                  fontSize:     "10px",
                  color:        "#2D5A27",
                  fontFamily:   "'Space Mono', monospace",
                }}
              >
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
        <span
          key={i}
          style={{
            width: "5px", height: "5px", borderRadius: "50%",
            background: "#2D5A27", display: "inline-block",
            animation: `dotBlink 1.2s ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </span>
  );
}