"""MCP python sandbox server: restricted execution for analyst calculations
(market sizing arithmetic, MOAT score aggregation).

This deliberately does NOT use Python's "restricted builtins + exec/eval"
pattern: that pattern is a well-known non-boundary, since gadgets like
`().__class__.__bases__[0].__subclasses__()` reach arbitrary classes
(subprocess, file objects, ...) via attribute access alone, without ever
needing `import` or `open`. Instead this walks the submitted expression's
AST directly and evaluates a small, explicitly whitelisted numeric grammar
by hand — there is no `exec`/`eval` call on untrusted text anywhere, so
there is no restricted-Python escape surface to begin with: no attribute
access, no name resolution beyond a fixed function whitelist, no import
machinery reachable at all. The subprocess + hard timeout is kept as
defense in depth against pathological input (e.g. deeply nested
expressions stressing the parser), not as the security boundary itself."""

import ast
import math
import multiprocessing
import operator
import statistics

from mcp.server.fastmcp import FastMCP

from app.config import settings

mcp = FastMCP("python-sandbox")

_BIN_OPS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
}
_UNARY_OPS = {ast.UAdd: operator.pos, ast.USub: operator.neg}
_SAFE_FUNCTIONS = {
    "abs": abs,
    "min": min,
    "max": max,
    "round": round,
    "sum": sum,
    "len": len,
    "pow": pow,
    "sqrt": math.sqrt,
    "mean": statistics.mean,
}
_MAX_POWER_EXPONENT = 12  # guards against e.g. 9**9**9 blowing up compute/memory


class SandboxError(ValueError):
    pass


def _eval_node(node):
    if isinstance(node, ast.Expression):
        return _eval_node(node.body)
    if isinstance(node, ast.Constant):
        if isinstance(node.value, bool) or not isinstance(node.value, (int, float)):
            raise SandboxError(f"unsupported constant: {node.value!r}")
        return node.value
    if isinstance(node, ast.BinOp):
        op = _BIN_OPS.get(type(node.op))
        if op is None:
            raise SandboxError(f"operator not allowed: {type(node.op).__name__}")
        left, right = _eval_node(node.left), _eval_node(node.right)
        if isinstance(node.op, ast.Pow) and abs(right) > _MAX_POWER_EXPONENT:
            raise SandboxError("exponent too large")
        return op(left, right)
    if isinstance(node, ast.UnaryOp):
        op = _UNARY_OPS.get(type(node.op))
        if op is None:
            raise SandboxError(f"unary operator not allowed: {type(node.op).__name__}")
        return op(_eval_node(node.operand))
    if isinstance(node, ast.List):
        return [_eval_node(elt) for elt in node.elts]
    if isinstance(node, ast.Call):
        if not isinstance(node.func, ast.Name) or node.func.id not in _SAFE_FUNCTIONS:
            raise SandboxError("only calls to a fixed whitelist of math functions are allowed")
        if node.keywords:
            raise SandboxError("keyword arguments are not allowed")
        args = [_eval_node(arg) for arg in node.args]
        return _SAFE_FUNCTIONS[node.func.id](*args)
    raise SandboxError(f"expression type not allowed: {type(node).__name__}")


def _evaluate(expression: str):
    tree = ast.parse(expression, mode="eval")
    return _eval_node(tree)


def _run_in_subprocess(expression: str, queue: "multiprocessing.Queue") -> None:
    try:
        queue.put(("ok", _evaluate(expression)))
    except Exception as exc:
        queue.put(("error", str(exc)))


def run_sandboxed(expression: str, timeout_seconds: float | None = None) -> dict:
    """Evaluates `expression` — a single arithmetic expression, no
    assignments, statements, or imports — against a fixed whitelist
    grammar, in its own process so a hard timeout can kill pathological
    input rather than just give up waiting."""
    timeout_seconds = (
        timeout_seconds if timeout_seconds is not None else settings.sandbox_timeout_seconds
    )
    ctx = multiprocessing.get_context("spawn")
    queue = ctx.Queue()
    process = ctx.Process(target=_run_in_subprocess, args=(expression, queue))
    process.start()
    process.join(timeout_seconds)
    if process.is_alive():
        process.terminate()
        process.join()
        return {"status": "timeout", "result": None}
    status, result = (
        queue.get() if not queue.empty() else ("error", "sandbox produced no result")
    )
    return {"status": status, "result": result}


@mcp.tool()
def run_calculation(expression: str) -> dict:
    """Evaluate a restricted arithmetic expression for analyst calculations
    (market sizing arithmetic, MOAT score aggregation): numbers, the
    operators + - * / // % **, and calls to
    abs/min/max/round/sum/len/pow/sqrt/mean only — no variables, no
    imports, no statements. Returns {status: "ok"|"error"|"timeout", result}."""
    return run_sandboxed(expression)


if __name__ == "__main__":
    mcp.run()
