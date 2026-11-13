/**
 * Static search index over the public site: page titles, section headings and
 * short summaries. Built at module scope so both the command palette and the
 * /search results page score against the same data.
 *
 * News articles are intentionally not indexed here — the index is shaped so a
 * dynamic source can be concatenated later.
 */

export type SearchDoc = {
  /** Route path, used directly as the result link. */
  path: string;
  /** Page title shown as the result group. */
  page: string;
  /** Section heading, when the entry points at a section rather than the page. */
  section?: string;
  /** Short summary shown under the result. */
  summary: string;
  /** Extra keywords that should match but are not displayed. */
  keywords?: string;
};

export const SEARCH_INDEX: SearchDoc[] = [
  {
    path: "/",
    page: "Home",
    summary:
      "Engineering tomorrow's intelligent infrastructure — AI-powered manufacturing ecosystems, robotics, clean energy and digital infrastructure at global scale.",
    keywords: "gigafactory 3x homepage overview hero intelligent industry",
  },
  {
    path: "/",
    page: "Home",
    section: "Global operations",
    summary:
      "Giga-campus metrics, production capacity, engineering headcount and operating regions.",
    keywords: "metrics capacity scale numbers operations",
  },
  {
    path: "/about",
    page: "About Gigafactory 3X",
    summary:
      "Who we are, what we build and why we exist: mission, vision and engineering principles.",
    keywords: "mission vision company leadership history values",
  },
  {
    path: "/technologies",
    page: "Core Technologies",
    summary:
      "One vertically integrated technology platform, from silicon to steel.",
    keywords: "platform stack vertical integration",
  },
  {
    path: "/technologies",
    page: "Core Technologies",
    section: "Artificial intelligence",
    summary:
      "Foundation models tuned for physical systems, computer vision on the line and reinforcement learning for supply-chain optimisation.",
    keywords: "ai machine learning models computer vision inference copilot",
  },
  {
    path: "/technologies",
    page: "Core Technologies",
    section: "Robotics",
    summary:
      "Bipedal and industrial robots for precision assembly, autonomous logistics and dexterous manipulation.",
    keywords: "robots humanoid arms cobots automation assembly",
  },
  {
    path: "/technologies",
    page: "Core Technologies",
    section: "Battery systems",
    summary:
      "Next-generation cell chemistries, gigafactory-scale pack assembly and grid-scale energy storage.",
    keywords: "battery cells packs storage bess chemistry",
  },
  {
    path: "/technologies",
    page: "Core Technologies",
    section: "Semiconductor technologies",
    summary:
      "Specialty silicon and packaging for edge AI inference, industrial control and power electronics.",
    keywords: "semiconductor chips silicon packaging power electronics",
  },
  {
    path: "/technologies",
    page: "Core Technologies",
    section: "Digital twin systems",
    summary:
      "Real-time digital twins of every asset, product and plant — simulated, monitored and optimised continuously.",
    keywords: "digital twin simulation monitoring modelling",
  },
  {
    path: "/industries",
    page: "Industries",
    summary:
      "Manufacturing, energy, aerospace, logistics, smart cities, infrastructure and government solutions.",
    keywords: "sectors markets customers verticals aerospace logistics government",
  },
  {
    path: "/infrastructure",
    page: "Global Infrastructure",
    summary:
      "Giga-campuses, research labs, compute and logistics hubs engineered and orchestrated as one system.",
    keywords: "campus facilities plants regions sites footprint map",
  },
  {
    path: "/infrastructure",
    page: "Global Infrastructure",
    section: "Capacity & footprint",
    summary:
      "Installed production capacity, campus land area, compute density and clean generation on site.",
    keywords: "capacity gigawatt hours land compute megawatt",
  },
  {
    path: "/sustainability",
    page: "Sustainability",
    summary:
      "Clean generation, circular manufacturing, water stewardship and audited ESG governance.",
    keywords: "esg carbon net zero renewable circular recycling water waste",
  },
  {
    path: "/sustainability",
    page: "Sustainability",
    section: "Decarbonisation roadmap",
    summary:
      "Milestone-by-milestone plan for renewable-matched electricity, closed-loop materials and Scope 3 reduction.",
    keywords: "roadmap targets scope 1 2 3 milestones",
  },
  {
    path: "/innovation",
    page: "Innovation",
    summary:
      "Research labs, patents, engineering programmes and next-generation technologies.",
    keywords: "r&d research labs patents programmes",
  },
  {
    path: "/investors",
    page: "Investors",
    summary:
      "Growth strategy, sustainability, governance and corporate outlook for investors.",
    keywords: "investment ir strategy governance outlook funding shares",
  },
  {
    path: "/news",
    page: "News & Press",
    summary:
      "Press releases, programme announcements and media coverage from the Gigafactory 3X newsroom.",
    keywords: "newsroom press release media announcement journalists",
  },
  {
    path: "/careers",
    page: "Careers",
    summary:
      "Engineering culture, internships, graduate programmes and global opportunities.",
    keywords: "jobs hiring recruitment internship graduate roles",
  },
  {
    path: "/contact",
    page: "Contact",
    summary: "Global headquarters, regional offices, contact form and support.",
    keywords: "address phone email offices support enquiries",
  },
  {
    path: "/resources/smart-factory-guide",
    page: "Smart Factory Guide",
    summary:
      "Smart factory architecture, phased rollout, economics and frequently asked questions on Industry 4.0.",
    keywords: "guide industry 4.0 smart manufacturing faq architecture rollout",
  },
];

export type SearchHit = SearchDoc & { score: number };

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9+.]+/i)
    .filter((t) => t.length > 1);
}

/** Scores the static index: page title > section heading > summary/keywords. */
export function searchSite(query: string, limit = 20): SearchHit[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const hits: SearchHit[] = [];
  for (const doc of SEARCH_INDEX) {
    const page = doc.page.toLowerCase();
    const section = (doc.section ?? "").toLowerCase();
    const body = `${doc.summary} ${doc.keywords ?? ""}`.toLowerCase();

    let score = 0;
    let matchedAll = true;
    for (const token of tokens) {
      let tokenScore = 0;
      if (page.startsWith(token)) tokenScore += 12;
      else if (page.includes(token)) tokenScore += 8;
      if (section.includes(token)) tokenScore += 6;
      if (body.includes(token)) tokenScore += 3;
      if (tokenScore === 0) matchedAll = false;
      score += tokenScore;
    }
    if (score === 0) continue;
    if (matchedAll) score += 5 * tokens.length;
    hits.push({ ...doc, score });
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Splits text into matched / unmatched chunks for highlighting. */
export function highlightParts(text: string, query: string): { text: string; hit: boolean }[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [{ text, hit: false }];
  const pattern = new RegExp(`(${tokens.map(escapeRegExp).join("|")})`, "gi");
  return text
    .split(pattern)
    .filter((chunk) => chunk.length > 0)
    .map((chunk) => ({ text: chunk, hit: pattern.test(chunk) && tokens.includes(chunk.toLowerCase()) }));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
