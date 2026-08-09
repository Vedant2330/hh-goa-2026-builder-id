import { BRAND_CONFIG, generateBuilderTitle, simpleHash } from "./brand";
import { calculateCoverRect, ImageAdjustments } from "./image-utils";

export interface RenderCardOptions {
  canvas: HTMLCanvasElement;
  userImage: HTMLImageElement | null;
  name: string;
  stack: string;
  builderTitleOverride?: string;
  adjustments: ImageAdjustments;
}

/**
 * Renders the Format B Builder ID Card onto the canvas.
 * Canvas native dimensions: 1200px x 1500px (4:5 ratio).
 */
export async function renderBuilderCardCanvas({
  canvas,
  userImage,
  name,
  stack,
  builderTitleOverride,
  adjustments,
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

  // Ensure fonts are ready if running in browser
  if (typeof document !== "undefined" && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // font loading error ignored, fallback to system fonts
    }
  }

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // 1. BASE BACKGROUND & GRADIENTS
  ctx.fillStyle = BRAND_CONFIG.colors.bgDark;
  ctx.fillRect(0, 0, width, height);

  // Radial Cyan Glow (Top Left)
  const cyanGlow = ctx.createRadialGradient(200, 200, 50, 200, 200, 600);
  cyanGlow.addColorStop(0, "rgba(0, 242, 254, 0.18)");
  cyanGlow.addColorStop(1, "rgba(0, 242, 254, 0)");
  ctx.fillStyle = cyanGlow;
  ctx.fillRect(0, 0, width, height);

  // Radial Sunset Glow (Bottom Right)
  const sunsetGlow = ctx.createRadialGradient(1000, 1300, 50, 1000, 1300, 700);
  sunsetGlow.addColorStop(0, "rgba(255, 153, 102, 0.16)");
  sunsetGlow.addColorStop(1, "rgba(255, 153, 102, 0)");
  ctx.fillStyle = sunsetGlow;
  ctx.fillRect(0, 0, width, height);

  // Subtle Cyber Grid Pattern
  ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 2. MAIN BADGE CONTAINER
  const cardMargin = 40;
  const cardW = width - cardMargin * 2;
  const cardH = height - cardMargin * 2;
  const cardX = cardMargin;
  const cardY = cardMargin;
  const cardRadius = 32;

  // Draw Card Shadow
  ctx.shadowColor = "rgba(0, 242, 254, 0.2)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 10;

  // Draw Inner Card Background
  ctx.fillStyle = "#0E1526";
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
  ctx.fill();

  // Reset Shadow
  ctx.shadowBlur = 0;

  // Card Outer Neon Border (Gradient Cyan to Sunset Gold)
  const borderGradient = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  borderGradient.addColorStop(0, BRAND_CONFIG.colors.cyanNeon);
  borderGradient.addColorStop(0.5, BRAND_CONFIG.colors.cyanSecondary);
  borderGradient.addColorStop(1, BRAND_CONFIG.colors.sunsetGold);

  ctx.strokeStyle = borderGradient;
  ctx.lineWidth = 4;
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
  ctx.stroke();

  // 3. HEADER SECTION
  const headerY = cardY + 50;

  // Status Badge (Top Left Pill)
  const statusX = cardX + 50;
  const statusY = headerY;
  ctx.fillStyle = "rgba(0, 255, 135, 0.12)";
  drawRoundedRect(ctx, statusX, statusY, 210, 36, 18);
  ctx.fill();
  ctx.strokeStyle = "rgba(0, 255, 135, 0.4)";
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, statusX, statusY, 210, 36, 18);
  ctx.stroke();

  // Green Dot
  ctx.fillStyle = "#00FF87";
  ctx.beginPath();
  ctx.arc(statusX + 18, statusY + 18, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#00FF87";
  ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("OFFICIAL BUILDER PASS", statusX + 32, statusY + 22);

  // Top Right Organizer Mark
  ctx.fillStyle = BRAND_CONFIG.colors.textMuted;
  ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(BRAND_CONFIG.organizer, cardX + cardW - 50, statusY + 22);

  // Main Title: "HACKER HOUSE GOA 2026"
  const titleY = headerY + 75;
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "900 44px system-ui, -apple-system, 'Space Grotesk', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(BRAND_CONFIG.eventName, width / 2, titleY);

  // Subtitle Tag: "BUILDER RESIDENCY • GOA, INDIA"
  ctx.fillStyle = BRAND_CONFIG.colors.cyanNeon;
  ctx.font = "bold 16px system-ui, -apple-system, sans-serif";
  ctx.letterSpacing = "2px";
  ctx.fillText(`${BRAND_CONFIG.eventTag} • ${BRAND_CONFIG.location}`, width / 2, titleY + 30);
  ctx.letterSpacing = "0px";

  // 4. PHOTO CONTAINER
  const photoSize = 520;
  const photoX = (width - photoSize) / 2;
  const photoY = titleY + 60;
  const photoRadius = 24;

  // Photo Frame Outer Glow / Border
  ctx.strokeStyle = "rgba(0, 242, 254, 0.5)";
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, photoX - 4, photoY - 4, photoSize + 8, photoSize + 8, photoRadius + 4);
  ctx.stroke();

  // Tech Corner Brackets around photo
  const bracketLength = 24;
  ctx.strokeStyle = BRAND_CONFIG.colors.sunsetGold;
  ctx.lineWidth = 4;
  // Top-Left Corner
  ctx.beginPath();
  ctx.moveTo(photoX - 12, photoY - 12 + bracketLength);
  ctx.lineTo(photoX - 12, photoY - 12);
  ctx.lineTo(photoX - 12 + bracketLength, photoY - 12);
  ctx.stroke();
  // Top-Right Corner
  ctx.beginPath();
  ctx.moveTo(photoX + photoSize + 12 - bracketLength, photoY - 12);
  ctx.lineTo(photoX + photoSize + 12, photoY - 12);
  ctx.lineTo(photoX + photoSize + 12, photoY - 12 + bracketLength);
  ctx.stroke();
  // Bottom-Left Corner
  ctx.beginPath();
  ctx.moveTo(photoX - 12, photoY + photoSize + 12 - bracketLength);
  ctx.lineTo(photoX - 12, photoY + photoSize + 12);
  ctx.lineTo(photoX - 12 + bracketLength, photoY + photoSize + 12);
  ctx.stroke();
  // Bottom-Right Corner
  ctx.beginPath();
  ctx.moveTo(photoX + photoSize + 12 - bracketLength, photoY + photoSize + 12);
  ctx.lineTo(photoX + photoSize + 12, photoY + photoSize + 12);
  ctx.lineTo(photoX + photoSize + 12, photoY + photoSize + 12 - bracketLength);
  ctx.stroke();

  // Draw Photo (with Rounded Clipping)
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
    // Placeholder photo background
    ctx.fillStyle = "#182238";
    ctx.fillRect(photoX, photoY, photoSize, photoSize);

    ctx.fillStyle = BRAND_CONFIG.colors.textMuted;
    ctx.font = "bold 20px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("YOUR PHOTO HERE", photoX + photoSize / 2, photoY + photoSize / 2);
  }

  // Subtle Inner Frame Shadow Overlay
  const innerShadow = ctx.createLinearGradient(photoX, photoY, photoX, photoY + photoSize);
  innerShadow.addColorStop(0, "rgba(0,0,0,0.2)");
  innerShadow.addColorStop(0.8, "rgba(0,0,0,0)");
  innerShadow.addColorStop(1, "rgba(0,0,0,0.4)");
  ctx.fillStyle = innerShadow;
  ctx.fillRect(photoX, photoY, photoSize, photoSize);

  ctx.restore(); // Restore clipping context

  // 5. USER INFO SECTION
  const infoStartY = photoY + photoSize + 50;

  // Name (Auto-scale font to fit inside 900px width)
  const displayName = (name || "ANONYMOUS BUILDER").trim().toUpperCase();
  let nameFontSize = 52;
  ctx.font = `900 ${nameFontSize}px system-ui, -apple-system, 'Space Grotesk', sans-serif`;
  while (ctx.measureText(displayName).width > 900 && nameFontSize > 28) {
    nameFontSize -= 2;
    ctx.font = `900 ${nameFontSize}px system-ui, -apple-system, 'Space Grotesk', sans-serif`;
  }

  // Gradient text for Name
  const nameGradient = ctx.createLinearGradient(width / 2 - 300, infoStartY, width / 2 + 300, infoStartY);
  nameGradient.addColorStop(0, "#FFFFFF");
  nameGradient.addColorStop(0.6, "#FFFFFF");
  nameGradient.addColorStop(1, BRAND_CONFIG.colors.cyanNeon);
  ctx.fillStyle = nameGradient;
  ctx.textAlign = "center";
  ctx.fillText(displayName, width / 2, infoStartY);

  // Builder Title Badge Pill
  const finalTitle = builderTitleOverride || generateBuilderTitle(stack, name);
  const titleYPos = infoStartY + 50;

  ctx.font = "bold 22px system-ui, -apple-system, sans-serif";
  const titleMetrics = ctx.measureText(finalTitle);
  const pillPadding = 36;
  const pillWidth = Math.max(340, titleMetrics.width + pillPadding * 2);
  const pillHeight = 52;
  const pillX = (width - pillWidth) / 2;

  // Title Pill Background
  ctx.fillStyle = "rgba(0, 242, 254, 0.12)";
  drawRoundedRect(ctx, pillX, titleYPos - 36, pillWidth, pillHeight, 26);
  ctx.fill();

  // Title Pill Gradient Border
  ctx.strokeStyle = BRAND_CONFIG.colors.cyanNeon;
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, pillX, titleYPos - 36, pillWidth, pillHeight, 26);
  ctx.stroke();

  // Title Pill Text
  ctx.fillStyle = BRAND_CONFIG.colors.cyanNeon;
  ctx.font = "bold 22px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(finalTitle, width / 2, titleYPos);

  // Stack / Role Field Box
  const stackYPos = titleYPos + 60;
  const displayStack = (stack || "Full-Stack Developer / AI Builder").trim();

  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  const stackBoxW = 860;
  const stackBoxH = 50;
  const stackBoxX = (width - stackBoxW) / 2;
  drawRoundedRect(ctx, stackBoxX, stackYPos - 34, stackBoxW, stackBoxH, 12);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, stackBoxX, stackYPos - 34, stackBoxW, stackBoxH, 12);
  ctx.stroke();

  ctx.fillStyle = BRAND_CONFIG.colors.sunsetGold;
  ctx.font = "bold 15px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("STACK / ROLE:", stackBoxX + 24, stackYPos);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "500 16px system-ui, sans-serif";

  // Truncate stack if too long
  let stackText = displayStack;
  const maxStackW = 620;
  if (ctx.measureText(stackText).width > maxStackW) {
    while (stackText.length > 5 && ctx.measureText(stackText + "...").width > maxStackW) {
      stackText = stackText.slice(0, -1);
    }
    stackText += "...";
  }
  ctx.fillText(stackText, stackBoxX + 160, stackYPos);

  // 6. FOOTER & SECURITY BARCODE METADATA
  const footerY = cardY + cardH - 50;

  // Divider Line
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX + 40, footerY - 50);
  ctx.lineTo(cardX + cardW - 40, footerY - 50);
  ctx.stroke();

  // Left Footer Info: ID Hash & Bounty Tag
  const idHash = Math.abs(simpleHash(displayName + displayStack) % 9000) + 1000;
  ctx.fillStyle = BRAND_CONFIG.colors.textMuted;
  ctx.font = "bold 14px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`ID: HHG26-${idHash}`, cardX + 50, footerY - 15);
  ctx.fillStyle = BRAND_CONFIG.colors.palmLime;
  ctx.fillText(BRAND_CONFIG.bountyTotal, cardX + 50, footerY + 10);

  // Right Footer Info: Hashtag
  ctx.fillStyle = BRAND_CONFIG.colors.cyanNeon;
  ctx.font = "bold 18px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(BRAND_CONFIG.hashtag, cardX + cardW - 50, footerY - 15);

  ctx.fillStyle = BRAND_CONFIG.colors.textMuted;
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillText("247 SELECTED BUILDERS", cardX + cardW - 50, footerY + 10);

  // Center Decorative Tech Barcode Graphic
  const barcodeX = width / 2 - 80;
  const barcodeY = footerY - 25;
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
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
