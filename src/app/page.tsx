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

  // In-Memory Processed Image (Uploaded once, preserved in memory for instant 0ms canvas redraws)
  const [userImage, setUserImage] = useState<HTMLImageElement | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [adjustments, setAdjustments] = useState<ImageAdjustments>(DEFAULT_ADJUSTMENTS);
  const [showAdjustments, setShowAdjustments] = useState<boolean>(false);

  // Card Background Artwork (`card-bg.png`)
  const [cardBgArtwork, setCardBgArtwork] = useState<HTMLImageElement | null>(null);

  // Sharing states
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [shareSuccessUrl, setShareSuccessUrl] = useState<string | null>(null);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const generatorRef = useRef<HTMLDivElement | null>(null);

  // Auto-generate title whenever stack/name change (unless user manually shuffled)
  useEffect(() => {
    if (!titleOverride) {
      const generated = generateBuilderTitle(stack, name);
      setBuilderTitle(generated);
    } else {
      setBuilderTitle(titleOverride);
    }
  }, [stack, name, titleOverride]);

  // Load initial placeholder avatar and authentic card background asset on mount
  useEffect(() => {
    // 1. Placeholder Avatar Image
    const defaultImg = new Image();
    defaultImg.crossOrigin = "anonymous";
    defaultImg.onload = () => setUserImage(defaultImg);
    defaultImg.src =
      "data:image/svg+xml;utf8," +
      encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
        <rect width="500" height="500" fill="#123A27"/>
        <circle cx="250" cy="250" r="210" fill="#2F683E"/>
        <circle cx="250" cy="190" r="85" fill="#F1DB51"/>
        <path d="M110 440 C 110 320, 390 320, 390 440 Z" fill="#F1DB51"/>
        <text x="250" y="470" font-family="sans-serif" font-size="20" font-weight="900" fill="#FBF7E8" text-anchor="middle">HH GOA BUILDER</text>
      </svg>
    `);

    // 2. Card Background Asset (MobileUI+IDcard.png)
    const cardBg = new Image();
    cardBg.crossOrigin = "anonymous";
    cardBg.onload = () => setCardBgArtwork(cardBg);
    cardBg.src = "/assets/card-bg.png";
  }, []);

  // In-memory instant canvas redraw (0ms delay, no reloads, no server requests)
  const triggerRender = useCallback(async () => {
    if (!canvasRef.current) return;
    await renderBuilderCardCanvas({
      canvas: canvasRef.current,
      userImage,
      name,
      stack,
      builderTitleOverride: builderTitle,
      adjustments,
      bgArtwork: cardBgArtwork,
    });
  }, [userImage, name, stack, builderTitle, adjustments, cardBgArtwork]);

  useEffect(() => {
    triggerRender();
  }, [triggerRender]);

  // File Upload Handler (Processed ONCE, kept in memory for all edits)
  const handleFileSelect = async (file: File) => {
    if (!file) return;
    setIsProcessingImage(true);
    setImageError(null);

    try {
      // 1. Convert HEIC if needed
      const convertedBlob = await convertHeicIfNeeded(file);

      // 2. Downscale image (max 2000px)
      const processedImg = await processAndDownscaleImage(convertedBlob, 2000);

      // Reset adjustments & store in memory
      setAdjustments(DEFAULT_ADJUSTMENTS);
      setUserImage(processedImg);
    } catch (err: unknown) {
      console.error(err);
      setImageError(
        err instanceof Error
          ? err.message
          : "Failed to process photo. Please try a standard JPG or PNG photo."
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
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png", 1.0)
      );

      if (!blob) throw new Error("Could not generate card image.");

      const file = new File([blob], "HH_Goa_2026_Builder_ID.png", {
        type: "image/png",
      });

      const caption = `Just built my HH Goa 2026 Builder ID 🚀 ${BRAND_CONFIG.hashtag} @247pmstudio`;

      // Web Share API Primary Path
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
          if (shareErr instanceof Error && shareErr.name === "AbortError") {
            setIsSharing(false);
            return;
          }
        }
      }

      // Desktop Fallback: Upload to /api/share -> Unique /s/[id] page
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

      const tweetText = encodeURIComponent(caption);
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

  const scrollToGenerator = () => {
    generatorRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen goa-bg-environment text-[#FBF7E8] font-sans selection:bg-[#F1DB51] selection:text-[#123A27] relative">
      {/* Semi-transparent protective gradient layer for contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#123A27]/40 via-transparent to-[#123A27]/80 pointer-events-none z-0" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-4 md:py-6 flex flex-col min-h-screen">
        {/* HEADER SECTION */}
        <header className="flex items-center justify-between py-3 border-b border-[#FBF7E8]/20 mb-6 bg-[#123A27]/60 backdrop-blur-md px-4 rounded-2xl">
          {/* Left: Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F1DB51] text-[#123A27] flex items-center justify-center font-black text-xl shadow-md">
              HH
            </div>
            <div>
              <h1 className="font-black text-base md:text-xl tracking-tight text-[#FBF7E8] leading-tight">
                {BRAND_CONFIG.eventName}
              </h1>
              <p className="text-xs text-[#DEEAE0] font-mono hidden sm:block">
                {BRAND_CONFIG.eventTag} • {BRAND_CONFIG.organizer}
              </p>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold tracking-wide text-[#DEEAE0]">
            <a href="#" className="hover:text-[#F1DB51] transition">Home</a>
            <a href="#" className="hover:text-[#F1DB51] transition">About</a>
            <a href="#" className="hover:text-[#F1DB51] transition">Tracks</a>
            <a href="#" className="hover:text-[#F1DB51] transition">Schedule</a>
            <a href="#" className="hover:text-[#F1DB51] transition">FAQs</a>
          </nav>

          {/* Right: CTA & Badge */}
          <div className="flex items-center gap-3">
            <span className="hidden lg:inline-block text-xs font-mono px-3 py-1 rounded-lg bg-[#2F683E]/80 border border-[#F1DB51]/40 text-[#F1DB51]">
              {BRAND_CONFIG.hashtag}
            </span>
            <button
              onClick={scrollToGenerator}
              className="px-4 py-2 text-xs font-black bg-[#F1DB51] hover:bg-[#E9B91E] text-[#123A27] rounded-xl transition shadow-md active:scale-95"
            >
              Generate Your ID
            </button>
          </div>
        </header>

        {/* HERO SECTION */}
        <section className="text-center py-8 md:py-14 max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#BF4173] text-[#FBF7E8] text-xs font-black uppercase tracking-widest shadow-md">
            <span className="w-2 h-2 rounded-full bg-[#F1DB51] animate-pulse" />
            OFFICIAL BUILDER PASS • {BRAND_CONFIG.bountyTotal}
          </div>

          <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1]">
            <span className="text-[#FBF7E8] block">YOUR JOURNEY.</span>
            <span className="text-[#F1DB51] block mt-1">YOUR IDENTITY.</span>
          </h2>

          <p className="text-sm md:text-base text-[#DEEAE0] max-w-lg mx-auto font-medium leading-relaxed drop-shadow">
            Create your official Hacker House Goa 2026 Builder ID. Upload your photo, customize your identity, and share your pass with the world.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={scrollToGenerator}
              className="w-full sm:w-auto py-3.5 px-8 rounded-2xl font-black text-base bg-[#F1DB51] hover:bg-[#E9B91E] text-[#123A27] shadow-2xl transition active:scale-95 flex items-center justify-center gap-2"
            >
              <span>🌴</span> START BUILDING YOUR ID
            </button>
          </div>

          <div className="flex items-center justify-center gap-4 md:gap-6 text-xs font-mono text-[#FBF7E8]/90 font-semibold drop-shadow">
            <span>✓ Instant Generation</span>
            <span>•</span>
            <span>✓ High-Quality PNG</span>
            <span>•</span>
            <span>✓ Share to X</span>
          </div>
        </section>

        {/* GENERATOR WORKSPACE SECTION */}
        <div ref={generatorRef} id="generator" className="pt-6">
          <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: Controls & Inputs */}
            <div className="lg:col-span-6 space-y-5">
              <div className="border-b border-[#FBF7E8]/20 pb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#F1DB51]">
                  FORMAT B • BUILDER ID PASS
                </span>
                <h3 className="text-2xl font-black text-[#FBF7E8]">
                  Customize Your Pass
                </h3>
              </div>

              {/* Upload Card */}
              <div className="p-5 rounded-2xl bg-[#123A27]/90 border border-[#F1DB51]/40 space-y-4 shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#F1DB51] text-[#123A27] text-[11px] font-black uppercase">
                      GET STARTED
                    </span>
                    <label className="text-sm font-bold text-[#FBF7E8]">
                      Upload Your Photo
                    </label>
                  </div>
                  <span className="text-xs text-[#DEEAE0] font-mono">JPG, PNG, HEIC</span>
                </div>

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                    isProcessingImage
                      ? "border-[#F1DB51] bg-[#F1DB51]/10"
                      : "border-[#61A167] hover:border-[#F1DB51] bg-[#2F683E]/40 hover:bg-[#2F683E]/70"
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
                      <div className="w-8 h-8 border-3 border-[#F1DB51] border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-bold text-[#F1DB51]">
                        Processing photo (HEIC convert & downscaling)...
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-xl bg-[#F1DB51] text-[#123A27] flex items-center justify-center text-2xl shadow-md">
                        📸
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#FBF7E8]">
                          Tap to select or drag & drop photo
                        </p>
                        <p className="text-xs text-[#DEEAE0] mt-0.5">
                          JPG, PNG, HEIC up to 10MB
                        </p>
                      </div>
                      <p className="text-[11px] text-[#F1DB51] font-mono font-semibold pt-1">
                        Tip: Square or portrait photos work best!
                      </p>
                    </>
                  )}
                </div>

                {imageError && (
                  <p className="text-xs font-medium text-rose-200 bg-rose-900/40 p-3 rounded-lg border border-rose-500/40">
                    {imageError}
                  </p>
                )}

                {/* Collapsible Photo Adjustment Controls */}
                {userImage && (
                  <div className="pt-2 border-t border-[#FBF7E8]/15">
                    <button
                      type="button"
                      onClick={() => setShowAdjustments(!showAdjustments)}
                      className="text-xs font-bold text-[#F1DB51] hover:underline flex items-center justify-between w-full py-1"
                    >
                      <span>⚙️ Optional Photo Adjustment (Zoom & Pan)</span>
                      <span>{showAdjustments ? "▲ Hide" : "▼ Adjust"}</span>
                    </button>

                    {showAdjustments && (
                      <div className="mt-3 p-4 rounded-xl bg-[#0B281A] border border-[#FBF7E8]/20 space-y-4 text-xs">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[#DEEAE0]">
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
                            className="w-full accent-[#F1DB51]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[#DEEAE0] block mb-1">Pan Left / Right</label>
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
                              className="w-full accent-[#F1DB51]"
                            />
                          </div>

                          <div>
                            <label className="text-[#DEEAE0] block mb-1">Pan Up / Down</label>
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
                              className="w-full accent-[#F1DB51]"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setAdjustments(DEFAULT_ADJUSTMENTS)}
                          className="px-3 py-1.5 rounded-lg bg-[#2F683E] hover:bg-[#3C7A4E] text-[#FBF7E8] transition font-mono text-[11px]"
                        >
                          🔄 Reset Auto-Crop
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Details Inputs Box */}
              <div className="p-5 rounded-2xl bg-[#123A27]/90 border border-[#F1DB51]/40 space-y-4 shadow-xl backdrop-blur-md">
                <label className="text-sm font-bold text-[#FBF7E8] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#F1DB51] text-[#123A27] text-xs flex items-center justify-center font-mono font-black">
                    2
                  </span>
                  Enter Details
                </label>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#DEEAE0]">Builder Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Satoshi Nakamoto"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0B281A] border border-[#61A167] focus:border-[#F1DB51] focus:outline-none text-[#FBF7E8] text-sm transition"
                  />
                </div>

                {/* Stack / Role */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#DEEAE0]">Tech Stack / Role</label>
                  <input
                    type="text"
                    value={stack}
                    onChange={(e) => {
                      setStack(e.target.value);
                      setTitleOverride(null);
                    }}
                    placeholder="e.g. Next.js • Solana • AI"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0B281A] border border-[#61A167] focus:border-[#F1DB51] focus:outline-none text-[#FBF7E8] text-sm transition"
                  />
                </div>

                {/* Generated Builder Title */}
                <div className="pt-2 border-t border-[#FBF7E8]/15 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#DEEAE0]">
                      Generated Builder Title
                    </span>
                    <button
                      type="button"
                      onClick={cycleTitle}
                      className="text-xs font-bold text-[#F1DB51] hover:underline"
                    >
                      🎲 Shuffle Title
                    </button>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#BF4173] border border-[#F1DB51]/50 flex items-center justify-between shadow-md">
                    <span className="font-black text-[#FBF7E8] tracking-wide text-sm">
                      {builderTitle}
                    </span>
                    <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-[#F1DB51] text-[#123A27]">
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
                  className="w-full py-4 px-6 rounded-2xl font-black text-base bg-[#F1DB51] hover:bg-[#E9B91E] text-[#123A27] shadow-2xl transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <span className="text-xl">📥</span> Download PNG Builder ID
                </button>

                <button
                  type="button"
                  onClick={handleShareToX}
                  disabled={isSharing}
                  className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm bg-[#BF4173] hover:bg-[#A3345E] text-[#FBF7E8] transition active:scale-95 flex items-center justify-center gap-2 border border-[#F1DB51]/30 disabled:opacity-50"
                >
                  {isSharing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#FBF7E8] border-t-transparent rounded-full animate-spin" />
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
                  <div className="p-3 rounded-xl bg-[#0B281A] border border-[#F1DB51]/30 text-xs flex items-center justify-between gap-2">
                    <span className="truncate text-[#DEEAE0] font-mono">{shareSuccessUrl}</span>
                    <button
                      type="button"
                      onClick={copyShareLink}
                      className="px-2.5 py-1 rounded bg-[#F1DB51] text-[#123A27] font-black text-[11px] hover:bg-[#E9B91E] transition shrink-0"
                    >
                      {copied ? "Copied! ✓" : "Copy Link"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Persistent Live Preview */}
            <div className="lg:col-span-6 flex flex-col items-center space-y-4">
              <div className="w-full flex items-center justify-between px-1">
                <span className="text-xs font-mono text-[#DEEAE0] uppercase">
                  LIVE BUILDER ID PREVIEW
                </span>
                <span className="text-xs font-mono text-[#F1DB51] flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#F1DB51] animate-pulse" />
                  Instant 1200x1500 Canvas
                </span>
              </div>

              {/* Canvas Card View Container */}
              <div className="w-full max-w-md aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-4 border-[#F1DB51] bg-[#123A27] relative group">
                <canvas
                  ref={canvasRef}
                  className="w-full h-full object-contain display-block"
                />
              </div>

              <p className="text-xs text-[#DEEAE0]/80 font-mono text-center max-w-xs">
                Rendered entirely in browser memory. Instant updates without page reload.
              </p>
            </div>
          </main>
        </div>

        {/* FOOTER SECTION */}
        <footer className="mt-16 pt-6 border-t border-[#FBF7E8]/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#DEEAE0] font-mono bg-[#123A27]/60 backdrop-blur-md px-4 py-4 rounded-2xl">
          <p>© 2026 Hacker House Goa • Organized by 2:47 PM Studio</p>
          <p>Goa, India • {BRAND_CONFIG.bountyTotal} • {BRAND_CONFIG.hashtag}</p>
        </footer>
      </div>
    </div>
  );
}
