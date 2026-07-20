"""MCP python sandbox server: restricted execution for analyst calculations
(market sizing arithmetic, MOAT score aggregation). No network, no
filesystem writes outside a temp dir, hard timeout.
Implemented in Roadmap Phase 3."""

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("python-sandbox")


@mcp.tool()
def run_calculation(expression: str) -> str:
    """Evaluate a restricted arithmetic expression. Implemented in Phase 3."""
    raise NotImplementedError("python sandbox lands in Roadmap Phase 3")


if __name__ == "__main__":
    mcp.run()
