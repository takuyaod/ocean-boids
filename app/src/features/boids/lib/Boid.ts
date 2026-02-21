import {
  ALIEN_SPRITE,
  NEON_COLORS,
  PIXEL_SIZE,
  MAX_SPEED,
  MAX_FORCE,
  SEPARATION_RADIUS,
  ALIGNMENT_RADIUS,
  COHESION_RADIUS,
  SEPARATION_WEIGHT,
  ALIGNMENT_WEIGHT,
  COHESION_WEIGHT,
} from './constants';
import { Vec2, magnitude, normalize, limit } from './vec2';

export class Boid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    // ランダムな初期速度を設定
    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * MAX_SPEED;
    this.vy = Math.sin(angle) * MAX_SPEED;
    this.color = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
  }

  // 分離ルール：近くのBoidから離れる
  private separate(boids: Boid[]): Vec2 {
    let sx = 0, sy = 0, count = 0;
    for (const other of boids) {
      if (other === this) continue;
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const dist = magnitude(dx, dy);
      if (dist > 0 && dist < SEPARATION_RADIUS) {
        // 距離に反比例した反発力を計算
        sx += (dx / dist) / dist;
        sy += (dy / dist) / dist;
        count++;
      }
    }
    if (count === 0) return { x: 0, y: 0 };
    const norm = normalize(sx / count, sy / count);
    return limit(norm.x * MAX_SPEED - this.vx, norm.y * MAX_SPEED - this.vy, MAX_FORCE);
  }

  // 整列ルール：近くのBoidの進行方向に合わせる
  private align(boids: Boid[]): Vec2 {
    let avx = 0, avy = 0, count = 0;
    for (const other of boids) {
      if (other === this) continue;
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const dist = magnitude(dx, dy);
      if (dist > 0 && dist < ALIGNMENT_RADIUS) {
        avx += other.vx;
        avy += other.vy;
        count++;
      }
    }
    if (count === 0) return { x: 0, y: 0 };
    const norm = normalize(avx / count, avy / count);
    return limit(norm.x * MAX_SPEED - this.vx, norm.y * MAX_SPEED - this.vy, MAX_FORCE);
  }

  // 結合ルール：近くのBoidの重心に向かう
  private cohere(boids: Boid[]): Vec2 {
    let cx = 0, cy = 0, count = 0;
    for (const other of boids) {
      if (other === this) continue;
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const dist = magnitude(dx, dy);
      if (dist > 0 && dist < COHESION_RADIUS) {
        cx += other.x;
        cy += other.y;
        count++;
      }
    }
    if (count === 0) return { x: 0, y: 0 };
    // 重心へのベクトルを求める
    const norm = normalize(cx / count - this.x, cy / count - this.y);
    return limit(norm.x * MAX_SPEED - this.vx, norm.y * MAX_SPEED - this.vy, MAX_FORCE);
  }

  // 位置・速度を更新する
  update(boids: Boid[], width: number, height: number) {
    const sep = this.separate(boids);
    const ali = this.align(boids);
    const coh = this.cohere(boids);

    // 各ルールの力を重み付けして加算
    this.vx += sep.x * SEPARATION_WEIGHT + ali.x * ALIGNMENT_WEIGHT + coh.x * COHESION_WEIGHT;
    this.vy += sep.y * SEPARATION_WEIGHT + ali.y * ALIGNMENT_WEIGHT + coh.y * COHESION_WEIGHT;

    const vel = limit(this.vx, this.vy, MAX_SPEED);
    this.vx = vel.x;
    this.vy = vel.y;

    this.x += this.vx;
    this.y += this.vy;

    // 画面端でラップアラウンド
    if (this.x < 0) this.x += width;
    if (this.x > width) this.x -= width;
    if (this.y < 0) this.y += height;
    if (this.y > height) this.y -= height;
  }

  // エイリアンのピクセルアートを描画する
  draw(ctx: CanvasRenderingContext2D) {
    const offsetX = -(ALIEN_SPRITE[0].length * PIXEL_SIZE) / 2;
    const offsetY = -(ALIEN_SPRITE.length * PIXEL_SIZE) / 2;

    ctx.save();
    ctx.translate(this.x, this.y);
    // 進行方向に向けて回転
    ctx.rotate(Math.atan2(this.vy, this.vx) + Math.PI / 2);

    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;

    // ピクセルアートを1マスずつ描画
    for (let row = 0; row < ALIEN_SPRITE.length; row++) {
      for (let col = 0; col < ALIEN_SPRITE[row].length; col++) {
        if (ALIEN_SPRITE[row][col] === 1) {
          ctx.fillRect(
            offsetX + col * PIXEL_SIZE,
            offsetY + row * PIXEL_SIZE,
            PIXEL_SIZE,
            PIXEL_SIZE
          );
        }
      }
    }

    ctx.restore();
  }
}
