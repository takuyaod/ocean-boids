import { getRandomSpecies } from './speciesUtils';
import {
  BoidSpecies,
  MAX_SPEED,
  MAX_FORCE,
  PREDATOR_FLEE_RADIUS,
  PREDATOR_FLEE_FORCE_SCALE,
  SPECIES_PARAMS,
  OCTOPUS_INK_PROBABILITY,
  OCTOPUS_INK_COOLDOWN_MS,
  OCTOPUS_INK_CLOUD_DURATION_MS,
  PREDATOR_CONFUSION_DURATION_MS,
  type SpeciesParams,
} from './constants';
import { computeInkCloudState } from './inkUtils';

import { Vec2, magnitude, normalize, limit } from './vec2';
import type { Predator } from './Predator';

// 未放出状態を示す特殊値（負の大きな値でレンダラーがスミ雲を描画しないことを保証）
const NEVER_INKED = -Infinity;

export class Boid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  species: BoidSpecies;
  // 種固有パラメータをキャッシュ（this.species は不変なため、毎フレームの SPECIES_PARAMS ルックアップを排除）
  private readonly params: SpeciesParams;
  // タコのスミ放出クールダウン終了時刻（performance.now() ベース。0 = クールダウンなし）
  private _inkCooldownUntil: number;
  // スミ雲描画用：最後にスミを放出した時刻と位置（レンダラーが参照）
  private _lastInkedAt: number;
  private _lastInkX:    number;
  private _lastInkY:    number;

  get lastInkedAt(): number { return this._lastInkedAt; }
  get lastInkX():    number { return this._lastInkX; }
  get lastInkY():    number { return this._lastInkY; }

  constructor(x: number, y: number, species?: BoidSpecies) {
    this.x = x;
    this.y = y;
    // 初期速度は定数 MAX_SPEED を使用（スポーン時点では動的パラメータを参照しない設計）
    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * MAX_SPEED;
    this.vy = Math.sin(angle) * MAX_SPEED;
    // 種が指定されていれば使用し、なければ重み付きランダムで割り当て
    this.species = species ?? getRandomSpecies();
    this.params = SPECIES_PARAMS[this.species];
    this._inkCooldownUntil = 0;
    this._lastInkedAt = NEVER_INKED; // 未放出状態（レンダラーがスミ雲を描画しないよう負の大きな値を初期値に）
    this._lastInkX    = 0;
    this._lastInkY    = 0;
  }

  // 分離ルール：近くのBoidから離れる（種固有の分離半径を使用、全種に対して適用）
  private separate(boids: Boid[], maxSpeed: number, maxForce: number): Vec2 {
    const { separationRadius } = this.params;
    let sx = 0, sy = 0, count = 0;
    for (const other of boids) {
      if (other === this) continue;
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const dist = magnitude(dx, dy);
      if (dist > 0 && dist < separationRadius) {
        // 距離に反比例した反発力を計算
        sx += (dx / dist) / dist;
        sy += (dy / dist) / dist;
        // 分離は全種を等しく扱うため totalWeight ではなく count を使用
        // （align/cohere と異なり intraSpeciesBias・maxFlockSize による調整を行わない）
        count++;
      }
    }
    if (count === 0) return { x: 0, y: 0 };
    const norm = normalize(sx / count, sy / count);
    return limit(norm.x * maxSpeed - this.vx, norm.y * maxSpeed - this.vy, maxForce);
  }

  // 指定半径内の隣接ボイドを、maxFlockSize を考慮した重み付きリストで返す（align/cohere 共通）
  private weightedNeighbors(boids: Boid[], radius: number): Array<{ other: Boid; weight: number }> {
    const { intraSpeciesBias, maxFlockSize } = this.params;
    const neighbors: Array<{ other: Boid; weight: number }> = [];
    let sameSpeciesCount = 0;
    for (const other of boids) {
      if (other === this) continue;
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const dist = magnitude(dx, dy);
      if (dist > 0 && dist < radius) {
        const isSameSpecies = other.species === this.species;
        // 同種の群れ規模が上限に達したらその個体は無視する
        if (isSameSpecies && sameSpeciesCount >= maxFlockSize) continue;
        if (isSameSpecies) sameSpeciesCount++;
        neighbors.push({ other, weight: isSameSpecies ? intraSpeciesBias : 1.0 });
      }
    }
    return neighbors;
  }

  // 整列ルール：近くのBoidの進行方向に合わせる（同種ボイドを intraSpeciesBias 倍で優先）
  private align(boids: Boid[], maxSpeed: number, maxForce: number): Vec2 {
    const { alignmentRadius } = this.params;
    const neighbors = this.weightedNeighbors(boids, alignmentRadius);
    if (neighbors.length === 0) return { x: 0, y: 0 };
    let avx = 0, avy = 0, totalWeight = 0;
    for (const { other, weight } of neighbors) {
      avx += other.vx * weight;
      avy += other.vy * weight;
      totalWeight += weight;
    }
    const norm = normalize(avx / totalWeight, avy / totalWeight);
    return limit(norm.x * maxSpeed - this.vx, norm.y * maxSpeed - this.vy, maxForce);
  }

  // 慣性ルール：現在の進行方向を維持しようとする力（inertiaBias > 0 の種のみ計算）
  // normalize は速度ゼロ時に {0, 0} を返すため、speed ゼロの個別ガードは不要
  private inertia(maxSpeed: number, maxForce: number): Vec2 {
    if (this.params.inertiaBias <= 0) return { x: 0, y: 0 };
    const norm = normalize(this.vx, this.vy);
    const force = limit(
      norm.x * maxSpeed - this.vx,
      norm.y * maxSpeed - this.vy,
      maxForce,
    );
    return { x: force.x * this.params.inertiaBias, y: force.y * this.params.inertiaBias };
  }

  // 逃避ルール：捕食者が近づいたら全力で逃げる（ラップアラウンド考慮）
  private flee(predator: Predator, width: number, height: number, maxSpeed: number, maxForce: number): Vec2 {
    let dx = this.x - predator.x;
    if (Math.abs(dx) > width / 2) dx -= Math.sign(dx) * width;
    let dy = this.y - predator.y;
    if (Math.abs(dy) > height / 2) dy -= Math.sign(dy) * height;
    const dist = magnitude(dx, dy);
    if (dist <= 0 || dist > PREDATOR_FLEE_RADIUS) return { x: 0, y: 0 };
    // 捕食者が近づくほど逃避力を強める（距離に反比例）
    const strength = (PREDATOR_FLEE_RADIUS - dist) / PREDATOR_FLEE_RADIUS;
    const norm = normalize(dx, dy);
    return limit(norm.x * maxSpeed - this.vx, norm.y * maxSpeed - this.vy, maxForce * PREDATOR_FLEE_FORCE_SCALE * strength);
  }

  // 結合ルール：近くのBoidの重心に向かう（同種ボイドを intraSpeciesBias 倍で優先）
  private cohere(boids: Boid[], maxSpeed: number, maxForce: number): Vec2 {
    const { cohesionRadius } = this.params;
    const neighbors = this.weightedNeighbors(boids, cohesionRadius);
    if (neighbors.length === 0) return { x: 0, y: 0 };
    let cx = 0, cy = 0, totalWeight = 0;
    for (const { other, weight } of neighbors) {
      cx += other.x * weight;
      cy += other.y * weight;
      totalWeight += weight;
    }
    // 重心へのベクトルを求める
    const norm = normalize(cx / totalWeight - this.x, cy / totalWeight - this.y);
    return limit(norm.x * maxSpeed - this.vx, norm.y * maxSpeed - this.vy, maxForce);
  }

  // 位置・速度を更新する
  update(boids: Boid[], predator: Predator, width: number, height: number, maxSpeed: number, maxForce: number): void {
    const params = this.params;
    // グローバルの SimParams を比率として種固有パラメータにスケール適用
    // （SimParams スライダーで全種を一括調整しつつ、種間の相対差を保持する）
    const effectiveMaxSpeed = params.maxSpeed * (maxSpeed / MAX_SPEED);
    const effectiveMaxForce = params.maxForce * (maxForce / MAX_FORCE);

    const separation   = this.separate(boids, effectiveMaxSpeed, effectiveMaxForce);
    const alignment    = this.align(boids, effectiveMaxSpeed, effectiveMaxForce);
    const cohesion     = this.cohere(boids, effectiveMaxSpeed, effectiveMaxForce);
    const fleeForce    = this.flee(predator, width, height, effectiveMaxSpeed, effectiveMaxForce);
    const inertiaForce = this.inertia(effectiveMaxSpeed, effectiveMaxForce);

    // タコ固有の処理：スミ放出 + スミ雲当たり判定
    if (this.species === BoidSpecies.Octopus) {
      const now = performance.now();

      // サメが逃避範囲内のとき、確率とクールダウンを判定してスミを放出する
      // fleeForce はタコが最大速度で逃げている平衡状態で 0 になるため、距離で直接判定する
      // 判定順: 距離チェック → クールダウンチェック → 確率チェック（不要な Math.random() 呼び出しを削減）
      let inkDx = this.x - predator.x;
      if (Math.abs(inkDx) > width / 2) inkDx -= Math.sign(inkDx) * width;
      let inkDy = this.y - predator.y;
      if (Math.abs(inkDy) > height / 2) inkDy -= Math.sign(inkDy) * height;
      const distToPredator = magnitude(inkDx, inkDy);
      if (distToPredator > 0 && distToPredator <= PREDATOR_FLEE_RADIUS) {
        if (now >= this._inkCooldownUntil && Math.random() < OCTOPUS_INK_PROBABILITY) {
          this._inkCooldownUntil = now + OCTOPUS_INK_COOLDOWN_MS;
          // スミ雲の放出位置と時刻を記録（混乱付与はスミ雲当たり判定に委ねる）
          this._lastInkedAt = now;
          this._lastInkX    = this.x;
          this._lastInkY    = this.y;
        }
      }

      // スミ雲当たり判定：サメがスミ雲の範囲内に入ったときのみ混乱状態にする
      // すでに混乱中のサメには再付与しない（毎フレーム呼ぶと方向がリセットされ続けるため）
      // 注: 現在 OCTOPUS_INK_CLOUD_DURATION_MS(3000ms) < PREDATOR_CONFUSION_DURATION_MS(4000ms) のため、
      //     スミ雲消滅後もサメは混乱し続ける。両定数が逆転した場合、混乱が解けた後もスミ雲が残り
      //     !predator.isConfused が真になるため再び混乱が付与されるエッジケースが生じる。
      if (this._lastInkedAt !== NEVER_INKED && !predator.isConfused) {
        const inkAge = now - this._lastInkedAt;
        if (inkAge <= OCTOPUS_INK_CLOUD_DURATION_MS) {
          const { radius: cloudRadius } = computeInkCloudState(inkAge);
          // ラップアラウンド補正：画面端をまたぐ場合の最短距離で判定
          let dxCloud = predator.x - this._lastInkX;
          if (Math.abs(dxCloud) > width / 2) dxCloud -= Math.sign(dxCloud) * width;
          let dyCloud = predator.y - this._lastInkY;
          if (Math.abs(dyCloud) > height / 2) dyCloud -= Math.sign(dyCloud) * height;
          if (magnitude(dxCloud, dyCloud) <= cloudRadius) {
            predator.confuse(PREDATOR_CONFUSION_DURATION_MS);
          }
        }
      }
    }

    // 種固有の重みで各ルールの力を加算（逃避が最優先）
    this.vx += separation.x * params.separationWeight
             + alignment.x  * params.alignmentWeight
             + cohesion.x   * params.cohesionWeight
             + fleeForce.x  * params.fleeWeight
             + inertiaForce.x;
    this.vy += separation.y * params.separationWeight
             + alignment.y  * params.alignmentWeight
             + cohesion.y   * params.cohesionWeight
             + fleeForce.y  * params.fleeWeight
             + inertiaForce.y;

    const vel = limit(this.vx, this.vy, effectiveMaxSpeed);
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
}
