import { getStoredCardImage } from "@/lib/share-store";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const stored = getStoredCardImage(id);

  if (!stored) {
    return NextResponse.json({ error: "Image not found or expired" }, { status: 404 });
  }

  return new NextResponse(stored.buffer.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": stored.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
