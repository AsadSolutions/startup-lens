from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver


def get_checkpointer(db_path: str = "checkpoints.sqlite"):
    """SQLite (local) / Postgres (prod) LangGraph checkpointer: saves RunState at every orchestrator node boundary so a crashed run
    resumes from its last checkpoint instead of re-running completed teams.
    Returns an async context manager: `async with get_checkpointer() as cp:`.
    """
    return AsyncSqliteSaver.from_conn_string(db_path)
