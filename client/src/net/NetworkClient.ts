import { SERVER_PORT, WS_PATH } from '../../../shared/constants';
import type {
  ClientToServerMessage,
  GameSnapshot,
  PlayerId,
  ServerToClientMessage
} from '../../../shared/protocol';

export interface NetworkClientEvents {
  onOpen: () => void;
  onClose: () => void;
  onError: (message: string) => void;
  onWelcome: (playerId: PlayerId, snapshot: GameSnapshot) => void;
  onSnapshot: (snapshot: GameSnapshot) => void;
}

export class NetworkClient {
  private socket: WebSocket | null = null;
  private reconnectTimer = 0;

  playerId: PlayerId | null = null;

  constructor(private readonly events: NetworkClientEvents) {}

  connect(): void {
    const url = this.createUrl();
    this.socket = new WebSocket(url);

    this.socket.addEventListener('open', () => {
      this.events.onOpen();
      this.send({ type: 'join', nickname: 'player' });
    });

    this.socket.addEventListener('message', (event) => {
      this.handleMessage(event.data);
    });

    this.socket.addEventListener('error', () => {
      this.events.onError('连接失败，请确认服务端已启动');
    });

    this.socket.addEventListener('close', () => {
      this.playerId = null;
      this.events.onClose();
      this.scheduleReconnect();
    });
  }

  send(message: ClientToServerMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  private handleMessage(raw: unknown): void {
    let message: ServerToClientMessage;
    try {
      message = JSON.parse(String(raw)) as ServerToClientMessage;
    } catch {
      return;
    }

    switch (message.type) {
      case 'welcome':
        this.playerId = message.playerId;
        this.events.onWelcome(message.playerId, message.snapshot);
        break;
      case 'roomSnapshot':
      case 'gameState':
      case 'roundStarted':
      case 'roundEnded':
      case 'matchEnded':
        this.events.onSnapshot(message.snapshot);
        break;
      case 'pong':
        break;
      case 'error':
        this.events.onError(message.message);
        break;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = 0;
      this.connect();
    }, 1200);
  }

  private createUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname || 'localhost';
    const port = window.location.port === '5173' ? String(SERVER_PORT) : window.location.port || String(SERVER_PORT);
    return `${protocol}//${host}:${port}${WS_PATH}`;
  }
}
