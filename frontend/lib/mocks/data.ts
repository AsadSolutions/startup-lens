import type {
  Contradiction,
  FinalReport,
  IdeaSpec,
  MoatDimension,
  ResearchFinding,
  TeamName,
  TeamReport,
} from "../types";

/**
 * Canned content for the "freelance scoping copilot" demo idea. This backs
 * both the featured example report (`EXAMPLE_REPORTS[0]`) and the live run
 * simulator (`runSimulator.ts`), which streams these same findings and
 * reports in as if a run just produced them, regardless of what the visitor
 * actually typed into the idea form.
 */

export const DEMO_IDEA: IdeaSpec = {
  idea: "An AI copilot that scopes and prices freelance developer projects from a client's project brief",
  industry: "Developer Tools",
  geography: "United States",
};

export const DEMO_FINDINGS: Record<TeamName, ResearchFinding[]> = {
  market_research: [
    {
      summary:
        "US freelance and independent developer population keeps growing as full-time hiring softens",
      source: {
        title: "BLS Contingent Worker Supplement",
        url: "https://www.bls.gov/cps/contingent-and-alternative-arrangements.htm",
        published: "2025-08-12",
      },
      snippet:
        "The share of independent contractors in software roles rose again this cycle, continuing a multi-year trend.",
    },
    {
      summary: "Project scoping and estimation is the top operational pain point in freelancer surveys",
      source: {
        title: "Upwork Freelance Forward 2025",
        url: "https://www.upwork.com/research/freelance-forward-2025",
        published: "2025-06-01",
      },
      snippet: "Respondents ranked 'scoping and pricing new work' above invoicing and client acquisition.",
    },
    {
      summary: "Freelance productivity tooling TAM estimated near $2.1B, growing roughly 14% a year",
      source: {
        title: "Statista Freelance Platforms Market Report",
        url: "https://www.statista.com/",
        published: "2025-09-30",
      },
      snippet: "Category growth is driven more by tool adoption per freelancer than by freelancer count alone.",
    },
  ],
  competitor_analysis: [
    {
      summary: "Bonsai and HoneyBook own invoicing and contracts but stop short of scoping assistance",
      source: {
        title: "Bonsai vs HoneyBook comparison",
        url: "https://www.bonsai.com/blog/bonsai-vs-honeybook",
        published: "2025-05-14",
      },
      snippet: "Neither product offers requirement parsing or effort estimation from a client brief.",
    },
    {
      summary: "No reviewed competitor pairs LLM-based requirement parsing with historical pricing data",
      source: {
        title: "G2 Category: Freelance Management Software",
        url: "https://www.g2.com/categories/freelance-management",
        published: "2025-07-22",
      },
      snippet: "Category listings cluster around invoicing, time tracking, and contracts.",
    },
  ],
  investment_landscape: [
    {
      summary: "Seed funding for vertical AI copilots targeting freelancers and SMBs rose over the past 18 months",
      source: {
        title: "Crunchbase News: Vertical AI Seed Rounds",
        url: "https://news.crunchbase.com/",
        published: "2025-10-02",
      },
      snippet: "Investors cited faster time-to-revenue in vertical copilots versus horizontal productivity tools.",
    },
    {
      summary: "A direct comparable, ScopeIQ, closed a $3.2M seed round",
      source: {
        title: "TechCrunch: ScopeIQ seed round",
        url: "https://techcrunch.com/",
        published: "2025-04-18",
      },
      snippet: "ScopeIQ pitches AI-assisted scoping for freelance and agency teams, funded four months ago.",
    },
  ],
  moat_scoring: [
    {
      summary: "Pricing accuracy compounds with usage, a mild data-driven network effect",
      source: {
        title: "a16z: Data Network Effects in Vertical SaaS",
        url: "https://a16z.com/",
        published: "2025-03-11",
      },
      snippet: "Estimation accuracy improves fastest in tools that retain outcome data per project, not just inputs.",
    },
    {
      summary: "Switching costs are low without stored client or project history",
      source: {
        title: "SaaStr: Switching Costs in Horizontal Tools",
        url: "https://www.saastr.com/",
        published: "2025-02-20",
      },
      snippet: "Tools without persistent account-level history see higher churn to newer entrants.",
    },
    {
      summary: "No regulatory barriers identified for project-scoping software",
      source: {
        title: "FTC: Software and Services Guidance",
        url: "https://www.ftc.gov/",
        published: "2025-01-15",
      },
      snippet: "No licensing regime applies to estimation or quoting software in this category.",
    },
  ],
  gtm_strategy: [
    {
      summary: "Beachhead: solo full-stack freelancers billing $75-150/hr on Upwork and direct contracts",
      source: {
        title: "Freelance Forward 2025 segment data",
        url: "https://www.upwork.com/research/freelance-forward-2025",
        published: "2025-06-01",
      },
      snippet: "This segment reports the highest weekly time spent on scoping and quoting new work.",
    },
    {
      summary: "Community channels outperform paid ads for early freelancer tooling",
      source: {
        title: "Indie Hackers: Channel Benchmarks for Dev Tools",
        url: "https://www.indiehackers.com/",
        published: "2025-07-05",
      },
      snippet: "Forums and developer Discords drove lower CAC than paid search in comparable launches.",
    },
    {
      summary: "Usage-based pricing anchored to project value tested better than flat subscription",
      source: {
        title: "Lenny's Newsletter: Pricing Vertical AI Tools",
        url: "https://www.lennysnewsletter.com/",
        published: "2025-08-19",
      },
      snippet: "Early interviews favored a per-scoped-project fee over a flat monthly seat price.",
    },
  ],
};

