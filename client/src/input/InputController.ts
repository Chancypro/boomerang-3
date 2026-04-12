import type { PlayerInput, Vec2 } from '../../../shared/protocol';

export class InputController {
  private readonly keys = new Set<string>();
  private pointerDown = false;
  private aim: Vec2 = { x: 1, y: 0 };
  private pointerWorld: Vec2 = { x: 1, y: 0 };
  private seq = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    window.addEventListener('keydown', (event) => this.onKeyDown(event));
    window.addEventListener('keyup', (event) => this.keys.delete(event.code));
    canvas.addEventListener('pointermove', (event) => this.updateAim(event));
    canvas.addEventListener('pointerdown', (event) => {
      this.pointerDown = true;
      canvas.setPointerCapture(event.pointerId);
      this.updateAim(event);
    });
    canvas.addEventListener('pointerup', (event) => {
      this.pointerDown = false;
      this.updateAim(event);
    });
    canvas.addEventListener('pointercancel', () => {
      this.pointerDown = false;
    });
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  snapshot(localPlayerPosition: Vec2 | null): PlayerInput {
    this.seq += 1;
    this.updateAimFromLocalPlayer(localPlayerPosition);

    return {
      up: this.keys.has('KeyW') || this.keys.has('ArrowUp'),
      down: this.keys.has('KeyS') || this.keys.has('ArrowDown'),
      left: this.keys.has('KeyA') || this.keys.has('ArrowLeft'),
      right: this.keys.has('KeyD') || this.keys.has('ArrowRight'),
      throwPressed: this.pointerDown || this.keys.has('Space'),
      aim: { ...this.aim },
      seq: this.seq
    };
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.code === 'Space') {
      event.preventDefault();
    }

    this.keys.add(event.code);
  }

  private updateAim(event: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.pointerWorld = {
      x: ((event.clientX - rect.left) / rect.width) * this.canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * this.canvas.height
    };
    this.updateAimFromLocalPlayer(null);
  }

  private updateAimFromLocalPlayer(localPlayerPosition: Vec2 | null): void {
    const origin = localPlayerPosition ?? {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2
    };
    const dx = this.pointerWorld.x - origin.x;
    const dy = this.pointerWorld.y - origin.y;
    const length = Math.hypot(dx, dy);

    if (length > 0.001) {
      this.aim = {
        x: dx / length,
        y: dy / length
      };
    }
  }
}
