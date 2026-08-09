export interface ImageAdjustments {
  zoom: number; // 1.0 to 3.0
  panX: number; // offset in px relative to container
  panY: number; // offset in px relative to container
}

export const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  zoom: 1.0,
  panX: 0,
  panY: 0,
};

/**
 * Converts HEIC file to JPEG Blob using heic2any
 */
export async function convertHeicIfNeeded(file: File): Promise<Blob | File> {
  const fileName = file.name.toLowerCase();
  const isHeic =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    fileName.endsWith(".heic") ||
    fileName.endsWith(".heif");

  if (!isHeic) {
    return file;
  }

  try {
    const heic2any = (await import("heic2any")).default;
    const result = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.92,
    });

    if (Array.isArray(result)) {
      return result[0];
    }
    return result;
  } catch (err) {
    console.error("HEIC conversion error:", err);
    throw new Error("Could not decode HEIC image. Please try a standard JPG/PNG or take a screenshot.");
  }
}

/**
 * Loads a Blob/File into an HTMLImageElement and downscales it if longer side > maxDimension (default 2000px).
 */
export async function processAndDownscaleImage(
  blob: Blob | File,
  maxDimension = 2000
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const { width, height } = img;
      if (width <= maxDimension && height <= maxDimension) {
        resolve(img);
        return;
      }

      // Calculate new dimensions
      let newW = width;
      let newH = height;
      if (width > height) {
        newW = maxDimension;
        newH = Math.round((height * maxDimension) / width);
      } else {
        newH = maxDimension;
        newW = Math.round((width * maxDimension) / height);
      }

      // Downscale using Canvas
      const canvas = document.createElement("canvas");
      canvas.width = newW;
      canvas.height = newH;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(img);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, newW, newH);

      const downscaledImg = new Image();
      downscaledImg.onload = () => resolve(downscaledImg);
      downscaledImg.onerror = () => resolve(img); // Fallback to original
      downscaledImg.src = canvas.toDataURL("image/jpeg", 0.92);
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image file."));
    };

    img.src = url;
  });
}

/**
 * Calculates cover positioning for drawing photo inside canvas bounding box
 */
export function calculateCoverRect(
  imgW: number,
  imgH: number,
  targetW: number,
  targetH: number,
  adjustments: ImageAdjustments = DEFAULT_ADJUSTMENTS
) {
  // Base aspect cover scaling
  const imgAspect = imgW / imgH;
  const targetAspect = targetW / targetH;

  let baseWidth: number;
  let baseHeight: number;

  if (imgAspect > targetAspect) {
    // Image is wider than target: fit height, crop width
    baseHeight = targetH;
    baseWidth = targetH * imgAspect;
  } else {
    // Image is taller than target: fit width, crop height
    baseWidth = targetW;
    baseHeight = targetW / imgAspect;
  }

  // Apply user zoom
  const finalWidth = baseWidth * adjustments.zoom;
  const finalHeight = baseHeight * adjustments.zoom;

  // Center alignment plus user pan offset
  const centerX = targetW / 2;
  const centerY = targetH / 2;

  const drawX = centerX - finalWidth / 2 + adjustments.panX;
  const drawY = centerY - finalHeight / 2 + adjustments.panY;

  return {
    x: drawX,
    y: drawY,
    width: finalWidth,
    height: finalHeight,
  };
}
