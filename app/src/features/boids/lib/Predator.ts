import { Boid } from './Boid';
import {
  PREDATOR_SPEED,
  PREDATOR_MAX_FORCE,
  PREDATOR_EAT_RADIUS,
} from './constants';
import { Vec2, magnitude, normalize, limit } from './vec2';

export class Predator {
  x: number;
  y: number;
  vx: number;
  vy: number;
  // 満腹度（捕食するたびに増加し、時間経過で自然減少する）
  satiety: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    // 初期速度は定数 PREDATOR_SPEED を使用（スポーン時点では動的パラメータを参照しない設計）
    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * PREDATOR_SPEED;
    this.vy = Math.sin(angle) * PREDATOR_SPEED;
  }

  // ラップアラウンドを考慮したBoidへの相対位置ベクトルを返す
  private wrappedDelta(boid: Boid, width: number, height: number): Vec2 {
    let dx = boid.x - this.x;
    if (Math.abs(dx) > width / 2) dx -= Math.sign(dx) * width;
    let dy = boid.y - this.y;
    if (Math.abs(dy) > height / 2) dy -= Math.sign(dy) * height;
    return { x: dx, y: dy };
  }

  // 最も近いBoidに向かって追尾するステアリング力を計算（ラップアラウンド考慮）
  private chase(boids: Boid[], width: number, height: number, effectiveSpeed: number, effectiveMaxForce: number): Vec2 {
    if (boids.length === 0) return { x: 0, y: 0 };

    // 最も近いBoidを探す（画面端をまたぐ最短経路で距離を測る）
    let nearest: Boid | null = null;
    let minDist = Infinity;
    for (const boid of boids) {
      const delta = this.wrappedDelta(boid, width, height);
      const dist = magnitude(delta.x, delta.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = boid;
      }
    }

    if (!nearest) return { x: 0, y: 0 };

    // 目標に向かうステアリング力を計算（ラップアラウンド考慮の最短方向）
    const delta = this.wrappedDelta(nearest, width, height);
    const norm = normalize(delta.x, delta.y);
    return limit(
      norm.x * effectiveSpeed - this.vx,
      norm.y * effectiveSpeed - this.vy,
      effectiveMaxForce,
    );
  }

  // 捕食範囲内のBoidをSetで返し、満腹度を増加させる（ラップアラウンド考慮）
  eat(boids: Boid[], width: number, height: number): Set<Boid> {
    const eaten = new Set<Boid>();
    for (const boid of boids) {
      const delta = this.wrappedDelta(boid, width, height);
      if (magnitude(delta.x, delta.y) < PREDATOR_EAT_RADIUS) {
        eaten.add(boid);
      }
    }
    // 捕食した数だけ満腹度を増加
    this.satiety += eaten.size;
    return eaten;
  }

  // 位置・速度を更新する（満腹度に基づく速度動的変化）
  update(
    boids: Boid[],
    width: number,
    height: number,
    speedupThreshold: number,
    overfedThreshold: number,
    satietyDecayRate: number,
    speedBoost: number,
    speedPenalty: number,
  ): void {
    // 満腹度に基づく速度倍率を計算
    // overfedThreshold 以上 → お腹いっぱいで鈍化
    // speedupThreshold 以上 → 興奮状態でスピードアップ
    // それ以外 → 通常速度
    let speedMultiplier = 1.0;
    if (this.satiety >= overfedThreshold) {
      speedMultiplier = speedPenalty;
    } else if (this.satiety >= speedupThreshold) {
      speedMultiplier = speedBoost;
    }

    const effectiveSpeed    = PREDATOR_SPEED    * speedMultiplier;
    const effectiveMaxForce = PREDATOR_MAX_FORCE * speedMultiplier;

    const steer = this.chase(boids, width, height, effectiveSpeed, effectiveMaxForce);
    this.vx += steer.x;
    this.vy += steer.y;

    const vel = limit(this.vx, this.vy, effectiveSpeed);
    this.vx = vel.x;
    this.vy = vel.y;

    this.x += this.vx;
    this.y += this.vy;

    // 画面端でラップアラウンド
    if (this.x < 0) this.x += width;
    if (this.x > width) this.x -= width;
    if (this.y < 0) this.y += height;
    if (this.y > height) this.y -= height;

    // 満腹度を自然減少（最小値は 0）
    this.satiety = Math.max(0, this.satiety - satietyDecayRate);
  }
}
