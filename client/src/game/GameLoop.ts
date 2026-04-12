export interface GameLoopCallbacks {
  update: (dtSeconds: number, nowMs: number) => void;
  render: (alpha: number) => void;
}

export class GameLoop {
  private frameId = 0;
  private lastTime = 0;
  private running = false;

  constructor(private readonly callbacks: GameLoopCallbacks) {}

  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.lastTime = performance.now();
    this.frameId = requestAnimationFrame((now) => this.tick(now));
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frameId);
  }

  private tick(now: number): void {
    if (!this.running) {
      return;
    }

    const dtSeconds = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    this.callbacks.update(dtSeconds, now);
    this.callbacks.render(1);

    this.frameId = requestAnimationFrame((nextNow) => this.tick(nextNow));
  }
}
