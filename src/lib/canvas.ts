import { BRAND_CONFIG, generateBuilderTitle, simpleHash } from "./brand";
import { calculateCoverRect, ImageAdjustments } from "./image-utils";

export interface RenderCardOptions {
  canvas: HTMLCanvasElement;
  userImage: HTMLImageElement | null;
  name: string;
  stack: string;
  builderTitleOverride?: string;
  adjustments: ImageAdjustments;
  bgArtwork?: HTMLImageElement | null;
}

/**
 * Renders the Format B Builder ID Card onto the canvas.
 * Canvas resolution: 1200px x 1500px (4:5 vertical ID ratio).
 */
export async function renderBuilderCardCanvas({
  canvas,
  userImage,
  name,
  stack,
  builderTitleOverride,
  adjustments,
  bgArtwork,
}: RenderCardOptions): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = 1200;
  const height = 1500;

  // Set canvas dimensions
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  // Ensure browser fonts are ready
  if (typeof document !== "undefined" && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignore font loading errors
    }
  }

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // 1. BASE BACKGROUND (Deep Forest `#123A27`)
  ctx.fillStyle = BRAND_CONFIG.colors.deepForest;
  ctx.fillRect(0, 0, width, height);

  // 2. DRAW AUTHENTIC REFERENCE ARTWORK IF LOADED
  if (bgArtwork) {
    ctx.drawImage(bgArtwork, 0, 0, width, height);
  } else {
    // Fallback radial sun gradient if asset pending
    const sunGlow = ctx.createRadialGradient(width / 2, 400, 40, width / 2, 400, 500);
    sunGlow.addColorStop(0, "rgba(241, 219, 81, 0.3)");
    sunGlow.addColorStop(0.7, "rgba(47, 104, 62, 0.2)");
    sunGlow.addColorStop(1, "rgba(18, 58, 39, 0)");
    ctx.fillStyle = sunGlow;
    ctx.fillRect(0, 0, width, height);
  }

  // Subtle dark overlay to ensure high contrast for text layers
  ctx.fillStyle = "rgba(18, 58, 39, 0.25)";
  ctx.fillRect(0, 0, width, height);

  // 3. CARD OUTER BORDER FRAME
  const cardMargin = 36;
  const cardW = width - cardMargin * 2;
  const cardH = height - cardMargin * 2;
  const cardX = cardMargin;
  const cardY = cardMargin;
  const cardRadius = 36;

  // Outer Border Stroke (Sun Yellow `#F1DB51`)
  ctx.strokeStyle = BRAND_CONFIG.colors.sunYellow;
  ctx.lineWidth = 6;
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
  ctx.stroke();

  // Inner Cream Accent Border Line
  ctx.strokeStyle = "rgba(251, 247, 232, 0.35)";
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, cardX + 8, cardY + 8, cardW - 16, cardH - 16, cardRadius - 8);
  ctx.stroke();

  // 4. HEADER SECTION
  const headerY = cardY + 50;

  // Status Badge (Top Left Pill - Sun Yellow with Dark Text)
  const statusX = cardX + 50;
  const statusY = headerY;
  ctx.fillStyle = BRAND_CONFIG.colors.sunYellow;
  drawRoundedRect(ctx, statusX, statusY, 210, 36, 18);
  ctx.fill();

  // Active Green Dot
  ctx.fillStyle = BRAND_CONFIG.colors.deepForest;
  ctx.beginPath();
  ctx.arc(statusX + 18, statusY + 18, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = BRAND_CONFIG.colors.textDark;
  ctx.font = "900 13px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("OFFICIAL BUILDER PASS", statusX + 32, statusY + 22);

  // Top Right Organizer Mark
  ctx.fillStyle = BRAND_CONFIG.colors.warmCream;
  ctx.font = "bold 14px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(BRAND_CONFIG.organizer, cardX + cardW - 50, statusY + 22);

  // Event Headline: "HACKER HOUSE GOA 2026"
  const titleY = headerY + 75;
  ctx.fillStyle = BRAND_CONFIG.colors.warmCream;
  ctx.font = "900 46px system-ui, -apple-system, 'Space Grotesk', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(BRAND_CONFIG.eventName, width / 2, titleY);

  // Subtitle: "BUILDER RESIDENCY • GOA, INDIA"
  ctx.fillStyle = BRAND_CONFIG.colors.sunYellow;
  ctx.font = "bold 16px system-ui, -apple-system, sans-serif";
  ctx.fillText(`${BRAND_CONFIG.eventTag} • ${BRAND_CONFIG.location}`, width / 2, titleY + 30);

  // 5. PHOTO CONTAINER
  const photoSize = 500;
  const photoX = (width - photoSize) / 2;
  const photoY = titleY + 60;
  const photoRadius = 24;

  // Photo Outer Frame (Warm Cream & Sun Yellow)
  ctx.fillStyle = BRAND_CONFIG.colors.warmCream;
  drawRoundedRect(ctx, photoX - 8, photoY - 8, photoSize + 16, photoSize + 16, photoRadius + 6);
  ctx.fill();

  ctx.strokeStyle = BRAND_CONFIG.colors.sunYellow;
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, photoX - 12, photoY - 12, photoSize + 24, photoSize + 24, photoRadius + 8);
  ctx.stroke();

  // Draw User Photo (Masked)
  ctx.save();
  drawRoundedRect(ctx, photoX, photoY, photoSize, photoSize, photoRadius);
  ctx.clip();

  if (userImage) {
    const rect = calculateCoverRect(
      userImage.naturalWidth || userImage.width,
      userImage.naturalHeight || userImage.height,
      photoSize,
      photoSize,
      adjustments
    );
    ctx.drawImage(userImage, photoX + rect.x, photoY + rect.y, rect.width, rect.height);
  } else {
    // Retro Placeholder Photo
    ctx.fillStyle = BRAND_CONFIG.colors.deepForest;
    ctx.fillRect(photoX, photoY, photoSize, photoSize);

    ctx.fillStyle = BRAND_CONFIG.colors.palmSage;
    ctx.font = "bold 20px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("YOUR PHOTO HERE", photoX + photoSize / 2, photoY + photoSize / 2);
  }

  // Subtle Inner Edge Shadow
  const photoVignette = ctx.createLinearGradient(photoX, photoY, photoX, photoY + photoSize);
  photoVignette.addColorStop(0, "rgba(0, 0, 0, 0.15)");
  photoVignette.addColorStop(0.8, "rgba(0, 0, 0, 0)");
  photoVignette.addColorStop(1, "rgba(0, 0, 0, 0.3)");
  ctx.fillStyle = photoVignette;
  ctx.fillRect(photoX, photoY, photoSize, photoSize);

  ctx.restore(); // Restore clip context

  // 6. USER INFO SECTION
  const infoStartY = photoY + photoSize + 55;

  // Builder Name (Warm Cream `#FBF7E8`, auto-scaled font)
  const displayName = (name || "ANONYMOUS BUILDER").trim().toUpperCase();
  let nameFontSize = 52;
  ctx.font = `900 ${nameFontSize}px system-ui, -apple-system, 'Space Grotesk', sans-serif`;
  while (ctx.measureText(displayName).width > 920 && nameFontSize > 28) {
    nameFontSize -= 2;
    ctx.font = `900 ${nameFontSize}px system-ui, -apple-system, 'Space Grotesk', sans-serif`;
  }

  ctx.fillStyle = BRAND_CONFIG.colors.warmCream;
  ctx.textAlign = "center";
  ctx.fillText(displayName, width / 2, infoStartY);

  // Builder Title Badge Pill (Goa Pink `#BF4173`)
  const finalTitle = builderTitleOverride || generateBuilderTitle(stack, name);
  const titleYPos = infoStartY + 50;

  ctx.font = "bold 22px system-ui, -apple-system, sans-serif";
  const titleMetrics = ctx.measureText(finalTitle);
  const pillWidth = Math.max(340, titleMetrics.width + 72);
  const pillHeight = 52;
  const pillX = (width - pillWidth) / 2;

  ctx.fillStyle = BRAND_CONFIG.colors.goaPink;
  drawRoundedRect(ctx, pillX, titleYPos - 36, pillWidth, pillHeight, 26);
  ctx.fill();

  ctx.strokeStyle = BRAND_CONFIG.colors.sunYellow;
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, pillX, titleYPos - 36, pillWidth, pillHeight, 26);
  ctx.stroke();

  ctx.fillStyle = BRAND_CONFIG.colors.warmCream;
  ctx.font = "900 22px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(finalTitle, width / 2, titleYPos);

  // Stack / Role Field Box
  const stackYPos = titleYPos + 60;
  const displayStack = (stack || "Full-Stack Developer / AI Builder").trim();

  const stackBoxW = 880;
  const stackBoxH = 50;
  const stackBoxX = (width - stackBoxW) / 2;

  ctx.fillStyle = "rgba(18, 58, 39, 0.85)";
  drawRoundedRect(ctx, stackBoxX, stackYPos - 34, stackBoxW, stackBoxH, 12);
  ctx.fill();

  ctx.strokeStyle = BRAND_CONFIG.colors.palmSage;
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, stackBoxX, stackYPos - 34, stackBoxW, stackBoxH, 12);
  ctx.stroke();

  ctx.fillStyle = BRAND_CONFIG.colors.sunYellow;
  ctx.font = "900 15px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("STACK / ROLE:", stackBoxX + 24, stackYPos);

  ctx.fillStyle = BRAND_CONFIG.colors.warmCream;
  ctx.font = "600 16px system-ui, sans-serif";

  let stackText = displayStack;
  const maxStackW = 630;
  if (ctx.measureText(stackText).width > maxStackW) {
    while (stackText.length > 5 && ctx.measureText(stackText + "...").width > maxStackW) {
      stackText = stackText.slice(0, -1);
    }
    stackText += "...";
  }
  ctx.fillText(stackText, stackBoxX + 160, stackYPos);

  // 7. FOOTER & METADATA BARCODE
  const footerY = cardY + cardH - 50;

  // Divider Line
  ctx.strokeStyle = "rgba(251, 247, 232, 0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX + 40, footerY - 50);
  ctx.lineTo(cardX + cardW - 40, footerY - 50);
  ctx.stroke();

  // Left Metadata: ID Hash & Bounty Tag
  const idHash = Math.abs(simpleHash(displayName + displayStack) % 9000) + 1000;
  ctx.fillStyle = BRAND_CONFIG.colors.softSage;
  ctx.font = "bold 14px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`ID: HHG26-${idHash}`, cardX + 50, footerY - 15);

  ctx.fillStyle = BRAND_CONFIG.colors.sunYellow;
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.fillText(BRAND_CONFIG.bountyTotal, cardX + 50, footerY + 10);

  // Right Metadata: Hashtag
  ctx.fillStyle = BRAND_CONFIG.colors.sunYellow;
  ctx.font = "900 18px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(BRAND_CONFIG.hashtag, cardX + cardW - 50, footerY - 15);

  ctx.fillStyle = BRAND_CONFIG.colors.softSage;
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillText("247 SELECTED BUILDERS", cardX + cardW - 50, footerY + 10);

  // Center Security Barcode Graphic
  const barcodeX = width / 2 - 80;
  const barcodeY = footerY - 25;
  ctx.fillStyle = BRAND_CONFIG.colors.warmCream;
  const barWidths = [3, 1, 4, 2, 1, 5, 2, 3, 1, 4, 2, 5, 1, 3, 2, 4, 1, 3, 2];
  let currentBarX = barcodeX;
  for (const bw of barWidths) {
    ctx.fillRect(currentBarX, barcodeY, bw, 32);
    currentBarX += bw + 3;
  }
}

/**
 * Utility function to draw a rounded rectangle path on canvas context
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
