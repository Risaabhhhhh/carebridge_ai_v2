// src/app/api/learn/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${BACKEND}/learn`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        question: body.question,
        lang:     body.lang ?? "en",
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ answer: "", sources: [] }, { status: 200 });
    }

    const data = await res.json();
    return NextResponse.json({
      answer:  data.answer  ?? "",
      sources: data.sources ?? [],
    });

  } catch {
    return NextResponse.json({ answer: "", sources: [] }, { status: 200 });
  }
}