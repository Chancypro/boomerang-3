import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { WebSocket, WebSocketServer } from 'ws';
import { MAX_PLAYERS, SERVER_PORT, SERVER_TICK_RATE, WS_PATH } from '../../shared/constants.js';
import type { ClientToServerMessage, PlayerId, ServerToClientMessage } from '../../shared/protocol.js';
import { Room } from './Room.js';
import { serveStatic } from './staticFiles.js';

interface ClientConnection {
  socket: WebSocket;
  playerId: PlayerId | null;
  alive: boolean;
}

const port = Number(process.env.PORT ?? SERVER_PORT);
const distDir = resolve(process.cwd(), 'dist');
const room = new Room();
const clients = new Set<ClientConnection>();

const httpServer = createServer((req, res) => {
  if (req.url?.startsWith('/health')) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true, players: room.playerCount() }));
    return;
  }

  serveStatic(req, res, distDir);
});

const wss = new WebSocketServer({
  server: httpServer,
  path: WS_PATH
});

wss.on('connection', (socket) => {
  const client: ClientConnection = {
    socket,
    playerId: null,
    alive: true
  };

  clients.add(client);

  socket.on('message', (raw) => {
    const message = parseMessage(raw.toString());
    if (!message) {
      send(client, {
        type: 'error',
        code: 'bad_message',
        message: '消息格式错误'
      });
      return;
    }

    handleMessage(client, message);
  });

  socket.on('pong', () => {
    client.alive = true;
  });

  socket.on('close', () => {
    clients.delete(client);
    const result = room.leave(client.playerId);
    if (result.changed) {
      if (result.roundEnded) {
        broadcast({
          type: 'roundEnded',
          winnerId: result.winnerId,
          reason: 'disconnect',
          snapshot: room.snapshot()
        });
      }
      broadcastRoomSnapshot();
    }
  });
});

function handleMessage(client: ClientConnection, message: ClientToServerMessage): void {
  switch (message.type) {
    case 'join': {
      if (client.playerId) {
        send(client, { type: 'roomSnapshot', snapshot: room.snapshot() });
        return;
      }

      if (!room.acceptsJoins()) {
        send(client, {
          type: 'error',
          code: 'game_in_progress',
          message: '当前大局进行中，请等待本局结束后再加入'
        });
        client.socket.close(1000, 'game_in_progress');
        return;
      }

      const result = room.join(message.nickname);
      if (!result.ok || !result.playerId) {
        send(client, {
          type: 'error',
          code: 'room_full',
          message: `房间已满，最多 ${MAX_PLAYERS} 名玩家`
        });
        client.socket.close(1000, 'room_full');
        return;
      }

      client.playerId = result.playerId;
      send(client, {
        type: 'welcome',
        playerId: result.playerId,
        snapshot: room.snapshot()
      });

      broadcastRoomSnapshot();
      break;
    }
    case 'leave':
      client.socket.close(1000, 'leave');
      break;
    case 'input':
      room.setInput(client.playerId, message.input);
      break;
    case 'startGame':
      if (!client.playerId) {
        send(client, {
          type: 'error',
          code: 'not_joined',
          message: '未加入房间，不能开始游戏'
        });
        return;
      }
      if (room.startGame()) {
        broadcast({ type: 'roundStarted', snapshot: room.snapshot() });
      } else {
        broadcastRoomSnapshot();
      }
      break;
    case 'endGame':
      if (!client.playerId) {
        send(client, {
          type: 'error',
          code: 'not_joined',
          message: '未加入房间，不能结束游戏'
        });
        return;
      }
      room.endGame();
      broadcastRoomSnapshot();
      break;
    case 'ping':
      send(client, {
        type: 'pong',
        clientTime: message.clientTime,
        serverTime: Date.now()
      });
      break;
  }
}

function parseMessage(raw: string): ClientToServerMessage | null {
  try {
    const parsed = JSON.parse(raw) as ClientToServerMessage;
    if (!parsed || typeof parsed !== 'object' || typeof parsed.type !== 'string') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function send(client: ClientConnection, message: ServerToClientMessage): void {
  if (client.socket.readyState === WebSocket.OPEN) {
    client.socket.send(JSON.stringify(message));
  }
}

function broadcast(message: ServerToClientMessage): void {
  for (const client of clients) {
    send(client, message);
  }
}

function broadcastRoomSnapshot(): void {
  broadcast({
    type: 'roomSnapshot',
    snapshot: room.snapshot()
  });
}

setInterval(() => {
  room.step(1 / SERVER_TICK_RATE);
  broadcast({
    type: 'gameState',
    snapshot: room.snapshot()
  });
}, 1000 / SERVER_TICK_RATE);

setInterval(() => {
  for (const client of clients) {
    if (!client.alive) {
      client.socket.terminate();
      clients.delete(client);
      const result = room.leave(client.playerId);
      if (result.changed) {
        broadcastRoomSnapshot();
      }
      continue;
    }

    client.alive = false;
    client.socket.ping();
  }
}, 5000);

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`boomerang-2 server listening on http://0.0.0.0:${port}`);
});
