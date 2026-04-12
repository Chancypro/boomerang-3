import {
  ARENA_HEIGHT,
  ARENA_WIDTH,
  BOOMERANG_HAND_DISTANCE,
  BOOMERANG_RADIUS,
  PLAYER_RADIUS,
  ROUND_END_DELAY_MS,
  WALL_CORNER_RADIUS
} from '../../../shared/constants';
import type { GameSnapshot, PlayerId, Vec2 } from '../../../shared/protocol';

const PLAYER_COLORS: Record<PlayerId, string> = {
  1: '#4fd1c5',
  2: '#93c5fd',
  3: '#facc15',
  4: '#fb7185',
  5: '#a78bfa',
  6: '#86efac'
};

const BOOMERANG_COLORS: Record<PlayerId, string> = {
  1: '#2dd4bf',
  2: '#60a5fa',
  3: '#eab308',
  4: '#f43f5e',
  5: '#8b5cf6',
  6: '#22c55e'
};

const SHATTER_EXPAND_MS = 520;
const SHATTER_FADE_START_MS = 220;
const SHATTER_TOTAL_MS = 1400;

export class SceneRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly displayPositions = new Map<PlayerId, Vec2>();

  constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context unavailable');
    }

    this.ctx = context;
    this.canvas.width = ARENA_WIDTH;
    this.canvas.height = ARENA_HEIGHT;
  }

  draw(snapshot: GameSnapshot | null, localPlayerId: PlayerId | null): void {
    this.drawMap();

    if (!snapshot) {
      this.drawCenterText('等待服务器快照...');
      return;
    }

    for (const obstacle of snapshot.obstacles) {
      this.ctx.fillStyle = '#d8edf2';
      this.ctx.strokeStyle = '#6eaab6';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.roundRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, WALL_CORNER_RADIUS);
      this.ctx.fill();
      this.ctx.stroke();
    }

    for (const boomerang of snapshot.boomerangs) {
      if (boomerang.state === 'held' || boomerang.state === 'charging') {
        continue;
      }

      const owner = snapshot.players.find((player) => player.id === boomerang.ownerId);
      const ownerColor = BOOMERANG_COLORS[boomerang.ownerId];
      const flashing = boomerang.bounceFlashUntil > snapshot.serverTime;
      this.drawBoomerang(
        boomerang.position,
        ownerColor,
        boomerang.state,
        boomerang.flightPhase,
        boomerang.velocity,
        owner?.aim ?? { x: 1, y: 0 },
        boomerang.spinRadians,
        flashing
      );
    }

    for (const player of snapshot.players) {
      const isLocal = player.id === localPlayerId;
      const displayPosition = this.smoothedPosition(player.id, player.position);
      if (!player.alive) {
        this.drawShatter(displayPosition, PLAYER_COLORS[player.id], snapshot.serverTime, player.defeatedAt, player.id);
        continue;
      }

      this.ctx.globalAlpha = player.alive ? 1 : 0.35;
      this.ctx.fillStyle = PLAYER_COLORS[player.id];
      this.ctx.strokeStyle = isLocal ? '#e9fbff' : '#173b42';
      this.ctx.lineWidth = isLocal ? 4 : 2;
      this.ctx.beginPath();
      this.ctx.arc(displayPosition.x, displayPosition.y, PLAYER_RADIUS, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.fillStyle = '#102326';
      this.ctx.font = '800 14px system-ui, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(`P${player.id}`, displayPosition.x, displayPosition.y);

      if (player.alive && (player.boomerangState === 'held' || player.boomerangState === 'charging')) {
        const handPosition = {
          x: displayPosition.x + player.aim.x * BOOMERANG_HAND_DISTANCE,
          y: displayPosition.y + player.aim.y * BOOMERANG_HAND_DISTANCE
        };
        this.drawBoomerang(
          handPosition,
          BOOMERANG_COLORS[player.id],
          player.boomerangState,
          'held',
          { x: 0, y: 0 },
          player.aim,
          0,
          false
        );
      }

      if (player.alive && player.boomerangState === 'charging') {
        const boomerang = snapshot.boomerangs.find((item) => item.ownerId === player.id);
        this.drawChargeRing(displayPosition.x, displayPosition.y, boomerang?.chargeRatio ?? 0);
      }
      this.ctx.globalAlpha = 1;
    }

    if (snapshot.phase === 'waiting') {
      this.drawCenterText('等待至少 2 名玩家加入');
    } else if (snapshot.phase === 'roundEnded') {
      this.drawCenterText(`P${snapshot.roundWinnerId ?? '?'} 赢下小局`);
    } else if (snapshot.phase === 'matchEnded') {
      this.drawCenterText(`P${snapshot.matchWinnerId ?? '?'} 获胜`);
    }
  }

  private drawMap(): void {
    this.ctx.fillStyle = '#10191d';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.strokeStyle = '#1f373d';
    this.ctx.lineWidth = 1;
    for (let x = 0; x <= this.canvas.width; x += 48) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = 0; y <= this.canvas.height; y += 48) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }

    this.ctx.strokeStyle = '#7bb9c5';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(2, 2, this.canvas.width - 4, this.canvas.height - 4);
  }

  private drawCenterText(text: string): void {
    this.ctx.fillStyle = 'rgb(9 21 25 / 58%)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#e9fbff';
    this.ctx.font = '800 34px system-ui, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);
  }

  private drawBoomerang(
    position: Vec2,
    color: string,
    state: string,
    flightPhase: string,
    velocity: Vec2,
    aim: Vec2,
    spinRadians: number,
    flashing: boolean
  ): void {
    this.ctx.save();
    this.ctx.translate(position.x, position.y);
    const moving = Math.hypot(velocity.x, velocity.y) > 1;
    const direction = state === 'grounded' ? spinRadians : moving ? Math.atan2(velocity.y, velocity.x) : Math.atan2(aim.y, aim.x);
    const spin = state === 'flying_returning' || state === 'flying_bouncing' ? spinRadians : 0;
    this.ctx.rotate(direction + spin);

    if (state === 'grounded') {
      this.ctx.strokeStyle = '#8aa7ad';
      this.ctx.lineWidth = 4;
      this.drawBoomerangPolyline(0.85);
      this.ctx.restore();
      return;
    }

    this.ctx.strokeStyle = flashing ? '#f7feff' : color;
    this.ctx.lineWidth = state === 'charging' ? 5 : 4;
    this.drawBoomerangPolyline(state === 'charging' ? 1.12 : 1);
    this.ctx.restore();
  }

  private drawBoomerangPolyline(scale: number): void {
    const armLength = 26 * scale;
    const upperAngle = (Math.PI * 2) / 3;
    const lowerAngle = (Math.PI * 4) / 3;

    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(Math.cos(upperAngle) * armLength, Math.sin(upperAngle) * armLength);
    this.ctx.lineTo(0, 0);
    this.ctx.lineTo(Math.cos(lowerAngle) * armLength, Math.sin(lowerAngle) * armLength);
    this.ctx.stroke();
  }

  private drawShatter(position: Vec2, color: string, serverTime: number, defeatedAt: number | null, playerId: PlayerId): void {
    const elapsedMs = defeatedAt ? Math.max(0, serverTime - defeatedAt) : ROUND_END_DELAY_MS;
    if (elapsedMs >= SHATTER_TOTAL_MS) {
      return;
    }

    const t = Math.min(1, elapsedMs / SHATTER_EXPAND_MS);
    const fadeT = Math.max(0, Math.min(1, (elapsedMs - SHATTER_FADE_START_MS) / (SHATTER_TOTAL_MS - SHATTER_FADE_START_MS)));
    this.ctx.save();
    this.ctx.globalAlpha = 1 - fadeT;
    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = '#e9fbff';
    this.ctx.lineWidth = 1.5;

    for (let i = 0; i < 11; i += 1) {
      const angle = (i / 11) * Math.PI * 2 + playerId * 0.45;
      const distance = 8 + i * 1.4 + t * 28;
      const x = position.x + Math.cos(angle) * distance;
      const y = position.y + Math.sin(angle) * distance;
      const size = 4 + (i % 3) * 2;

      this.ctx.beginPath();
      this.ctx.moveTo(x, y - size);
      this.ctx.lineTo(x + size * 0.85, y + size * 0.5);
      this.ctx.lineTo(x - size * 0.85, y + size * 0.5);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  private drawChargeRing(x: number, y: number, ratio: number): void {
    const radius = PLAYER_RADIUS + 9;
    const clamped = Math.max(0, Math.min(1, ratio));

    this.ctx.lineWidth = 5;
    this.ctx.strokeStyle = 'rgb(148 163 184 / 28%)';
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.strokeStyle = 'rgb(203 213 225 / 72%)';
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamped);
    this.ctx.stroke();
  }

  private smoothedPosition(id: PlayerId, target: Vec2): Vec2 {
    const current = this.displayPositions.get(id);
    if (!current) {
      const initial = { ...target };
      this.displayPositions.set(id, initial);
      return initial;
    }

    const distance = Math.hypot(target.x - current.x, target.y - current.y);
    if (distance > 90) {
      current.x = target.x;
      current.y = target.y;
      return current;
    }

    current.x += (target.x - current.x) * 0.28;
    current.y += (target.y - current.y) * 0.28;
    return current;
  }
}
