import pytest
from pydantic import BaseModel

from app.graph.llm import structured_call


class _Dummy(BaseModel):
    value: str


class _FakeStructuredLLM:
    def __init__(self, fail_times: int):
        self.fail_times = fail_times
        self.calls = 0

    async def ainvoke(self, prompt: str) -> _Dummy:
        self.calls += 1
        if self.calls <= self.fail_times:
            raise ValueError("bad output")
        return _Dummy(value="ok")


class _FakeLLM:
    def __init__(self, fail_times: int):
        self._structured = _FakeStructuredLLM(fail_times)

    def with_structured_output(self, schema):
        return self._structured


async def test_structured_call_retries_once_then_succeeds():
    llm = _FakeLLM(fail_times=1)
    result = await structured_call(llm, _Dummy, "prompt")
    assert result.value == "ok"
    assert llm._structured.calls == 2


async def test_structured_call_raises_after_second_failure():
    llm = _FakeLLM(fail_times=2)
    with pytest.raises(ValueError):
        await structured_call(llm, _Dummy, "prompt")
    assert llm._structured.calls == 2
