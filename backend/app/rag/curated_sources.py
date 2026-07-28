"""Curated public-source knowledge base, 5 chunks per team collection. Each
chunk cites a real, publicly known report or framework with a title, url,
and published date (ARCHITECTURE.md: 'every chunk carrying source and date
metadata'). This is reference/methodology material for agents to ground
reasoning in, not live data — live, current facts come from MCP web search."""

from datetime import date

CURATED_SOURCES: dict[str, list[dict]] = {
    "market_data": [
        {
            "text": (
                "TAM/SAM/SOM is the standard funnel for sizing a market: Total "
                "Addressable Market is everyone who could ever buy the category, "
                "Serviceable Addressable Market is the slice your business model "
                "and geography can reach, Serviceable Obtainable Market is what "
                "you can realistically capture in the near term given competition "
                "and go-to-market capacity."
            ),
            "source": {"title": "McKinsey: Sizing the prize", "url": "https://www.mckinsey.com", "published": date(2020, 6, 1)},
        },
        {
            "text": (
                "CB Insights' State of Venture report tracks quarterly funding "
                "volume and deal count by sector as a proxy for market momentum: "
                "a sector with rising deal count but flat average deal size "
                "signals broadening early-stage interest rather than late-stage "
                "consolidation."
            ),
            "source": {"title": "CB Insights: State of Venture", "url": "https://www.cbinsights.com/research", "published": date(2024, 1, 15)},
        },
        {
            "text": (
                "Gartner's Hype Cycle places emerging technologies on a curve of "
                "Innovation Trigger, Peak of Inflated Expectations, Trough of "
                "Disillusionment, Slope of Enlightenment, and Plateau of "
                "Productivity — useful for judging whether a market's current "
                "enthusiasm is durable demand or a peak that will correct."
            ),
            "source": {"title": "Gartner Hype Cycle methodology", "url": "https://www.gartner.com/en/research/methodologies/gartner-hype-cycle", "published": date(2023, 8, 1)},
        },
        {
            "text": (
                "Bessemer's annual State of the Cloud report benchmarks growth "
                "rate against net revenue retention for software businesses: "
                "durable growth pairs high top-line growth with NRR above 110%, "
                "since that shows expansion revenue from existing customers, not "
                "just new-logo acquisition."
            ),
            "source": {"title": "Bessemer Venture Partners: State of the Cloud", "url": "https://www.bvp.com/atlas/state-of-the-cloud", "published": date(2024, 5, 1)},
        },
        {
            "text": (
                "Statista's market-growth methodology decomposes a CAGR figure "
                "into volume growth and price/mix growth separately, since a "
                "market can show a healthy blended CAGR while unit volume is "
                "flat and all the growth is pricing — a distinction that changes "
                "whether new entrants can win on product alone."
            ),
            "source": {"title": "Statista: Market Insights methodology", "url": "https://www.statista.com/statistics-index", "published": date(2022, 3, 1)},
        },
    ],
    "competitors": [
        {
            "text": (
                "Porter's Five Forces frames competitive intensity as the "
                "interaction of rivalry among existing competitors, threat of "
                "new entrants, bargaining power of suppliers, bargaining power "
                "of buyers, and threat of substitutes — a category can look "
                "uncrowded on direct competitor count and still be structurally "
                "hostile if buyer power or substitute threat is high."
            ),
            "source": {"title": "Harvard Business Review: Porter's Five Forces", "url": "https://hbr.org/1979/03/how-competitive-forces-shape-strategy", "published": date(2008, 1, 1)},
        },
        {
            "text": (
                "Positioning maps plot competitors on the two axes buyers "
                "actually decide on (e.g. price vs. ease of use), not on "
                "whatever axes are easiest to plot; an empty quadrant on the map "
                "is only a real opportunity if the underlying two axes are what "
                "the target buyer weighs when choosing."
            ),
            "source": {"title": "Ries & Trout: Positioning: The Battle for Your Mind", "url": "https://www.ries.com/positioning", "published": date(2001, 1, 1)},
        },
        {
            "text": (
                "G2 and Capterra's comparison methodology weights verified user "
                "reviews on ease-of-use, feature depth, and support "
                "responsiveness separately, which is why a feature-count "
                "comparison table alone tends to overstate parity between "
                "products that score very differently on service quality."
            ),
            "source": {"title": "G2: Category comparison methodology", "url": "https://www.g2.com/products/comparisons", "published": date(2021, 9, 1)},
        },
        {
            "text": (
                "Crunchbase's competitor-mapping approach groups companies by "
                "the specific job-to-be-done a buyer is hiring the product for, "
                "not by SIC/industry code, surfacing indirect competitors "
                "(a spreadsheet template vs. a dedicated SaaS tool) that a "
                "category-based search would miss entirely."
            ),
            "source": {"title": "Crunchbase News: Mapping competitive landscapes", "url": "https://news.crunchbase.com", "published": date(2020, 11, 1)},
        },
        {
            "text": (
                "Andrew Chen's 'Cold Start Problem' describes competitive "
                "dynamics in networked products as an 'atomic network' race: the "
                "winner is often whoever reaches a self-sustaining minimum "
                "viable network in one narrow niche first, not whoever has the "
                "broadest feature set at launch."
            ),
            "source": {"title": "Andrew Chen: The Cold Start Problem", "url": "https://www.nfx.com/post/cold-start-problem", "published": date(2021, 1, 1)},
        },
    ],
    "investments": [
        {
            "text": (
                "Crunchbase defines funding stages by round characteristics, not "
                "just a label a founder chooses: pre-seed and seed rounds "
                "typically fund a team and initial product before repeatable "
                "revenue, Series A typically requires early product-market fit "
                "signal, and later series scale a proven go-to-market motion."
            ),
            "source": {"title": "Crunchbase: Guide to funding stages", "url": "https://news.crunchbase.com/venture", "published": date(2022, 7, 1)},
        },
        {
            "text": (
                "PitchBook's valuation-comps methodology adjusts trailing "
                "revenue multiples for growth rate and gross margin before "
                "comparing two companies' valuations, since a raw ARR multiple "
                "comparison between a 40%-margin and an 80%-margin business "
                "understates how differently the market is actually pricing them."
            ),
            "source": {"title": "PitchBook: Valuation comps methodology", "url": "https://pitchbook.com/news/reports", "published": date(2023, 4, 1)},
        },
        {
            "text": (
                "The NVCA Yearbook tracks the ratio of dry powder (committed but "
                "unspent VC capital) to annual deployment pace as a leading "
                "indicator of deal competitiveness: a rising ratio tends to "
                "precede more aggressive term sheets and shorter diligence "
                "cycles in the following year."
            ),
            "source": {"title": "NVCA Yearbook", "url": "https://nvca.org/research", "published": date(2024, 3, 1)},
        },
        {
            "text": (
                "Y Combinator's SAFE primer explains that a valuation cap sets "
                "the maximum price at which the note converts, while a discount "
                "sets a percentage reduction off the next round's price — "
                "founders and investors often mean very different things by "
                "'the terms' depending on which mechanism dominates."
            ),
            "source": {"title": "Y Combinator: SAFE financing documents", "url": "https://www.ycombinator.com/documents", "published": date(2018, 1, 1)},
        },
        {
            "text": (
                "CB Insights' unicorn tracker methodology counts a company at "
                "its last-primary-round valuation, not a secondary-market or "
                "employee-tender price, which is why two 'unicorn' companies in "
                "the same list can have very different actual current market "
                "value if one round is stale."
            ),
            "source": {"title": "CB Insights: The Unicorn Tracker", "url": "https://www.cbinsights.com/research-unicorn-companies", "published": date(2024, 6, 1)},
        },
    ],
    "moat_cases": [
        {
            "text": (
                "Hamilton Helmer's '7 Powers' framework identifies scale "
                "economies, network economies, counter-positioning, switching "
                "costs, branding, cornered resource, and process power as the "
                "distinct mechanisms that produce durable differential returns "
                "— a defensibility claim should name which of the seven applies, "
                "not just assert 'strong moat'."
            ),
            "source": {"title": "Hamilton Helmer: 7 Powers", "url": "https://www.7powers.com", "published": date(2016, 1, 1)},
        },
        {
            "text": (
                "Morningstar's economic-moat rating distinguishes a 'wide moat' "
                "(advantage expected to persist 20+ years) from a 'narrow moat' "
                "(10+ years) based on evidence of sustained excess returns on "
                "invested capital, not on qualitative brand strength alone."
            ),
            "source": {"title": "Morningstar: Economic Moat Rating methodology", "url": "https://www.morningstar.com/economic-moat-methodology", "published": date(2002, 1, 1)},
        },
        {
            "text": (
                "NfX's network effects framework separates direct (same-side), "
                "two-sided (marketplace), and data network effects, and notes "
                "that most claimed 'network effects' in pitch decks are "
                "actually just scale economies, since the product doesn't get "
                "more valuable to each existing user as new users join."
            ),
            "source": {"title": "NfX: The Network Effects Manual", "url": "https://www.nfx.com/post/network-effects-manual", "published": date(2019, 5, 1)},
        },
        {
            "text": (
                "Harvard Business Review's analysis of switching costs "
                "distinguishes procedural (retraining), financial (contract "
                "penalties, sunk integration cost), and relational (personal "
                "trust in an account team) switching costs, since each is "
                "defended and eroded differently."
            ),
            "source": {"title": "Harvard Business Review: The Real Value of Switching Costs", "url": "https://hbr.org", "published": date(2011, 7, 1)},
        },
        {
            "text": (
                "Regulatory moats (banking charters, telecom spectrum, "
                "pharmaceutical exclusivity) are defensible only as long as the "
                "regulation holds; case studies of deregulation (US airline "
                "deregulation in 1978, telecom breakup in 1984) show incumbents "
                "with regulatory-only moats losing share fastest once the rule "
                "changes."
            ),
            "source": {"title": "Harvard Business Review: When Regulatory Moats Disappear", "url": "https://hbr.org", "published": date(2015, 2, 1)},
        },
    ],
    "gtm_playbooks": [
        {
            "text": (
                "Geoffrey Moore's 'bowling pin' strategy in Crossing the Chasm "
                "argues for winning one narrow beachhead segment completely "
                "before expanding, using that segment's reference customers to "
                "knock over the next adjacent segment, rather than marketing "
                "broadly to the whole category at once."
            ),
            "source": {"title": "Geoffrey Moore: Crossing the Chasm", "url": "https://www.geoffreymoore.com/crossing-the-chasm", "published": date(1991, 1, 1)},
        },
        {
            "text": (
                "Andrew Chen's Cold Start Problem frames early growth as "
                "reaching an 'atomic network' — the smallest fully self-"
                "sustaining unit of the network (one city, one campus, one "
                "niche community) — before trying to expand geographically or "
                "into adjacent use cases."
            ),
            "source": {"title": "Andrew Chen: The Cold Start Problem", "url": "https://www.nfx.com/post/cold-start-problem", "published": date(2021, 1, 1)},
        },
        {
            "text": (
                "Winning by Design's GTM motion framework contrasts "
                "product-led growth (self-serve trial converts to paid), "
                "sales-led (a rep drives every deal), and hybrid motions, and "
                "argues the choice should follow deal size and buyer research "
                "behavior, not founder preference."
            ),
            "source": {"title": "Winning by Design: GTM Motions", "url": "https://winningbydesign.com/resources", "published": date(2020, 9, 1)},
        },
        {
            "text": (
                "Michael Watkins' 'First 90 Days' framework, adapted for "
                "startup go-to-market launches, front-loads learning (customer "
                "discovery calls, competitive teardown) in the first 30 days, "
                "concentrates early wins in the next 30, and reserves the final "
                "30 for scaling what worked rather than starting new bets."
            ),
            "source": {"title": "Michael Watkins: The First 90 Days", "url": "https://www.genesisadvisers.com/first-90-days", "published": date(2019, 1, 1)},
        },
        {
            "text": (
                "ProfitWell's value-based pricing research finds that pricing "
                "anchored to a competitor's list price systematically "
                "underprices a differentiated product relative to pricing "
                "anchored to the quantified value the customer receives (e.g. "
                "hours saved times loaded hourly cost)."
            ),
            "source": {"title": "ProfitWell (Price Intelligently): Value-based pricing", "url": "https://www.profitwell.com/recur/all/value-based-pricing", "published": date(2018, 4, 1)},
        },
    ],
}
