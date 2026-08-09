import { put } from "@vercel/blob";

// In-memory fallback cache for local dev / environments without BLOB_READ_WRITE_TOKEN
const memoryShareStore = new Map<string, { buffer: Buffer; mimeType: string; createdAt: number }>();

export interface SaveCardResult {
  id: string;
  imageUrl: string;
}

/**
 * Saves a card image (as Buffer/ArrayBuffer) and returns a unique ID and image URL.
 */
export async function saveCardImage(
  buffer: Buffer,
  id: string,
  origin: string
): Promise<SaveCardResult> {
  const filename = `hh-goa-card-${id}.png`;

  // Try Vercel Blob if token is available
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(`cards/${filename}`, buffer, {
        access: "public",
        contentType: "image/png",
      });
      return {
        id,
        imageUrl: blob.url,
      };
    } catch (err) {
      console.warn("Vercel Blob upload failed, falling back to local memory store:", err);
    }
  }

  // Fallback: Save to memory cache
  memoryShareStore.set(id, {
    buffer,
    mimeType: "image/png",
    createdAt: Date.now(),
  });

  // Clean up old items (> 24h)
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  for (const [key, value] of memoryShareStore.entries()) {
    if (value.createdAt < dayAgo) {
      memoryShareStore.delete(key);
    }
  }

  const imageUrl = `${origin}/api/card-image/${id}`;
  return {
    id,
    imageUrl,
  };
}

/**
 * Gets a card image buffer from local memory store (if used as fallback)
 */
export function getStoredCardImage(id: string): { buffer: Buffer; mimeType: string } | null {
  const stored = memoryShareStore.get(id);
  if (!stored) return null;
  return { buffer: stored.buffer, mimeType: stored.mimeType };
}
