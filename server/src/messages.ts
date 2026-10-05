export type Point = { x: number, y: number };

export type StrokeMessage = {
  type: "stroke";
  from: Point;
  to: Point;
  color: string;
  width: number;
}

export type ClientMessage = StrokeMessage;

function isPoint(v: unknown): v is Point {
  return (
    typeof v === "object" && v !== null &&
    typeof (v as Record<string, unknown>).x === "number" &&
    typeof (v as Record<string, unknown>).y === "number"
  );
}

function isStrokeMessage(v: unknown): v is StrokeMessage {
  if (typeof v !== "object" || v === null) return false;
  const m = v as Record<string, unknown>;
  return (
    m.type === "stroke" &&
    isPoint(m.from) && isPoint(m.to) &&
    typeof m.color === "string" && typeof m.width === "number"
  );
}

export function parseClientMessage(raw: string): ClientMessage | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  return isStrokeMessage(parsed) ? parsed : null;
}
