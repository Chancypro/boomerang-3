import './styles.css';
import { INPUT_SEND_RATE } from '../../shared/constants';
import type { GameSnapshot } from '../../shared/protocol';
import { GameLoop } from './game/GameLoop';
import { InputController } from './input/InputController';
import { NetworkClient } from './net/NetworkClient';
import { SceneRenderer } from './render/SceneRenderer';
import { Hud } from './ui/Hud';

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
const connectionStatus = document.querySelector<HTMLElement>('#connection-status');
const roomStatus = document.querySelector<HTMLElement>('#room-status');
const scoreStatus = document.querySelector<HTMLElement>('#score-status');
const roundStatus = document.querySelector<HTMLElement>('#round-status');
const gameActionButton = document.querySelector<HTMLButtonElement>('#game-action-button');

if (!canvas || !connectionStatus || !roomStatus || !scoreStatus || !roundStatus || !gameActionButton) {
  throw new Error('Missing app DOM nodes');
}

const input = new InputController(canvas);
const renderer = new SceneRenderer(canvas);
const hud = new Hud(connectionStatus, roomStatus, scoreStatus, roundStatus, gameActionButton);

let latestSnapshot: GameSnapshot | null = null;
let lastInputAt = 0;

const network = new NetworkClient({
  onOpen: () => hud.setConnection('已连接服务器，正在加入房间...'),
  onClose: () => hud.setConnection('连接断开，正在自动重连...'),
  onError: (message) => hud.setConnection(message),
  onWelcome: (playerId, snapshot) => {
    latestSnapshot = snapshot;
    hud.setConnection(`已加入房间：玩家 ${playerId}`);
    hud.setSnapshot(snapshot, playerId);
  },
  onSnapshot: (snapshot) => {
    latestSnapshot = snapshot;
    hud.setSnapshot(snapshot, network.playerId);
  }
});

network.connect();
hud.onGameAction((action) => {
  network.send({ type: action });
});

const loop = new GameLoop({
  update: (_dt, now) => {
    if (now - lastInputAt >= 1000 / INPUT_SEND_RATE) {
      const localPlayer = latestSnapshot?.players.find((player) => player.id === network.playerId);
      network.send({ type: 'input', input: input.snapshot(localPlayer?.position ?? null) });
      lastInputAt = now;
    }

  },
  render: () => {
    renderer.draw(latestSnapshot, network.playerId);
  }
});

loop.start();
