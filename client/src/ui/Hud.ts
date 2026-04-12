import type { GameSnapshot, PlayerId } from '../../../shared/protocol';

type GameAction = 'startGame' | 'endGame';

export class Hud {
  private action: GameAction | null = null;

  constructor(
    private readonly connectionStatus: HTMLElement,
    private readonly roomStatus: HTMLElement,
    private readonly scoreStatus: HTMLElement,
    private readonly roundStatus: HTMLElement,
    private readonly gameActionButton: HTMLButtonElement
  ) {}

  setConnection(text: string): void {
    this.connectionStatus.textContent = text;
  }

  setSnapshot(snapshot: GameSnapshot | null, localPlayerId: PlayerId | null): void {
    if (!snapshot) {
      this.roomStatus.textContent = '房间 0/6';
      this.scoreStatus.textContent = '比分等待同步';
      this.roundStatus.textContent = '等待服务器';
      this.setAction(null);
      return;
    }

    const playerLabel = localPlayerId ? `你是 P${localPlayerId}` : '未入房';
    this.roomStatus.textContent = `${playerLabel} | 房间 ${snapshot.players.length}/${snapshot.maxPlayers}`;

    this.scoreStatus.textContent = this.describeScores(snapshot);
    this.roundStatus.textContent = this.describeRound(snapshot);
    this.updateAction(snapshot);
  }

  onGameAction(handler: (action: GameAction) => void): void {
    this.gameActionButton.addEventListener('click', () => {
      if (this.action) {
        handler(this.action);
      }
    });
  }

  private describeRound(snapshot: GameSnapshot): string {
    if (snapshot.phase === 'waiting') {
      return '等待至少 2 名玩家';
    }
    if (snapshot.phase === 'playing') {
      return `第 ${snapshot.roundNumber} 小局 | 先到 ${snapshot.scoreToWin} 分`;
    }
    if (snapshot.phase === 'roundEnded') {
      return `P${snapshot.roundWinnerId ?? '?'} 赢下小局，准备下一小局`;
    }
    if (snapshot.phase === 'matchEnded') {
      return `P${snapshot.matchWinnerId ?? '?'} 获胜`;
    }
    return '同步中';
  }

  private updateAction(snapshot: GameSnapshot): void {
    if (snapshot.phase === 'waiting' || snapshot.phase === 'matchEnded') {
      this.setAction('startGame', snapshot.players.length < 2);
      return;
    }

    this.setAction('endGame', false);
  }

  private setAction(action: GameAction | null, disabled = false): void {
    this.action = action;
    this.gameActionButton.hidden = action === null;
    this.gameActionButton.disabled = disabled;
    if (action === 'startGame') {
      this.gameActionButton.textContent = disabled ? '等待玩家加入' : '开始游戏';
    } else if (action === 'endGame') {
      this.gameActionButton.textContent = '结束游戏';
    }
  }

  private describeScores(snapshot: GameSnapshot): string {
    if (snapshot.players.length === 0) {
      return '比分等待同步';
    }

    return snapshot.players
      .slice()
      .sort((a, b) => a.id - b.id)
      .map((player) => `P${player.id} ${player.score}`)
      .join(' | ');
  }
}
