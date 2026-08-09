export const BRAND_CONFIG = {
  eventName: "HACKER HOUSE GOA 2026",
  eventTag: "BUILDER RESIDENCY",
  organizer: "2:47 PM STUDIO",
  location: "GOA, INDIA",
  dates: "OCT 2026 • 247 BUILDERS",
  hashtag: "#FrameInGoa",
  bountyTotal: "₹46.5L IN BOUNTIES",
  colors: {
    bgDark: "#0B0F17",
    bgCard: "#131B2E",
    bgCardGlow: "rgba(0, 242, 254, 0.15)",
    cyanNeon: "#00F2FE",
    cyanSecondary: "#4FACFE",
    sunsetGold: "#FF9966",
    sunsetPink: "#FF5E62",
    palmLime: "#00FF87",
    textWhite: "#FFFFFF",
    textMuted: "#94A3B8",
    borderGlow: "rgba(0, 242, 254, 0.4)",
  },
} as const;

export interface TitleBucket {
  category: string;
  keywords: string[];
  titles: string[];
}

export const TITLE_BUCKETS: TitleBucket[] = [
  {
    category: "AI / ML",
    keywords: ["ai", "ml", "llm", "prompt", "gpt", "rag", "claude", "agent", "python", "pytorch", "tensorflow", "model", "deep learning", "neural"],
    titles: [
      "⚡ PROMPT WHISPERER",
      "🔥 GPU BURNER",
      "🧠 NEURAL ARCHITECT",
      "🔮 CONTEXT WINDOW WIZARD",
      "🤖 RAG MASTERMIND",
      "⚡ ZERO-SHOT LEGEND"
    ]
  },
  {
    category: "Frontend / Design",
    keywords: ["frontend", "react", "next", "vue", "css", "tailwind", "ui", "ux", "design", "figma", "typescript", "web", "canvas", "webgl"],
    titles: [
      "🎨 PIXEL PERFECTIONIST",
      "✨ CSS WARLOCK",
      "💎 COMPONENT SCULPTOR",
      "🚀 DOM MANIPULATOR",
      "⚡ VITE VELOCITY GOD",
      "🪄 UI ALCHEMIST"
    ]
  },
  {
    category: "Backend / Infra",
    keywords: ["backend", "node", "express", "go", "golang", "rust", "docker", "kubernetes", "k8s", "aws", "postgres", "sql", "redis", "devops", "api", "database"],
    titles: [
      "🤠 KUBERNETES COWBOY",
      "🏕️ SERVERLESS NOMAD",
      "🗄️ DATABASE WHISPERER",
      "🧱 API ARCHITECT",
      "🛡️ ZERO-DOWNTIME LEGEND",
      "⚡ HIGH-THROUGHPUT MONK"
    ]
  },
  {
    category: "Crypto / Web3",
    keywords: ["crypto", "web3", "solana", "eth", "ethereum", "smart contract", "solidity", "anchor", "rust", "onchain", "defi", "nft", "token"],
    titles: [
      "🌊 ON-CHAIN VOYAGER",
      "🔮 SMART CONTRACT WIZARD",
      "⚡ SOLANA SPEED DEMON",
      "⛓️ BYTECODE SORCERER",
      "💎 DEFI PROTOCOL NINJA"
    ]
  },
  {
    category: "Full Stack / Product",
    keywords: ["fullstack", "full-stack", "full stack", "founder", "product", "builder", "maker", "engineer", "dev", "hacker", "ship", "shipping"],
    titles: [
      "🚀 SHIP-IT SPECIALIST",
      "⚔️ MERGE CONFLICT SURVIVOR",
      "⚡ 10X PRODUCT NINJA",
      "🌙 LATE-NIGHT COMMITTER",
      "👑 FULL-STACK TITAN",
      "🔥 ZERO-TO-ONE MAESTRO"
    ]
  }
];

export const FALLBACK_TITLES = [
  "🌴 GOA SHIP MASTER",
  "⚡ UNSTOPPABLE BUILDER",
  "💻 CODE & COAST RESIDENT",
  "🔥 247PM SPEED BUILDER",
  "🚀 HIGH-OCTANE SHIPPER"
];

// Hash function to pick deterministically from title list
export function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Returns a Builder Title based on tech stack and user name
 */
export function generateBuilderTitle(stack: string, name: string): string {
  const lowerStack = (stack || "").toLowerCase().trim();
  const lowerName = (name || "").toLowerCase().trim();
  const combined = `${lowerName}:${lowerStack}`;
  const hash = simpleHash(combined);

  if (!lowerStack) {
    return FALLBACK_TITLES[hash % FALLBACK_TITLES.length];
  }

  // Find matching bucket
  for (const bucket of TITLE_BUCKETS) {
    const matched = bucket.keywords.some((kw) => lowerStack.includes(kw));
    if (matched) {
      return bucket.titles[hash % bucket.titles.length];
    }
  }

  return FALLBACK_TITLES[hash % FALLBACK_TITLES.length];
}
