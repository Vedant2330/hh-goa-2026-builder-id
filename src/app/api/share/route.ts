import { saveCardImage } from "@/lib/share-store";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let buffer: Buffer;
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else if (contentType.includes("application/json")) {
      const json = await req.json();
      if (!json.image) {
        return NextResponse.json({ error: "No image data provided" }, { status: 400 });
      }
      // base64 data URL
      const base64Data = json.image.replace(/^data:image\/\w+;base64,/, "");
      buffer = Buffer.from(base64Data, "base64");
    } else {
      const arrayBuffer = await req.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    if (!buffer || buffer.length === 0) {
      return NextResponse.json({ error: "Invalid image content" }, { status: 400 });
    }

    // Generate unique ID per card generation
    const id = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    const origin = req.nextUrl.origin;

    const { imageUrl } = await saveCardImage(buffer, id, origin);
    const shareUrl = `${origin}/s/${id}`;

    return NextResponse.json({
      success: true,
      id,
      shareUrl,
      imageUrl,
    });
  } catch (err) {
    console.error("Share API error:", err);
    return NextResponse.json({ error: "Failed to process share request" }, { status: 500 });
  }
}
