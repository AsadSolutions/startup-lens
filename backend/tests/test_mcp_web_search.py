import json

from app.mcp.web_search import _format_results


def test_format_results_shapes_tavily_response():
    tavily_response = {
        "results": [
            {
                "title": "Vintage Synth Market Report",
                "url": "https://example.com/report",
                "content": "The market is growing.",
                "published_date": "2026-01-15",
            }
        ]
    }
    formatted = json.loads(_format_results(tavily_response))
    assert formatted == [
        {
            "title": "Vintage Synth Market Report",
            "url": "https://example.com/report",
            "content": "The market is growing.",
            "published_date": "2026-01-15",
        }
    ]


def test_format_results_handles_missing_fields():
    formatted = json.loads(_format_results({"results": [{}]}))
    assert formatted == [
        {"title": "", "url": "", "content": "", "published_date": None}
    ]
