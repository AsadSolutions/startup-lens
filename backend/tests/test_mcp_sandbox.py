from app.mcp.sandbox import run_sandboxed


def test_sandbox_evaluates_an_arithmetic_expression():
    response = run_sandboxed("4_200_000 * 0.15")
    assert response["status"] == "ok"
    assert response["result"] == 630_000.0


def test_sandbox_supports_whitelisted_aggregation_functions():
    response = run_sandboxed("mean([3, 4, 5])")
    assert response["status"] == "ok"
    assert response["result"] == 4.0


def test_sandbox_rejects_names_outside_the_function_whitelist():
    response = run_sandboxed("open('/etc/passwd').read()")
    assert response["status"] == "error"


def test_sandbox_rejects_import_style_input_entirely():
    # "import" is a statement, not an expression, so ast.parse(mode="eval")
    # rejects it outright — there is no exec/eval of the submitted text for
    # an import statement to ever reach.
    response = run_sandboxed("__import__('socket')")
    assert response["status"] == "error"
    assert "whitelist" in response["result"]


def test_sandbox_blocks_the_classic_object_subclasses_escape_gadget():
    # The canonical restricted-exec escape: reach arbitrary classes via
    # attribute access alone, without needing import or open. Attribute
    # access isn't a node type this evaluator handles at all, so it's
    # rejected structurally rather than pattern-matched away.
    response = run_sandboxed("().__class__.__bases__[0].__subclasses__()")
    assert response["status"] == "error"


def test_sandbox_rejects_pathologically_large_exponents():
    response = run_sandboxed("9 ** 9 ** 9")
    assert response["status"] == "error"
    assert "exponent" in response["result"]


def test_sandbox_enforces_a_hard_timeout():
    # A timeout too small for the subprocess to even start guarantees the
    # kill path runs, deterministically exercising it regardless of how
    # fast the (deliberately bounded) evaluator itself is.
    response = run_sandboxed("1 + 1", timeout_seconds=0.0001)
    assert response["status"] == "timeout"
