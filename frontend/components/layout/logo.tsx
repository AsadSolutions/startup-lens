export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 660 160"
      role="img"
      aria-label="StartupLens"
      className={className}
    >
      <svg x="0" y="0" width="160" height="160" viewBox="0 0 512 512">
        <g className="stroke-accent" fill="none" strokeLinecap="round">
          <circle cx="228" cy="228" r="126" strokeWidth="34" />
          <line x1="318" y1="318" x2="410" y2="410" strokeWidth="42" />
        </g>
        <g className="stroke-accent" strokeWidth="26" strokeLinecap="round">
          <line x1="172" y1="272" x2="172" y2="236" />
          <line x1="200" y1="272" x2="200" y2="196" />
          <line x1="228" y1="272" x2="228" y2="164" />
          <line x1="256" y1="272" x2="256" y2="212" />
          <line x1="284" y1="272" x2="284" y2="184" />
        </g>
      </svg>
      <text
        x="190"
        y="103"
        textAnchor="start"
        className="fill-text font-serif"
        fontSize="72"
        fontWeight="600"
        letterSpacing="-1"
      >
        Startup
        <tspan className="fill-accent">Lens</tspan>
      </text>
    </svg>
  );
}
