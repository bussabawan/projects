import { NextRequest, NextResponse } from "next/server";
import { transcodeAudioBuffer } from "@/lib/ffmpeg";
import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get("text");
  
  if (!text) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  // Check for bitrate param
  const bitrateParam = req.nextUrl.searchParams.get("bitrate");
  const bitrate = bitrateParam ? parseInt(bitrateParam, 10) : null;
  const validBitrate = bitrate && !isNaN(bitrate) && bitrate > 0 ? bitrate : null;

  // Prepare cache path
  const hash = crypto.createHash("md5").update(`${text}_${validBitrate || 'original'}`).digest("hex");
  const cacheDir = path.join(process.cwd(), "uploads", "cache", "tts");
  const cachedFilename = `tts_${hash}.mp3`;
  const cachedFilePath = path.join(cacheDir, cachedFilename);

  try {
    // 1. Try to serve from disk cache
    const cachedBuffer = await fs.readFile(cachedFilePath);
    return new NextResponse(cachedBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    // Cache miss, proceed to fetch
  }

  // Google Translate TTS URL
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=th&client=tw-ob`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google TTS API failed with status: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let buffer: any = Buffer.from(arrayBuffer);

    if (validBitrate) {
      try {
        buffer = await transcodeAudioBuffer(buffer, validBitrate);
      } catch (err) {
        console.error("Transcoding failed:", err);
        // Fallback to original buffer if transcoding fails
      }
    }

    // Save to disk cache asynchronously
    fs.mkdir(cacheDir, { recursive: true })
      .then(() => fs.writeFile(cachedFilePath, buffer))
      .catch((err) => console.error("Failed to write TTS cache:", err));

    return new NextResponse(buffer, {
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
