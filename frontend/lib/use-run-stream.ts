"use client";

import { useEffect, useRef, useState } from "react";
import { validateIdea } from "./api";
import { TEAM_NAMES } from "./types";
import type {
  AgentRole,
  IdeaSpec,
  RunEvent,
  RunState,
  TeamName,
  TeamRunState,
} from "./types";

const RUN_BUDGET_FALLBACK = 50_000;
const FINDINGS_CAP = 3;

function emptyTeamState(team: TeamName): TeamRunState {
  return {
    team,
    status: "queued",
    current_agent: null,
    findings: [],
    spend: 0,
    started_at: null,
    completed_at: null,
    report: null,
    failure: null,
  };
}

function initialRunState(runId: string, idea: IdeaSpec): RunState {
  const teams = {} as Record<TeamName, TeamRunState>;
  for (const team of TEAM_NAMES) teams[team] = emptyTeamState(team);
  return {
    run_id: runId,
    idea,
    started_at: new Date().toISOString(),
    status: "running",
    budget: RUN_BUDGET_FALLBACK,
    total_spend: 0,
    teams,
    final_report: null,
    error: null,
  };
}

const AGENT_STATUS: Record<AgentRole, TeamRunState["status"]> = {
  researcher: "researching",
  analyst: "analyzing",
  writer: "writing",
};

function pushFinding(findings: string[], line: string): string[] {
  return [line, ...findings].slice(0, FINDINGS_CAP);
}

function withTeam(
  state: RunState,
  team: TeamName,
  update: (team: TeamRunState) => TeamRunState,
): RunState {
  return {
    ...state,
    teams: { ...state.teams, [team]: update(state.teams[team]) },
  };
}

function reduce(state: RunState, event: RunEvent): RunState {
  const synced =
    state.run_id === event.run_id ? state : { ...state, run_id: event.run_id };

  switch (event.type) {
    case "run_started":
      return { ...synced, budget: event.budget };
    case "team_started":
      return withTeam(synced, event.team, (team) => ({
        ...team,
        status: "researching",
        started_at: new Date().toISOString(),
      }));
    case "agent_update":
      return withTeam(synced, event.team, (team) => ({
        ...team,
        current_agent: event.agent,
        status: AGENT_STATUS[event.agent],
        findings: pushFinding(team.findings, event.message),
      }));
    case "finding":
      return withTeam(synced, event.team, (team) => ({
        ...team,
        findings: pushFinding(team.findings, event.finding.summary),
      }));
    case "team_completed":
      return withTeam(synced, event.team, (team) => ({
        ...team,
        status: event.report.truncated ? "truncated" : "done",
        report: event.report,
        completed_at: new Date().toISOString(),
      }));
    case "team_failed":
      return withTeam(synced, event.team, (team) => ({
        ...team,
        status: "failed",
        failure: event.failure,
        completed_at: new Date().toISOString(),
      }));
    case "spend_update":
      if (event.team === null) return { ...synced, total_spend: event.spend };
      return withTeam(synced, event.team, (team) => ({
        ...team,
        spend: event.spend,
      }));
    case "report_ready":
      return { ...synced, status: "done", final_report: event.report };
    case "error":
      return { ...synced, status: "error", error: event.message };
    default:
      return synced;
  }
}

export function useRunStream(
  runId: string,
  idea: IdeaSpec | null,
): RunState | null {
  const [state, setState] = useState<RunState | null>(null);
  const startedRef = useRef(false);
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;
    if (!idea || startedRef.current) {
      return () => {
        activeRef.current = false;
      };
    }
    startedRef.current = true;
    setState(initialRunState(runId, idea));

    (async () => {
      try {
        for await (const event of validateIdea(idea)) {
          if (!activeRef.current) continue;
          setState((prev) => (prev ? reduce(prev, event) : prev));
        }
      } catch (err) {
        if (!activeRef.current) return;
        const message =
          err instanceof Error ? err.message : "The run failed unexpectedly.";
        setState((prev) =>
          prev ? { ...prev, status: "error", error: message } : prev,
        );
      }
    })();

    return () => {
      activeRef.current = false;
    };
  }, [idea, runId]);

  return state;
}
