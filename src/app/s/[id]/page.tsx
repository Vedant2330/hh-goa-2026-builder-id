import { BRAND_CONFIG } from "@/lib/brand";
import { Metadata } from "next";

interface SharePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { id } = await params;
  
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
    <div className="min-h-screen bg-[#123A27] text-[#FBF7E8] flex flex-col items-center justify-between p-4 md:p-8 font-sans selection:bg-[#F1DB51] selection:text-[#123A27]">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#2F683E]/60 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#BF4173]/20 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between py-4 border-b border-[#FBF7E8]/15 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F1DB51] text-[#123A27] flex items-center justify-center font-black text-xl shadow-md">
            HH
          </div>
          <div>
            <h1 className="font-extrabold tracking-tight text-lg leading-tight text-[#FBF7E8]">
              {BRAND_CONFIG.eventName}
            </h1>
            <p className="text-xs text-[#DEEAE0] font-mono">
              {BRAND_CONFIG.eventTag} • {BRAND_CONFIG.organizer}
            </p>
          </div>
        </div>

        <a
          href="/"
          className="px-4 py-2 text-xs font-black bg-[#F1DB51] hover:bg-[#E9B91E] text-[#123A27] rounded-xl transition shadow-md"
        >
          Build Yours +
        </a>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-md my-8 flex flex-col items-center z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1DB51]/20 border border-[#F1DB51]/40 text-[#F1DB51] text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-[#F1DB51] animate-pulse"></span>
            Verified Builder Pass
          </div>
          <h2 className="text-2xl font-black text-[#FBF7E8]">
            HH Goa 2026 Builder ID
          </h2>
          <p className="text-sm text-[#DEEAE0]">
            Official pass generated for Hacker House Goa 2026
          </p>
        </div>

        {/* Card Graphic View */}
        <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-4 border-[#F1DB51] bg-[#123A27]">
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
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-black bg-[#F1DB51] hover:bg-[#E9B91E] text-[#123A27] transition shadow-lg"
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
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold bg-[#2F683E] hover:bg-[#3C7A4E] border border-[#FBF7E8]/15 text-[#FBF7E8] transition text-sm"
            >
              📥 Download PNG
            </a>
            <a
              href="/"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold bg-[#BF4173] hover:bg-[#A3345E] text-[#FBF7E8] transition text-sm border border-[#F1DB51]/30"
            >
              ✨ Make Yours
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl mx-auto text-center py-4 border-t border-[#FBF7E8]/15 text-xs text-[#DEEAE0] font-mono z-10">
        HH GOA 2026 • 2:47 PM STUDIO • GOA, INDIA
      </footer>
    </div>
  );
}
