export type Point = { x: number, y: number };

export type StrokeMessage = {
  type: "stroke";
  from: Point;
  to: Point;
  color: string;
  width: number;
}

export type ClientMessage = StrokeMessage;
