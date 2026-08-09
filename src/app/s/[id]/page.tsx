import { BRAND_CONFIG } from "@/lib/brand";
import { Metadata } from "next";

interface SharePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { id } = await params;
  
  // Base origin resolution
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  const imageUrl = process.env.BLOB_READ_WRITE_TOKEN
    ? `https://blob.vercel-storage.com/cards/hh-goa-card-${id}.png`
    : `${baseUrl}/api/card-image/${id}`;

  const title = `HH Goa 2026 — Builder ID Pass`;
  const description = `Just built my HH Goa 2026 Builder ID 🚀 #FrameInGoa @247pmstudio`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/s/${id}`,
      siteName: "Hacker House Goa 2026",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 1500,
          alt: "HH Goa 2026 Builder ID Card",
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
      creator: "@247pmstudio",
    },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { id } = await params;

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "";

  const imageUrl = process.env.BLOB_READ_WRITE_TOKEN
    ? `https://blob.vercel-storage.com/cards/hh-goa-card-${id}.png`
    : `/api/card-image/${id}`;

  const shareUrl = `${baseUrl}/s/${id}`;
  const tweetText = encodeURIComponent(
    `Just built my HH Goa 2026 Builder ID 🚀 #FrameInGoa @247pmstudio`
  );
  const tweetIntentUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(
    shareUrl
  )}`;

  return (
    <div className="min-h-screen bg-[#070A0F] text-white flex flex-col items-center justify-between p-4 md:p-8 font-sans selection:bg-[#00F2FE] selection:text-black">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#00F2FE]/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#FF9966]/15 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between py-4 border-b border-white/10 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00F2FE] to-[#FF9966] p-[2px]">
            <div className="w-full h-full bg-[#0E1526] rounded-[10px] flex items-center justify-center font-black text-[#00F2FE] text-lg">
              HH
            </div>
          </div>
          <div>
            <h1 className="font-extrabold tracking-tight text-lg leading-tight">
              {BRAND_CONFIG.eventName}
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              {BRAND_CONFIG.eventTag} • {BRAND_CONFIG.organizer}
            </p>
          </div>
        </div>

        <a
          href="/"
          className="px-4 py-2 text-xs font-bold bg-white/10 hover:bg-white/20 text-white rounded-lg transition border border-white/15"
        >
          Build Yours +
        </a>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-md my-8 flex flex-col items-center z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00FF87]/10 border border-[#00FF87]/30 text-[#00FF87] text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#00FF87] animate-pulse"></span>
            Verified Builder Pass
          </div>
          <h2 className="text-2xl font-black text-white">
            HH Goa 2026 Builder ID
          </h2>
          <p className="text-sm text-slate-400">
            Official pass generated for Hacker House Goa 2026
          </p>
        </div>

        {/* Card Graphic View */}
        <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-2 border-[#00F2FE]/40 bg-[#0E1526]">
          {/* eslint-disable-next-html-element-suppress */}
          <img
            src={imageUrl}
            alt="HH Goa 2026 Builder ID Card"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Share & Download Actions */}
        <div className="w-full space-y-3 pt-2">
          <a
            href={tweetIntentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold bg-[#00F2FE] hover:bg-[#38BDF8] text-black transition shadow-lg shadow-[#00F2FE]/20"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Share on X (#FrameInGoa)
          </a>

          <div className="grid grid-cols-2 gap-3">
            <a
              href={imageUrl}
              download="HH_Goa_2026_Builder_ID.png"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold bg-white/10 hover:bg-white/15 border border-white/15 text-white transition text-sm"
            >
              📥 Download PNG
            </a>
            <a
              href="/"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold bg-gradient-to-r from-[#FF9966]/20 to-[#FF5E62]/20 hover:from-[#FF9966]/30 hover:to-[#FF5E62]/30 border border-[#FF9966]/40 text-[#FF9966] transition text-sm"
            >
              ✨ Make Yours
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl mx-auto text-center py-4 border-t border-white/10 text-xs text-slate-500 font-mono z-10">
        HH GOA 2026 • 2:47 PM STUDIO • GOA, INDIA
      </footer>
    </div>
  );
}
