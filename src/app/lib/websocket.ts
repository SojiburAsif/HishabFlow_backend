import type { IncomingMessage, Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

type ClientContext = {
  userId?: string;
  role?: string;
  shopId?: string;
};

type NotificationEvent = {
  type: string;
  subject: string;
  message: string;
  data?: Record<string, any>;
  recipientUserId?: string;
  recipientRole?: string;
  createdAt: string;
};

type ExtendedSocket = WebSocket & {
  context?: ClientContext;
  isAlive?: boolean;
};

let socketServer: WebSocketServer | null = null;
const clients = new Set<ExtendedSocket>();

const parseContext = (request: IncomingMessage): ClientContext => {
  const host = request.headers.host || "localhost";
  const url = new URL(request.url || "/", `http://${host}`);

  return {
    userId: url.searchParams.get("userId") || undefined,
    role: url.searchParams.get("role") || undefined,
    shopId: url.searchParams.get("shopId") || undefined,
  };
};

const initializeWebSocketServer = (server: HttpServer) => {
  if (socketServer) {
    return socketServer;
  }

  socketServer = new WebSocketServer({ server, path: "/api/v1/ws" });

  socketServer.on("connection", (socket: ExtendedSocket, request) => {
    socket.context = parseContext(request);
    socket.isAlive = true;
    clients.add(socket);

    socket.send(JSON.stringify({
      type: "connected",
      createdAt: new Date().toISOString(),
      data: socket.context,
    }));

    socket.on("pong", () => {
      socket.isAlive = true;
    });

    socket.on("close", () => {
      clients.delete(socket);
    });

    socket.on("error", () => {
      clients.delete(socket);
    });
  });

  const heartbeat = setInterval(() => {
    for (const client of clients) {
      if (client.isAlive === false) {
        clients.delete(client);
        client.terminate();
        continue;
      }

      client.isAlive = false;
      client.ping();
    }
  }, 30000);

  socketServer.on("close", () => {
    clearInterval(heartbeat);
  });

  return socketServer;
};

const safeSend = (socket: ExtendedSocket, payload: NotificationEvent) => {
  if (socket.readyState !== WebSocket.OPEN) {
    return;
  }

  socket.send(JSON.stringify(payload));
};

const emit = (payload: NotificationEvent, predicate: (context?: ClientContext) => boolean) => {
  for (const socket of clients) {
    if (predicate(socket.context)) {
      safeSend(socket, payload);
    }
  }
};

const emitToUser = (userId: string, payload: Omit<NotificationEvent, "createdAt">) => {
  emit({ ...payload, createdAt: new Date().toISOString() }, (context) => context?.userId === userId);
};

const emitToRole = (role: string, payload: Omit<NotificationEvent, "createdAt">) => {
  emit({ ...payload, createdAt: new Date().toISOString() }, (context) => context?.role === role);
};

const broadcast = (payload: Omit<NotificationEvent, "createdAt">) => {
  emit({ ...payload, createdAt: new Date().toISOString() }, () => true);
};

export const WebSocketHub = {
  initializeWebSocketServer,
  emitToUser,
  emitToRole,
  broadcast,
};