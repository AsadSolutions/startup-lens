import type { RunEvent } from "./types";

/**
 * `/api/validate` streams SSE over a POST response, so the browser's
 * `EventSource` (GET-only) can't consume it. This reads the fetch response
 * body as a stream, splits it into `\n\n`-delimited SSE blocks, and parses
 * each block's `data:` payload as a typed `RunEvent`.
 */
export async function* parseSSEStream(response: Response): AsyncGenerator<RunEvent> {
  if (!response.body) {
    throw new Error("SSE response has no readable body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let separatorIndex = buffer.indexOf("\n\n");
      while (separatorIndex !== -1) {
        const block = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + 2);
        const event = parseEventBlock(block);
        if (event) yield event;
        separatorIndex = buffer.indexOf("\n\n");
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function parseEventBlock(block: string): RunEvent | null {
  const dataLines = block
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim());

  if (dataLines.length === 0) return null;

  return JSON.parse(dataLines.join("\n")) as RunEvent;
}
