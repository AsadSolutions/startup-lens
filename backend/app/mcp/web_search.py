import json

from mcp.server.fastmcp import FastMCP
from tavily import TavilyClient

from app.config import settings

mcp = FastMCP("web-search")


def _format_results(tavily_response: dict) -> str:
    results = [
        {
            "title": r.get("title", ""),
            "url": r.get("url", ""),
            "content": r.get("content", ""),
            "published_date": r.get("published_date"),
        }
        for r in tavily_response.get("results", [])
    ]
    return json.dumps(results)


@mcp.tool()
def web_search(query: str, max_results: int = 5) -> str:
    """Search the web for query, return a JSON string: list of
    {title, url, content, published_date}."""
    client = TavilyClient(api_key=settings.tavily_api_key)
    response = client.search(query=query, max_results=max_results)
    return _format_results(response)


if __name__ == "__main__":
    mcp.run()
