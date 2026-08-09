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
 * Renders the Format B Builder ID Card onto the canvas with surgical precision for the barcode & bottom credential panel.
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

  // 1. BASE BACKGROUND (Dark Forest Green `#073B29`)
  ctx.fillStyle = BRAND_CONFIG.colors.darkForestGreen;
  ctx.fillRect(0, 0, width, height);

  // 2. DRAW AUTHENTIC REFERENCE BACKGROUND ARTWORK IF LOADED
  if (bgArtwork) {
    ctx.drawImage(bgArtwork, 0, 0, width, height);
  } else {
    const sunGlow = ctx.createRadialGradient(width / 2, 400, 40, width / 2, 400, 500);
    sunGlow.addColorStop(0, "rgba(246, 217, 40, 0.3)");
    sunGlow.addColorStop(0.7, "rgba(7, 59, 41, 0.2)");
    sunGlow.addColorStop(1, "rgba(7, 59, 41, 0)");
    ctx.fillStyle = sunGlow;
    ctx.fillRect(0, 0, width, height);
  }

  // Subtle dark-green gradient overlay for header and photo contrast
  const topOverlay = ctx.createLinearGradient(0, 0, 0, 1050);
  topOverlay.addColorStop(0, "rgba(7, 59, 41, 0.35)");
  topOverlay.addColorStop(0.7, "rgba(7, 59, 41, 0.1)");
  topOverlay.addColorStop(1, "rgba(7, 59, 41, 0)");
  ctx.fillStyle = topOverlay;
  ctx.fillRect(0, 0, width, 1050);

  // 3. CARD OUTER DOUBLE BORDER FRAME (32px margin from canvas edge)
  const cardMargin = 32;
  const cardW = width - cardMargin * 2; // 1136px
  const cardH = height - cardMargin * 2; // 1436px
  const cardX = cardMargin;
  const cardY = cardMargin;
  const cardRadius = 36;

  // Outer Border Stroke (Sunset Yellow `#F6D928`)
  ctx.strokeStyle = BRAND_CONFIG.colors.sunsetYellow;
  ctx.lineWidth = 6;
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
  ctx.stroke();

  // Inner Cream Accent Border Line
  ctx.strokeStyle = "rgba(244, 232, 200, 0.35)";
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, cardX + 8, cardY + 8, cardW - 16, cardH - 16, cardRadius - 8);
  ctx.stroke();

  // 4. TOP HEADER SECTION (Structured Spacing)
  const headerY = cardY + 44; // 76px

  // Status Badge (Top Left Pill)
  const statusX = cardX + 44; // 76px
  const statusY = headerY;
  ctx.fillStyle = BRAND_CONFIG.colors.sunsetYellow;
  drawRoundedRect(ctx, statusX, statusY, 210, 36, 18);
  ctx.fill();

  // Active Green Dot
  ctx.fillStyle = BRAND_CONFIG.colors.darkForestGreen;
  ctx.beginPath();
  ctx.arc(statusX + 18, statusY + 18, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = BRAND_CONFIG.colors.textDark;
  ctx.font = "900 13px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("OFFICIAL BUILDER PASS", statusX + 32, statusY + 22);

  // Top Right Organizer Mark
  const rightHeaderX = cardX + cardW - 44; // 1124px
  ctx.fillStyle = BRAND_CONFIG.colors.warmOffWhite;
  ctx.font = "bold 14px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(BRAND_CONFIG.organizer, rightHeaderX, statusY + 22);

  // Event Headline: "HACKER HOUSE GOA 2026"
  const titleY = headerY + 75; // 151px -> baseline 175px
  ctx.fillStyle = BRAND_CONFIG.colors.warmOffWhite;
  ctx.font = "900 46px system-ui, -apple-system, 'Space Grotesk', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(BRAND_CONFIG.eventName, width / 2, titleY);

  // Subtitle: "BUILDER RESIDENCY • GOA, INDIA"
  const subtitleY = titleY + 35; // 210px
  ctx.fillStyle = BRAND_CONFIG.colors.sunsetYellow;
  ctx.font = "bold 16px system-ui, -apple-system, sans-serif";
  ctx.fillText(`${BRAND_CONFIG.eventTag} • ${BRAND_CONFIG.location}`, width / 2, subtitleY);

  // 5. PROFILE PHOTO MODULE
  const photoSize = 470;
  const photoX = (width - photoSize) / 2; // 365px
  const photoY = 265;
  const photoRadius = 24;

  // Photo Outer Frame (Cream & Sunset Yellow)
  ctx.fillStyle = BRAND_CONFIG.colors.cream;
  drawRoundedRect(ctx, photoX - 8, photoY - 8, photoSize + 16, photoSize + 16, photoRadius + 5);
  ctx.fill();

  ctx.strokeStyle = BRAND_CONFIG.colors.sunsetYellow;
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, photoX - 12, photoY - 12, photoSize + 24, photoSize + 24, photoRadius + 7);
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
    ctx.fillStyle = BRAND_CONFIG.colors.darkForestGreen;
    ctx.fillRect(photoX, photoY, photoSize, photoSize);

    ctx.fillStyle = BRAND_CONFIG.colors.midGreen;
    ctx.font = "bold 20px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("YOUR PHOTO HERE", photoX + photoSize / 2, photoY + photoSize / 2);
  }

  // Edge Vignette
  const photoVignette = ctx.createLinearGradient(photoX, photoY, photoX, photoY + photoSize);
  photoVignette.addColorStop(0, "rgba(0, 0, 0, 0.12)");
  photoVignette.addColorStop(0.8, "rgba(0, 0, 0, 0)");
  photoVignette.addColorStop(1, "rgba(0, 0, 0, 0.25)");
  ctx.fillStyle = photoVignette;
  ctx.fillRect(photoX, photoY, photoSize, photoSize);

  ctx.restore();

  // 6. BUILDER NAME + BUILDER TITLE BADGE
  const infoStartY = photoY + photoSize + 50; // 785px

  // Builder Name (Warm Off-White `#FFF7E6`)
  const displayName = (name || "ANONYMOUS BUILDER").trim().toUpperCase();
  let nameFontSize = 48;
  ctx.font = `900 ${nameFontSize}px system-ui, -apple-system, 'Space Grotesk', sans-serif`;
  while (ctx.measureText(displayName).width > 920 && nameFontSize > 28) {
    nameFontSize -= 2;
    ctx.font = `900 ${nameFontSize}px system-ui, -apple-system, 'Space Grotesk', sans-serif`;
  }

  ctx.fillStyle = BRAND_CONFIG.colors.warmOffWhite;
  ctx.textAlign = "center";
  ctx.fillText(displayName, width / 2, infoStartY);

  // Builder Title Badge Pill (Goa Magenta `#D62F73`)
  const finalTitle = builderTitleOverride || generateBuilderTitle(stack, name);
  const titleYPos = infoStartY + 47; // 832px

  ctx.font = "bold 22px system-ui, -apple-system, sans-serif";
  const titleMetrics = ctx.measureText(finalTitle);
  const pillWidth = Math.max(340, titleMetrics.width + 72);
  const pillHeight = 48;
  const pillX = (width - pillWidth) / 2;

  ctx.fillStyle = BRAND_CONFIG.colors.goaMagenta;
  drawRoundedRect(ctx, pillX, titleYPos - 33, pillWidth, pillHeight, 24);
  ctx.fill();

  ctx.strokeStyle = BRAND_CONFIG.colors.sunsetYellow;
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, pillX, titleYPos - 33, pillWidth, pillHeight, 24);
  ctx.stroke();

  ctx.fillStyle = BRAND_CONFIG.colors.warmOffWhite;
  ctx.font = "900 22px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(finalTitle, width / 2, titleYPos);

  // 7. STACK / ROLE BAR
  const stackYPos = titleYPos + 58; // 890px
  const displayStack = (stack || "Full-Stack Developer / AI Builder").trim();

  const stackBoxW = 880;
  const stackBoxH = 48;
  const stackBoxX = (width - stackBoxW) / 2; // 160px

  ctx.fillStyle = "rgba(7, 59, 41, 0.9)";
  drawRoundedRect(ctx, stackBoxX, stackYPos - 33, stackBoxW, stackBoxH, 12);
  ctx.fill();

  ctx.strokeStyle = BRAND_CONFIG.colors.jungleGreen;
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, stackBoxX, stackYPos - 33, stackBoxW, stackBoxH, 12);
  ctx.stroke();

  ctx.fillStyle = BRAND_CONFIG.colors.sunsetYellow;
  ctx.font = "900 14px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("STACK / ROLE:", stackBoxX + 24, stackYPos);

  ctx.fillStyle = BRAND_CONFIG.colors.warmOffWhite;
  ctx.font = "600 16px system-ui, sans-serif";

  let stackText = displayStack;
  const maxStackW = 630;
  if (ctx.measureText(stackText).width > maxStackW) {
    while (stackText.length > 5 && ctx.measureText(stackText + "...").width > maxStackW) {
      stackText = stackText.slice(0, -1);
    }
    stackText += "...";
  }
  ctx.fillText(stackText, stackBoxX + 164, stackYPos);

  // 8. LARGE BREATHING SPACE / GOA SUNSET ARTWORK (y: 915px to 1250px)
  // The tropical landscape, sunset, ocean, beach and palm trees remain unobstructed here.

  // 9. SURGICAL FIX: THREE-COLUMN CREDENTIAL PANEL & FIXED ASPECT RATIO BARCODE (y: 1250px to 1410px, height: 160px)
  const panelY = 1250;
  const panelH = 160;
  const panelW = cardW - 88; // 1048px
  const panelX = (width - panelW) / 2; // 76px

  // Translucent Dark Forest Credential Panel Container
  ctx.fillStyle = "rgba(7, 59, 41, 0.9)";
  drawRoundedRect(ctx, panelX, panelY, panelW, panelH, 20);
  ctx.fill();

  ctx.strokeStyle = "rgba(246, 217, 40, 0.35)";
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, panelX, panelY, panelW, panelH, 20);
  ctx.stroke();

  const idHash = Math.abs(simpleHash(displayName + displayStack) % 9000) + 1000;
  const leftRightBaselineY = panelY + 45; // 1295px

  // LEFT COLUMN: BUILDER ID & BOUNTIES (x: 108px, left-aligned)
  const leftX = panelX + 32;
  ctx.fillStyle = BRAND_CONFIG.colors.sunsetYellow;
  ctx.font = "900 12px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("BUILDER ID", leftX, leftRightBaselineY);

  ctx.fillStyle = BRAND_CONFIG.colors.warmOffWhite;
  ctx.font = "bold 22px monospace";
  ctx.fillText(`HHG26-${idHash}`, leftX, leftRightBaselineY + 28);

  ctx.fillStyle = BRAND_CONFIG.colors.midGreen;
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.fillText(BRAND_CONFIG.bountyTotal, leftX, leftRightBaselineY + 54);

  // CENTER COLUMN: DEDICATED BARCODE CONTAINER (320px x 108px, centered in panel)
  const containerW = 320;
  const containerH = 108;
  const containerX = (width - containerW) / 2; // 440px
  const containerY = panelY + (panelH - containerH) / 2; // 1276px

  ctx.fillStyle = "rgba(6, 79, 50, 0.95)";
  drawRoundedRect(ctx, containerX, containerY, containerW, containerH, 12);
  ctx.fill();

  ctx.strokeStyle = "rgba(246, 217, 40, 0.25)";
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, containerX, containerY, containerW, containerH, 12);
  ctx.stroke();

  // FIXED ASPECT RATIO BARCODE (270px wide, 60px high, exact undistorted vertical bars)
  const barcodeW = 270;
  const barcodeH = 60;
  const barcodeDrawX = containerX + (containerW - barcodeW) / 2; // 465px
  const barcodeDrawY = containerY + 12; // 1288px

  ctx.fillStyle = BRAND_CONFIG.colors.warmOffWhite;
  // Authentic fixed barcode pattern (exact pixel widths without variable stretch)
  const fixedBarPattern = [
    3, 2, 4, 2, 2, 4, 2, 3, 2, 5, 2, 2, 4, 2, 3, 2, 4, 2, 2, 3, 2, 4, 2, 3, 2, 4, 2, 3, 2, 4, 2, 3, 2
  ];
  let curX = barcodeDrawX;
  for (const bw of fixedBarPattern) {
    ctx.fillRect(curX, barcodeDrawY, bw, barcodeH);
    curX += bw + 4;
  }

  // BARCODE ID TEXT (Centered directly below barcode inside container, 8px gap)
  ctx.fillStyle = BRAND_CONFIG.colors.sunsetYellow;
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "center";
  ctx.fillText(`HHG26-${idHash}`, width / 2, barcodeDrawY + barcodeH + 20);

  // RIGHT COLUMN: HASHTAG & LOCATION (x: 1092px, right-aligned)
  const rightX = panelX + panelW - 32;
  ctx.fillStyle = BRAND_CONFIG.colors.sunsetYellow;
  ctx.font = "900 22px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(BRAND_CONFIG.hashtag, rightX, leftRightBaselineY);

  ctx.fillStyle = BRAND_CONFIG.colors.textSecondary;
  ctx.font = "13px system-ui, sans-serif";
  ctx.fillText("247 SELECTED BUILDERS", rightX, leftRightBaselineY + 28);

  ctx.fillStyle = BRAND_CONFIG.colors.warmOffWhite;
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.fillText("GOA, INDIA", rightX, leftRightBaselineY + 54);

  // 10. BOTTOM EDITORIAL TAGLINE
  const bottomLineY = cardY + cardH - 18; // 1448px
  ctx.fillStyle = BRAND_CONFIG.colors.sunsetYellow;
  ctx.font = "900 13px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("BUILD • CODE • CHILL • REPEAT", width / 2, bottomLineY);
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
