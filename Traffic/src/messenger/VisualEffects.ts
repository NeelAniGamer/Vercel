import * as THREE from 'three';

/**
 * Stylized Visual FX & Dynamic Anime Speed Lines for Mumbai Traffic Messenger
 * Inspired by the Three.js 3D web production workflow video.
 */
export class VisualEffects {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private speedIntensity: number = 0;
  private lines: { angle: number; length: number; speed: number; dist: number }[] = [];

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'speed-fx-canvas';
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '50';
    document.body.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Generate speed lines pool
    for (let i = 0; i < 70; i++) {
      this.lines.push({
        angle: Math.random() * Math.PI * 2,
        length: 80 + Math.random() * 140,
        speed: 15 + Math.random() * 25,
        dist: 0.35 + Math.random() * 0.65
      });
    }
  }

  private resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /**
   * Update and render anime speed lines based on current vehicle speed
   */
  public update(speed: number, maxSpeed: number, delta: number) {
    const ratio = Math.max(0, (speed - 12.0) / (maxSpeed - 12.0));
    this.speedIntensity = THREE.MathUtils.lerp(this.speedIntensity, ratio, delta * 8.0);

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.speedIntensity < 0.05) return;

    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const maxR = Math.sqrt(cx * cx + cy * cy);

    this.ctx.save();
    this.ctx.strokeStyle = `rgba(255, 255, 255, ${this.speedIntensity * 0.45})`;
    this.ctx.lineWidth = 2.0;

    for (const line of this.lines) {
      line.dist -= line.speed * delta * 0.5;
      if (line.dist < 0.25) {
        line.dist = 0.95 + Math.random() * 0.2;
        line.angle = Math.random() * Math.PI * 2;
      }

      const rStart = line.dist * maxR;
      const rEnd = rStart + line.length * this.speedIntensity;

      const cos = Math.cos(line.angle);
      const sin = Math.sin(line.angle);

      const x1 = cx + cos * rStart;
      const y1 = cy + sin * rStart;
      const x2 = cx + cos * rEnd;
      const y2 = cy + sin * rEnd;

      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }
}
