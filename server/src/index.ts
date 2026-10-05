import { WebSocketServer, WebSocket } from "ws";
import { parseClientMessage } from "./messages.js";

const PORT = 8080;

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (ws) => {
  console.log("[connected] client connected. total:", wss.clients.size);

  ws.on("message", (data) => {
    const message = parseClientMessage(data.toString());
    if (!message) {
      console.warn("[invalid message] discarded:", data.toString());
      return;
    }
    console.log("[message]", message);

    for (const client of wss.clients) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    }
  });

  ws.on("close", () => {
    console.log("[disconnected] client left. total:", wss.clients.size);
  });

  ws.on("error", (err) => {
    console.error("[error]", err);
  });
});

console.log(`WebSocket server listening on ws://localhost:${PORT}`);