const demoTeamReport = (
  team: TeamName,
  summary: string,
  keyInsights: string[],
  risks: string[],
  spend: number,
): TeamReport => ({
  team,
  summary,
  key_insights: keyInsights,
  risks,
  sources: DEMO_FINDINGS[team].map((f) => f.source),
  truncated: false,
  spend,
});

export const DEMO_TEAM_REPORTS: Record<TeamName, TeamReport> = {
  market_research: demoTeamReport(
    "market_research",
    "The freelance developer market is large, growing, and underserved on scoping and pricing tooling specifically.",
    [
      "US freelance/independent developer population keeps growing as full-time hiring softens",
      "Project scoping and estimation is the most commonly cited operational pain point in freelancer surveys",
      "Addressable market for freelance productivity tooling is estimated near $2.1B, growing roughly 14% a year",
    ],
    [
      "Market sizing leans on adjacent freelance-platform data rather than tooling-specific spend, so the addressable slice may be smaller than modeled.",
    ],
    9400,
  ),
  competitor_analysis: demoTeamReport(
    "competitor_analysis",
    "Incumbent freelance business tools handle invoicing and contracts well but none combine AI-based scoping with pricing benchmarks.",
    [
      "Bonsai and HoneyBook dominate invoicing and contracts but stop short of scoping assistance",
      "No reviewed competitor pairs LLM-based requirement parsing with historical pricing data",
    ],
    ["A well-funded incumbent could bolt on an AI scoping feature faster than a new entrant can build distribution."],
    6100,
  ),
  investment_landscape: demoTeamReport(
    "investment_landscape",
    "Investor interest in vertical AI copilots for the freelance and SMB segment is rising, with at least one direct comparable already funded.",
    [
      "Seed funding for vertical AI copilots targeting freelancers and SMBs has risen over the past 18 months",
      "A direct comparable, ScopeIQ, closed a $3.2M seed round four months ago",
    ],
    ["Research was cut short on budget before later-stage rounds and international investor activity could be reviewed."],
    8700,
  ),
  moat_scoring: demoTeamReport(
    "moat_scoring",
    "Defensibility is currently thin: the main durable advantage would come from accumulated pricing data, not network or switching effects.",
    [
      "Pricing accuracy compounds with usage, creating a mild data-driven moat as volume grows",
      "Switching costs are low today since no version stores client or project history",
      "No regulatory barriers apply to this category",
    ],
    ["A moat built on data accumulation takes meaningful volume to become defensible, and is vulnerable in the early months."],
    7300,
  ),
  gtm_strategy: demoTeamReport(
    "gtm_strategy",
    "The clearest path in is solo full-stack freelancers on established platforms, reached through community channels rather than paid acquisition.",
    [
      "Beachhead: solo full-stack freelancers billing $75-150/hr on Upwork and direct contracts",
      "Community channels (indie hacker forums, developer Discords) outperform paid acquisition for early freelancer tooling",
      "Usage-based pricing anchored to project value tested better than flat subscription in early interviews",
    ],
    ["Community-led growth is slower to measure and harder to forecast than paid channels."],
    8000,
  ),
};

