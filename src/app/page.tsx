"use client";

import { BRAND_CONFIG, generateBuilderTitle, TITLE_BUCKETS } from "@/lib/brand";
import { renderBuilderCardCanvas } from "@/lib/canvas";
import {
  convertHeicIfNeeded,
  DEFAULT_ADJUSTMENTS,
  ImageAdjustments,
  processAndDownscaleImage,
} from "@/lib/image-utils";
import { useCallback, useEffect, useRef, useState } from "react";

export default function GeneratorPage() {
  // Input states
  const [name, setName] = useState<string>("Satoshi Nakamoto");
  const [stack, setStack] = useState<string>("Next.js • Solana • AI");
  const [builderTitle, setBuilderTitle] = useState<string>("");
  const [titleOverride, setTitleOverride] = useState<string | null>(null);

  // Image & Adjustment states
  const [userImage, setUserImage] = useState<HTMLImageElement | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [adjustments, setAdjustments] = useState<ImageAdjustments>(DEFAULT_ADJUSTMENTS);
  const [showAdjustments, setShowAdjustments] = useState<boolean>(false);

  // Sharing states
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [shareSuccessUrl, setShareSuccessUrl] = useState<string | null>(null);

  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-generate title whenever stack/name change (unless overridden manually)
  useEffect(() => {
    if (!titleOverride) {
      const generated = generateBuilderTitle(stack, name);
      setBuilderTitle(generated);
    } else {
      setBuilderTitle(titleOverride);
    }
  }, [stack, name, titleOverride]);

  // Load a default avatar placeholder for initial presentation
  useEffect(() => {
    const defaultImg = new Image();
    defaultImg.crossOrigin = "anonymous";
    defaultImg.onload = () => setUserImage(defaultImg);
    // Dark cyber profile avatar placeholder
    defaultImg.src =
      "data:image/svg+xml;utf8," +
      encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#00F2FE"/>
            <stop offset="100%" stop-color="#FF9966"/>
          </linearGradient>
        </defs>
        <rect width="500" height="500" fill="#131B2E"/>
        <circle cx="250" cy="210" r="90" fill="url(#bg)" opacity="0.8"/>
        <path d="M100 450 C 100 320, 400 320, 400 450 Z" fill="url(#bg)" opacity="0.8"/>
        <text x="250" y="470" font-family="sans-serif" font-size="20" font-weight="bold" fill="#00F2FE" text-anchor="middle">HH GOA BUILDER</text>
      </svg>
    `);
  }, []);

  // Re-render canvas whenever relevant states change
  const triggerRender = useCallback(async () => {
    if (!canvasRef.current) return;
    await renderBuilderCardCanvas({
      canvas: canvasRef.current,
      userImage,
      name,
      stack,
      builderTitleOverride: builderTitle,
      adjustments,
    });
  }, [userImage, name, stack, builderTitle, adjustments]);

  useEffect(() => {
    triggerRender();
  }, [triggerRender]);

  // File Upload Handler
  const handleFileSelect = async (file: File) => {
    if (!file) return;
    setIsProcessingImage(true);
    setImageError(null);

    try {
      // 1. HEIC conversion if needed
      const convertedBlob = await convertHeicIfNeeded(file);

      // 2. Downscale immediately (max 2000px)
      const processedImg = await processAndDownscaleImage(convertedBlob, 2000);

      // Reset adjustments on new photo load
      setAdjustments(DEFAULT_ADJUSTMENTS);
      setUserImage(processedImg);
    } catch (err: unknown) {
      console.error(err);
      setImageError(
        err instanceof Error
          ? err.message
          : "Failed to process photo. Please try a standard JPG/PNG file."
      );
    } finally {
      setIsProcessingImage(false);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  // Cycle Builder Title manually
  const cycleTitle = () => {
    const allTitles = TITLE_BUCKETS.flatMap((b) => b.titles);
    const currentIndex = allTitles.indexOf(builderTitle);
    const nextIndex = (currentIndex + 1) % allTitles.length;
    const nextTitle = allTitles[nextIndex];
    setTitleOverride(nextTitle);
    setBuilderTitle(nextTitle);
  };

  // Download PNG Handler
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const safeName = (name || "builder").replace(/[^a-z0-9]/gi, "_").toLowerCase();
        a.href = url;
        a.download = `HH_Goa_2026_ID_${safeName}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },
      "image/png",
      1.0
    );
  };

  // Share to X Handler
  const handleShareToX = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsSharing(true);
    setShareSuccessUrl(null);

    try {
      // Get canvas PNG blob
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png", 1.0)
      );

      if (!blob) throw new Error("Could not generate card image.");

      const file = new File([blob], "HH_Goa_2026_Builder_ID.png", {
        type: "image/png",
      });

      const caption = `Just built my HH Goa 2026 Builder ID 🚀 ${BRAND_CONFIG.hashtag} @247pmstudio`;

      // 1. PRIMARY PATH: Native Web Share API (Mobile Safari / Android Chrome)
      if (
        typeof navigator !== "undefined" &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({
            files: [file],
            title: "HH Goa 2026 Builder ID",
            text: caption,
          });
          setIsSharing(false);
          return;
        } catch (shareErr) {
          // If user cancels share dialog, exit gracefully
          if (
            shareErr instanceof Error &&
            shareErr.name === "AbortError"
          ) {
            setIsSharing(false);
            return;
          }
          console.warn("Web Share failed, falling back to desktop link path:", shareErr);
        }
      }

      // 2. FALLBACK PATH: Upload to /api/share -> Unique /s/[id] page -> X Intent
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/share", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.shareUrl) {
        throw new Error(data.error || "Failed to generate share link.");
      }

      setShareSuccessUrl(data.shareUrl);

      // Open X Tweet Intent in new window
      const tweetText = encodeURIComponent(
        `Just built my HH Goa 2026 Builder ID 🚀 ${BRAND_CONFIG.hashtag} @247pmstudio`
      );
      const tweetIntentUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(
        data.shareUrl
      )}`;

      window.open(tweetIntentUrl, "_blank", "noopener,noreferrer");
    } catch (err: unknown) {
      console.error(err);
      alert(
        err instanceof Error
          ? err.message
          : "Failed to share card. Please download the PNG directly!"
      );
    } finally {
      setIsSharing(false);
    }
  };

  const copyShareLink = () => {
    if (!shareSuccessUrl) return;
    navigator.clipboard.writeText(shareSuccessUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 font-sans selection:bg-[#00F2FE] selection:text-black">
      {/* Glow Backdrop */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#00F2FE]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#FF9966]/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6 md:py-10 flex flex-col min-h-screen">
        {/* Navbar Header */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-8 border-b border-white/10 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00F2FE] via-[#4FACFE] to-[#FF9966] p-[2px] shadow-lg shadow-[#00F2FE]/20">
              <div className="w-full h-full bg-[#0E1526] rounded-[14px] flex items-center justify-center font-black text-[#00F2FE] text-xl">
                HH
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-xl sm:text-2xl tracking-tight text-white">
                  {BRAND_CONFIG.eventName}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00FF87]/15 text-[#00FF87] border border-[#00FF87]/30">
                  {BRAND_CONFIG.bountyTotal}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {BRAND_CONFIG.eventTag} • {BRAND_CONFIG.organizer} • {BRAND_CONFIG.location}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300">
              {BRAND_CONFIG.hashtag}
            </span>
          </div>
        </header>

        {/* Main Grid: Controls Left, Live Canvas Right */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-grow">
          {/* LEFT COLUMN: Controls & Form */}
          <div className="lg:col-span-6 space-y-6">
            {/* Title / Intro */}
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#00F2FE] mb-1">
                Format B • Official Builder Pass
              </span>
              <h2 className="text-3xl font-black tracking-tight text-white">
                Generate Your HH Goa Builder ID
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Upload your photo, set your role & tech stack. Instant client-side render in seconds.
              </p>
            </div>

            {/* Step 1: Photo Upload Box */}
            <div className="p-5 rounded-2xl bg-[#0E1526]/80 border border-white/10 space-y-4 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#00F2FE]/20 text-[#00F2FE] text-xs flex items-center justify-center font-mono">
                    1
                  </span>
                  Upload Your Photo
                </label>
                <span className="text-xs text-slate-400 font-mono">JPG, PNG, HEIC</span>
              </div>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                  isProcessingImage
                    ? "border-[#00F2FE] bg-[#00F2FE]/5"
                    : "border-slate-700 hover:border-[#00F2FE]/60 bg-white/[0.02] hover:bg-white/[0.04]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.heic,.heif"
                  onChange={onInputChange}
                  className="hidden"
                />

                {isProcessingImage ? (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <div className="w-8 h-8 border-3 border-[#00F2FE] border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-semibold text-[#00F2FE]">
                      Processing photo (HEIC convert & downscaling)...
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-[#00F2FE]/10 text-[#00F2FE] flex items-center justify-center text-2xl">
                      📸
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-200">
                        Tap to select or drag & drop photo
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        iPhone HEIC photos auto-converted client-side
                      </p>
                    </div>
                  </>
                )}
              </div>

              {imageError && (
                <p className="text-xs font-medium text-rose-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
                  {imageError}
                </p>
              )}

              {/* Optional Adjustments Collapsible */}
              {userImage && (
                <div className="pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowAdjustments(!showAdjustments)}
                    className="text-xs font-semibold text-[#00F2FE] hover:underline flex items-center justify-between w-full py-1"
                  >
                    <span>⚙️ Optional Photo Adjustment (Zoom & Pan)</span>
                    <span>{showAdjustments ? "▲ Hide" : "▼ Adjust"}</span>
                  </button>

                  {showAdjustments && (
                    <div className="mt-3 p-4 rounded-xl bg-black/40 border border-white/10 space-y-4 text-xs">
                      {/* Zoom */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-300">
                          <span>Zoom Level</span>
                          <span className="font-mono">{adjustments.zoom.toFixed(1)}x</span>
                        </div>
                        <input
                          type="range"
                          min="1.0"
                          max="3.0"
                          step="0.05"
                          value={adjustments.zoom}
                          onChange={(e) =>
                            setAdjustments({
                              ...adjustments,
                              zoom: parseFloat(e.target.value),
                            })
                          }
                          className="w-full accent-[#00F2FE]"
                        />
                      </div>

                      {/* Pan X / Y */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-300 block mb-1">Pan Left / Right</label>
                          <input
                            type="range"
                            min="-200"
                            max="200"
                            value={adjustments.panX}
                            onChange={(e) =>
                              setAdjustments({
                                ...adjustments,
                                panX: parseInt(e.target.value, 10),
                              })
                            }
                            className="w-full accent-[#00F2FE]"
                          />
                        </div>

                        <div>
                          <label className="text-slate-300 block mb-1">Pan Up / Down</label>
                          <input
                            type="range"
                            min="-200"
                            max="200"
                            value={adjustments.panY}
                            onChange={(e) =>
                              setAdjustments({
                                ...adjustments,
                                panY: parseInt(e.target.value, 10),
                              })
                            }
                            className="w-full accent-[#00F2FE]"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setAdjustments(DEFAULT_ADJUSTMENTS)}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition font-mono text-[11px]"
                      >
                        🔄 Reset Auto-Crop
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Builder Fields */}
            <div className="p-5 rounded-2xl bg-[#0E1526]/80 border border-white/10 space-y-4 backdrop-blur-md">
              <label className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#00F2FE]/20 text-[#00F2FE] text-xs flex items-center justify-center font-mono">
                  2
                </span>
                Enter Details
              </label>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Builder Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Satoshi Nakamoto"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-slate-700 focus:border-[#00F2FE] focus:outline-none text-white text-sm transition"
                />
              </div>

              {/* Stack / Role */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Tech Stack / Role
                </label>
                <input
                  type="text"
                  value={stack}
                  onChange={(e) => {
                    setStack(e.target.value);
                    setTitleOverride(null); // Reset override on typing
                  }}
                  placeholder="e.g. Next.js • Solana • AI"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-slate-700 focus:border-[#00F2FE] focus:outline-none text-white text-sm transition"
                />
              </div>

              {/* Generated Builder Title Preview */}
              <div className="pt-2 border-t border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">
                    Generated Builder Title
                  </span>
                  <button
                    type="button"
                    onClick={cycleTitle}
                    className="text-xs font-semibold text-[#FF9966] hover:underline"
                  >
                    🎲 Shuffle Title
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-[#00F2FE]/10 border border-[#00F2FE]/30 flex items-center justify-between">
                  <span className="font-extrabold text-[#00F2FE] tracking-wide text-sm">
                    {builderTitle}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00F2FE]/20 text-[#00F2FE]">
                    AUTO
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleDownload}
                className="w-full py-4 px-6 rounded-2xl font-black text-base bg-gradient-to-r from-[#00F2FE] to-[#4FACFE] hover:from-[#38BDF8] hover:to-[#60A5FA] text-black shadow-xl shadow-[#00F2FE]/25 transition active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <span className="text-xl">📥</span> Download PNG Builder ID
              </button>

              <button
                type="button"
                onClick={handleShareToX}
                disabled={isSharing}
                className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm bg-white/10 hover:bg-white/15 border border-white/15 text-white transition active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSharing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Preparing Share Link...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    Share to X (#FrameInGoa)
                  </>
                )}
              </button>

              {shareSuccessUrl && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs flex items-center justify-between gap-2">
                  <span className="truncate text-slate-300 font-mono">{shareSuccessUrl}</span>
                  <button
                    type="button"
                    onClick={copyShareLink}
                    className="px-2.5 py-1 rounded bg-[#00F2FE]/20 text-[#00F2FE] font-bold text-[11px] hover:bg-[#00F2FE]/30 transition shrink-0"
                  >
                    {copied ? "Copied! ✓" : "Copy Link"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Live Canvas Preview */}
          <div className="lg:col-span-6 flex flex-col items-center space-y-4">
            <div className="w-full flex items-center justify-between px-1">
              <span className="text-xs font-mono text-slate-400 uppercase">Live Card Preview</span>
              <span className="text-xs font-mono text-[#00FF87] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00FF87] animate-pulse" />
                Real-time 1200x1500 Canvas
              </span>
            </div>

            {/* Responsive Canvas Wrapper */}
            <div className="w-full max-w-md aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl shadow-[#00F2FE]/10 border-2 border-[#00F2FE]/40 bg-[#0E1526] relative group">
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain display-block"
              />
            </div>

            <p className="text-xs text-slate-500 font-mono text-center max-w-xs">
              Client-side rendered via HTML5 Canvas. Zero latency server round-trips.
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
          <p>© 2026 Hacker House Goa • Organized by 2:47 PM Studio</p>
          <p>Goa, India • ₹46.5L In Bounties • #FrameInGoa</p>
        </footer>
      </div>
    </div>
  );
}
