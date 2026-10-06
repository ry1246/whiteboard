import { useEffect, useRef, useState } from "react";
import "./App.css";
import { type Point, type StrokeMessage, parseClientMessage } from "./messages";

const WS_URL = "ws://localhost:8080";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPointRef = useRef<Point | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const pendingPointsRef = useRef<Point[]>([]);
  const rafIdRef = useRef<number | null>(null);

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const drawLine = (from: Point, to: Point, color: string, width: number) => {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.lineCap = "round";
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.stroke();
  };

  const drawPolyline = (points: Point[], color: string, width: number) => {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.stroke();
  };

  const flushPending = () => {
    const points = pendingPointsRef.current;
    if (points.length >= 2 && wsRef.current?.readyState === WebSocket.OPEN) {
      const message: StrokeMessage = {
        type: "stroke",
        points,
        color: "#000000",
        width: 2,
      };
      wsRef.current.send(JSON.stringify(message));
    }
    pendingPointsRef.current = points.length > 0 ? [points[points.length - 1]] : [];
  };

  const scheduleFlush = () => {
    if (rafIdRef.current !== null) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      flushPending();
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const point = getCanvasPoint(e);
    lastPointRef.current = point;
    pendingPointsRef.current = [point];
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPointRef.current) return;

    const point = getCanvasPoint(e);
    const from = lastPointRef.current;

    drawLine(from, point, "#000000", 2);

    pendingPointsRef.current.push(point);
    scheduleFlush();

    lastPointRef.current = point;

  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    lastPointRef.current = null;

    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    flushPending();
    pendingPointsRef.current = [];
  };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const dpr = window.devicePixelRatio || 1;
    const width = 800;
    const height = 600;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
  }, []);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const message = parseClientMessage(event.data);
      if (!message) return;
      drawPolyline(message.points, message.color, message.width);
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ border: "1px solid #ccc", touchAction: "none" }}
    />
  );
}

export default App;
