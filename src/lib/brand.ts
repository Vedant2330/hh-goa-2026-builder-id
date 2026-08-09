export const BRAND_CONFIG = {
  eventName: "HACKER HOUSE GOA 2026",
  eventTag: "BUILDER RESIDENCY",
  organizer: "2:47 PM STUDIO",
  location: "GOA, INDIA",
  dates: "OCT 2026 • 247 BUILDERS",
  hashtag: "#FrameInGoa",
  bountyTotal: "₹46.5L IN BOUNTIES",
  colors: {
    // Primary Greens
    primaryGreen: "#2F683E",
    deepForest: "#123A27",
    goaGreen: "#3C7A4E",
    palmSage: "#61A167",
    
    // Accents
    sunYellow: "#F1DB51",
    goldenYellow: "#E9B91E",
    goaPink: "#BF4173",
    
    // Light & Muted
    warmCream: "#FBF7E8",
    softSage: "#DEEAE0",
    textDark: "#1B2920",
    
    // Transparency borders
    borderYellow: "rgba(241, 219, 81, 0.4)",
    borderCream: "rgba(251, 247, 232, 0.25)",
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
    keywords: [
      "ai", "ml", "llm", "prompt", "gpt", "rag", "claude", "agent", "python", 
      "pytorch", "tensorflow", "model", "deep learning", "neural", "vision"
    ],
    titles: [
      "⚡ PROMPT WHISPERER",
      "🔥 MODEL TAMER",
      "🧠 INFERENCE ARCHITECT",
      "🔮 CONTEXT WINDOW WIZARD",
      "🤖 RAG MASTERMIND",
      "⚡ ZERO-SHOT LEGEND"
    ]
  },
  {
    category: "Frontend / Design",
    keywords: [
      "frontend", "react", "next", "vue", "css", "tailwind", "ui", "ux", 
      "design", "figma", "typescript", "web", "canvas", "webgl"
    ],
    titles: [
      "🎨 PIXEL PUSHER",
      "✨ INTERFACE ALCHEMIST",
      "💎 FRONTEND WIZARD",
      "🚀 DOM MANIPULATOR",
      "⚡ VITE VELOCITY GOD",
      "🪄 COMPONENT SCULPTOR"
    ]
  },
  {
    category: "Backend / Infra",
    keywords: [
      "backend", "node", "express", "go", "golang", "rust", "docker", 
      "kubernetes", "k8s", "aws", "postgres", "sql", "redis", "devops", "api", "database"
    ],
    titles: [
      "🧱 API ARCHITECT",
      "🏕️ SERVER WHISPERER",
      "🗄️ BACKEND BUILDER",
      "🛡️ ZERO-DOWNTIME LEGEND",
      "⚡ HIGH-THROUGHPUT MONK",
      "🤠 KUBERNETES COWBOY"
    ]
  },
  {
    category: "Crypto / Web3",
    keywords: [
      "crypto", "web3", "solana", "eth", "ethereum", "smart contract", 
      "solidity", "anchor", "rust", "onchain", "defi", "nft", "token"
    ],
    titles: [
      "🌊 ON-CHAIN VOYAGER",
      "🔮 SMART CONTRACT WIZARD",
      "⚡ SOLANA SPEED DEMON",
      "⛓️ BYTECODE SORCERER",
      "💎 DEFI PROTOCOL NINJA"
    ]
  },
  {
    category: "Hardware / IoT",
    keywords: [
      "hardware", "iot", "circuit", "silicon", "solder", "raspberry", "arduino", "embedded"
    ],
    titles: [
      "🔌 CIRCUIT TINKERER",
      "⚡ SILICON WRANGLER",
      "🛠️ HARDWARE HACKER",
      "🔥 EMBEDDED MAVERICK"
    ]
  },
  {
    category: "Full Stack / Product",
    keywords: [
      "fullstack", "full-stack", "full stack", "founder", "product", "builder", 
      "maker", "engineer", "dev", "hacker", "ship", "shipping"
    ],
    titles: [
      "🚀 SHIP-IT SPECIALIST",
      "⚔️ MERGE CONFLICT SURVIVOR",
      "🌴 247PM SPEED BUILDER",
      "🌙 LATE-NIGHT COMMITTER",
      "👑 FULL-STACK TITAN",
      "🔥 ZERO-TO-ONE MAESTRO"
    ]
  }
];

export const FALLBACK_TITLES = [
  "🌴 247PM SPEED BUILDER",
  "⚡ UNSTOPPABLE BUILDER",
  "💻 CODE & COAST RESIDENT",
  "🌊 GOA SHIP MASTER",
  "🚀 HIGH-OCTANE SHIPPER"
];

export function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function generateBuilderTitle(stack: string, name: string): string {
  const lowerStack = (stack || "").toLowerCase().trim();
  const lowerName = (name || "").toLowerCase().trim();
  const combined = `${lowerName}:${lowerStack}`;
  const hash = simpleHash(combined);

  if (!lowerStack) {
    return FALLBACK_TITLES[hash % FALLBACK_TITLES.length];
  }

  for (const bucket of TITLE_BUCKETS) {
    const matched = bucket.keywords.some((kw) => lowerStack.includes(kw));
    if (matched) {
      return bucket.titles[hash % bucket.titles.length];
    }
  }

  return FALLBACK_TITLES[hash % FALLBACK_TITLES.length];
}
