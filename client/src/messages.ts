export type Point = { x: number, y: number };

export type StrokeMessage = {
  type: "stroke";
  points: Point[];
  color: string;
  width: number;
};

export type HistoryMessage = {
  type: "history";
  strokes: StrokeMessage[];
};

export type ClearMessage = { type: "clear" };
export type ClientMessage = StrokeMessage | ClearMessage;
export type ServerMessage = StrokeMessage | HistoryMessage | ClearMessage;

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
    Array.isArray(m.points) && m.points.length >= 2 && m.points.every(isPoint) &&
    typeof m.color === "string" && typeof m.width === "number"
  );
}

function isClearMessage(v: unknown): v is ClearMessage {
  return typeof v === "object" && v !== null && (v as Record<string, unknown>).type === "clear";
}

export function parseClientMessage(raw: string): ClientMessage | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (isStrokeMessage(parsed)) return parsed;
  if (isClearMessage(parsed)) return { type: "clear" };
  return null;
}

function isHistoryMessage(v: unknown): v is HistoryMessage {
  if (typeof v !== "object" || v === null) return false;
  const m = v as Record<string, unknown>;
  return m.type === "history" && Array.isArray(m.strokes) && m.strokes.every(isStrokeMessage);
}

export function parseServerMessage(raw: string): ServerMessage | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (isStrokeMessage(parsed)) return parsed;
  if (isHistoryMessage(parsed)) return parsed;
  if (isClearMessage(parsed)) return { type: "clear" };
  return null;
}
