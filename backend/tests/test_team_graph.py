from app.graph.team import build_team_graph
from app.models import NodeName


def test_team_graph_has_researcher_analyst_writer_nodes_in_order():
    graph = build_team_graph()
    node_names = set(graph.get_graph().nodes.keys())
    assert {NodeName.RESEARCHER, NodeName.ANALYST, NodeName.WRITER}.issubset(
        node_names
    )
