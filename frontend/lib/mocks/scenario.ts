/**
 * `validateIdea`'s signature has to match the real backend exactly (idea,
 * industry, geography — nothing else), so the "make a team fail" scenario
 * can't be an extra function parameter. Instead it's a `?scenario=fail` URL
 * query param, read here so nothing outside `lib/` needs to know it exists.
 * Without it, the baseline mock run always includes one early finish and one
 * budget truncation, but every team succeeds.
 */
export function shouldFailATeam(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("scenario") === "fail";
}
