import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get("text");
  
  if (!text) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  // Google Translate TTS URL
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=th&client=tw-ob`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google TTS API failed with status: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("TTS generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate text-to-speech audio" },
      { status: 500 }
    );
  }
}