export const DEMO_MOAT_BREAKDOWN: MoatDimension[] = [
  {
    dimension: "network_effects",
    score: 1,
    justification: "Value doesn't increase directly with other users, only indirectly through shared pricing data.",
  },
  {
    dimension: "switching_costs",
    score: 1,
    justification: "Low today; nothing yet locks in a client's project history or team preferences.",
  },
  {
    dimension: "technology_edge",
    score: 3,
    justification: "LLM-based scoping combined with a pricing benchmark dataset is a real but replicable edge.",
  },
  {
    dimension: "brand",
    score: 1,
    justification: "No brand recognition yet in a category with no dominant incumbent to displace.",
  },
  {
    dimension: "regulation",
    score: 0,
    justification: "No regulatory requirements or licensing apply to project-scoping software.",
  },
];

export const DEMO_CONTRADICTIONS: Contradiction[] = [
  {
    teams: ["investment_landscape", "moat_scoring"],
    description:
      "Investment Landscape flags a funded direct comparable (ScopeIQ) already active in this space, while MOAT Scoring treats the data-accumulation advantage as still uncaptured. If ScopeIQ is further along, the moat window described here may already be narrowing.",
  },
];

export const DEMO_EXECUTIVE_SUMMARY =
  "An AI copilot that scopes and prices freelance developer projects addresses a real, growing pain point in a market with no dedicated incumbent, but defensibility is currently thin and at least one funded competitor is already accumulating the same pricing data this report treats as the long-term moat. Proceed, but plan to out-execute on distribution and data collection from day one rather than relying on a structural advantage.";

function buildFinalReport(runId: string, generatedAt: string): FinalReport {
  return {
    run_id: runId,
    idea: DEMO_IDEA,
    executive_summary: DEMO_EXECUTIVE_SUMMARY,
    readiness_verdict: "proceed_with_caution",
    readiness_note: "Real demand and an open lane, but the moat is not yet defensible and a funded comparable already exists.",
    team_reports: [
      DEMO_TEAM_REPORTS.market_research,
      DEMO_TEAM_REPORTS.competitor_analysis,
      DEMO_TEAM_REPORTS.investment_landscape,
      DEMO_TEAM_REPORTS.moat_scoring,
      DEMO_TEAM_REPORTS.gtm_strategy,
    ],
    team_failures: [],
    moat_breakdown: DEMO_MOAT_BREAKDOWN,
    contradictions: DEMO_CONTRADICTIONS,
    generated_at: generatedAt,
  };
}

// ---------------------------------------------------------------------------
// Precomputed example reports for the landing page ("EXAMPLE REPORTS" cards)
// and for `getReport`/`getExampleReports` lookups.
// ---------------------------------------------------------------------------

