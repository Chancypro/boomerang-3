import { ARENA_HEIGHT, ARENA_WIDTH, MAX_PLAYERS, SCORE_TO_WIN } from './constants.js';

export type PlayerId = 1 | 2 | 3 | 4 | 5 | 6;

export type RoomPhase = 'waiting' | 'playing' | 'roundEnded' | 'matchEnded';
export type BoomerangState = 'held' | 'charging' | 'flying_returning' | 'flying_bouncing' | 'grounded' | 'cooldown';
export type BoomerangFlightPhase = 'held' | 'homing' | 'bouncing' | 'grounded' | 'cooldown';

export interface Vec2 {
  x: number;
  y: number;
}

export interface PlayerInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  throwPressed: boolean;
  aim: Vec2;
  seq: number;
}

export interface JoinRoomMessage {
  type: 'join';
  nickname?: string;
}

export interface LeaveRoomMessage {
  type: 'leave';
}

export interface PlayerInputMessage {
  type: 'input';
  input: PlayerInput;
}

export interface StartGameMessage {
  type: 'startGame';
}

export interface EndGameMessage {
  type: 'endGame';
}

export interface PingMessage {
  type: 'ping';
  clientTime: number;
}

export type ClientToServerMessage =
  | JoinRoomMessage
  | LeaveRoomMessage
  | PlayerInputMessage
  | StartGameMessage
  | EndGameMessage
  | PingMessage;

export interface PlayerSnapshot {
  id: PlayerId;
  connected: boolean;
  nickname: string;
  position: Vec2;
  velocity: Vec2;
  aim: Vec2;
  alive: boolean;
  defeatedAt: number | null;
  score: number;
  hasBoomerang: boolean;
  boomerangState: BoomerangState;
  lastInputSeq: number;
}

export interface ObstacleSnapshot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BoomerangSnapshot {
  ownerId: PlayerId;
  state: BoomerangState;
  flightPhase: BoomerangFlightPhase;
  returning: boolean;
  active: boolean;
  grounded: boolean;
  position: Vec2;
  velocity: Vec2;
  chargeRatio: number;
  spinRadians: number;
  bounceFlashUntil: number;
}

export interface GameSnapshot {
  tick: number;
  serverTime: number;
  phase: RoomPhase;
  maxPlayers: number;
  roundNumber: number;
  roundWinnerId: PlayerId | null;
  matchWinnerId: PlayerId | null;
  phaseEndsAt: number | null;
  scoreToWin: number;
  arena: {
    width: number;
    height: number;
  };
  players: PlayerSnapshot[];
  obstacles: ObstacleSnapshot[];
  boomerangs: BoomerangSnapshot[];
}

export interface WelcomeMessage {
  type: 'welcome';
  playerId: PlayerId;
  snapshot: GameSnapshot;
}

export interface RoomSnapshotMessage {
  type: 'roomSnapshot';
  snapshot: GameSnapshot;
}

export interface GameStateSnapshotMessage {
  type: 'gameState';
  snapshot: GameSnapshot;
}

export interface RoundStartedMessage {
  type: 'roundStarted';
  snapshot: GameSnapshot;
}

export interface RoundEndedMessage {
  type: 'roundEnded';
  winnerId: PlayerId | null;
  reason: 'hit' | 'disconnect' | 'manual';
  snapshot: GameSnapshot;
}

export interface MatchEndedMessage {
  type: 'matchEnded';
  winnerId: PlayerId | null;
  snapshot: GameSnapshot;
}

export interface PongMessage {
  type: 'pong';
  clientTime: number;
  serverTime: number;
}

export interface ErrorMessage {
  type: 'error';
  code: 'room_full' | 'game_in_progress' | 'bad_message' | 'not_joined' | 'server_error';
  message: string;
}

export type ServerToClientMessage =
  | WelcomeMessage
  | RoomSnapshotMessage
  | GameStateSnapshotMessage
  | RoundStartedMessage
  | RoundEndedMessage
  | MatchEndedMessage
  | PongMessage
  | ErrorMessage;

export function createEmptySnapshot(): GameSnapshot {
  return {
    tick: 0,
    serverTime: Date.now(),
    phase: 'waiting',
    maxPlayers: MAX_PLAYERS,
    roundNumber: 0,
    roundWinnerId: null,
    matchWinnerId: null,
    phaseEndsAt: null,
    scoreToWin: SCORE_TO_WIN,
    arena: {
      width: ARENA_WIDTH,
      height: ARENA_HEIGHT
    },
    players: [],
    obstacles: [],
    boomerangs: []
  };
}
