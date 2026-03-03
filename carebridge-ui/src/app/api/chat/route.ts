// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Route to the correct backend endpoint
    const endpoint = body.session_id ? "/chat" : "/report-chat";

    // Forward all fields including lang (multilingual support)
    const payload: Record<string, unknown> = {
      question: body.question,
      lang:     body.lang ?? "en",
    };

    if (body.session_id) {
      // Session-based: backend resolves report_data from session
      payload.session_id = body.session_id;
    } else {
      // One-shot: send full report_data
      payload.report_data = body.report_data ?? {};
    }

    const res = await fetch(`${BACKEND}${endpoint}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(`Backend ${endpoint} returned ${res.status}`);
      // Return empty — frontend local fallback takes over
      return NextResponse.json({ answer: "", sources: [] }, { status: 200 });
    }

    const data = await res.json();

    // Validate response shape before forwarding
    return NextResponse.json({
      answer:     data.answer     ?? "",
      session_id: data.session_id ?? null,
      sources:    data.sources    ?? [],
    });

  } catch (err) {
    console.error("Chat route error:", err);
    return NextResponse.json({ answer: "", sources: [] }, { status: 200 });
  }
}