const tutoringReport: FinalReport = {
  run_id: "example-tutoring-marketplace",
  idea: {
    idea: "A marketplace connecting retired teachers with homeschooling families for on-demand tutoring",
    industry: "EdTech",
    geography: "United States",
  },
  executive_summary:
    "Homeschooling has grown fast enough that families now systematically look for subject-specific help, and retired teachers are an underused, credentialed supply pool no existing marketplace targets directly. The main open question is trust and vetting at scale, not demand.",
  readiness_verdict: "promising",
  readiness_note: "Clear underserved supply and demand match; go-to-market hinges on trust, not awareness.",
  team_reports: [
    {
      team: "market_research",
      summary: "US homeschooling households have grown past 3 million and increasingly pay for supplemental instruction.",
      key_insights: [
        "Homeschooling households have grown steadily since 2021, well past pandemic-era peaks",
        "Supplemental paid tutoring spend per homeschooling household is rising year over year",
      ],
      risks: ["Growth rate estimates vary widely by source and region."],
      sources: [
        {
          title: "National Home Education Research Institute report",
          url: "https://www.nheri.org/",
          published: "2025-05-20",
        },
        {
          title: "EdWeek: Homeschooling Enrollment Trends",
          url: "https://www.edweek.org/",
          published: "2025-09-02",
        },
      ],
      truncated: false,
      spend: 8100,
    },
    {
      team: "competitor_analysis",
      summary: "Existing tutoring marketplaces optimize for test prep and general subjects, not retired-educator supply.",
      key_insights: [
        "Wyzant and Varsity Tutors compete on breadth of subjects, not on educator vetting depth",
        "No reviewed platform markets specifically to retired or credentialed public-school teachers as supply",
      ],
      risks: ["A broad incumbent could add a 'certified teacher' filter without building new supply."],
      sources: [
        {
          title: "Wyzant vs Varsity Tutors comparison",
          url: "https://www.wyzant.com/",
          published: "2025-06-11",
        },
      ],
      truncated: false,
      spend: 5400,
    },
    {
      team: "investment_landscape",
      summary: "Tutoring marketplaces raise steadily but investors are cautious after several post-pandemic edtech pullbacks.",
      key_insights: [
        "Several general tutoring marketplaces raised Series A/B rounds in the past two years",
        "Investors increasingly ask for retention data before follow-on, not just GMV growth",
      ],
      risks: ["Comparable valuations skew high from the 2021 edtech cycle and may not repeat."],
      sources: [
        {
          title: "PitchBook: Tutoring & Supplemental Education",
          url: "https://pitchbook.com/",
          published: "2025-07-30",
        },
      ],
      truncated: false,
      spend: 6900,
    },
    {
      team: "moat_scoring",
      summary: "Trust and vetted-supply density are the durable advantages here, not technology.",
      key_insights: [
        "A vetted, credentialed educator pool is slow for competitors to replicate at matching quality",
        "Two-sided marketplace liquidity creates real switching costs once a family finds a good tutor match",
      ],
      risks: ["Vetting depth is also the main scaling bottleneck, not just the moat."],
      sources: [
        {
          title: "a16z: Marketplace Trust as a Moat",
          url: "https://a16z.com/",
          published: "2025-04-09",
        },
      ],
      truncated: false,
      spend: 7200,
    },
    {
      team: "gtm_strategy",
      summary: "Retired-teacher Facebook groups and homeschool co-ops are the highest-leverage entry channels.",
      key_insights: [
        "Beachhead: homeschool co-ops in states with the highest homeschooling growth rates",
        "Retired-teacher associations and Facebook groups are an efficient supply-acquisition channel",
      ],
      risks: ["Co-op-led growth is regional and may not generalize nationally without local reseeding."],
      sources: [
        {
          title: "Homeschool co-op directory analysis",
          url: "https://www.a2zhomeschooling.com/",
          published: "2025-08-01",
        },
      ],
      truncated: false,
      spend: 7600,
    },
  ],
  team_failures: [],
  moat_breakdown: [
    { dimension: "network_effects", score: 3, justification: "Two-sided liquidity improves match quality as both sides grow." },
    { dimension: "switching_costs", score: 3, justification: "Families are reluctant to leave a tutor relationship that is working." },
    { dimension: "technology_edge", score: 1, justification: "Matching and scheduling are commodity marketplace mechanics." },
    { dimension: "brand", score: 2, justification: "Trust signals from vetting can build brand faster than typical marketplaces." },
    { dimension: "regulation", score: 1, justification: "Background-check requirements vary by state but are not prohibitive." },
  ],
  contradictions: [
    {
      teams: ["investment_landscape", "moat_scoring"],
      description:
        "Investment Landscape notes investor caution toward tutoring marketplaces broadly, while MOAT Scoring rates the trust and liquidity advantage highly. The category's funding chill may not track this specific model's differentiation.",
    },
  ],
  generated_at: "2026-06-02T14:20:00Z",
};

export const EXAMPLE_REPORTS: FinalReport[] = [
  buildFinalReport("example-freelance-copilot", "2026-07-01T16:45:00Z"),
  tutoringReport,
];
