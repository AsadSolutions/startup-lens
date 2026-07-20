import asyncio
import json

from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_core.tools import BaseTool

MCP_SERVERS = {
    "web_search": {
        "command": "python",
        "args": ["-m", "app.mcp.web_search"],
        "transport": "stdio",
    }
}

_web_search_tool: BaseTool | None = None
_tool_lock = asyncio.Lock()


async def _get_web_search_tool() -> BaseTool:
    # Cached after the first call: each get_tools() call spawns a fresh MCP
    # server subprocess and re-runs the tool-discovery handshake, which is
    # wasted work once 5 teams are calling this concurrently in Phase 2.
    global _web_search_tool
    if _web_search_tool is not None:
        return _web_search_tool
    async with _tool_lock:
        if _web_search_tool is None:
            client = MultiServerMCPClient(MCP_SERVERS)
            tools = await client.get_tools()
            _web_search_tool = next(t for t in tools if t.name == "web_search")
    return _web_search_tool


async def web_search(query: str, max_results: int = 5) -> list[dict]:
    """The only entry point agents use for live internet access (CLAUDE.md rule 6)."""
    tool = await _get_web_search_tool()
    raw = await tool.ainvoke({"query": query, "max_results": max_results})
    # langchain-mcp-adapters (0.3.0) returns a list of LangChain content
    # blocks (e.g. [{"type": "text", "text": "<json>"}]), not a bare string.
    if isinstance(raw, list):
        text = "".join(
            block["text"]
            for block in raw
            if isinstance(block, dict) and block.get("type") == "text"
        )
    else:
        text = raw
    return json.loads(text)
