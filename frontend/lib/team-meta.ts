import {
  Landmark,
  Rocket,
  ShieldCheck,
  Swords,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { TeamName } from "./types";

export const TEAM_ICONS: Record<TeamName, LucideIcon> = {
  market_research: TrendingUp,
  competitor_analysis: Swords,
  investment_landscape: Landmark,
  moat_scoring: ShieldCheck,
  gtm_strategy: Rocket,
};
