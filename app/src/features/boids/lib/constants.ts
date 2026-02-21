// エイリアンのピクセルアートスプライト（スペースインベーダー風）
export const ALIEN_SPRITE = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 0, 1, 1, 0, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 0, 0, 1, 1, 0],
  [1, 0, 0, 1, 1, 0, 0, 1],
  [0, 1, 0, 0, 0, 0, 1, 0],
];

// ネオンカラーパレット
export const NEON_COLORS = ['#00ff41', '#00ffff', '#ff00ff'];

export const PIXEL_SIZE = 3;   // スプライトの1ピクセルのサイズ
export const BOID_COUNT = 60;  // Boidの数
export const MAX_SPEED = 2.0;  // 最大速度
export const MAX_FORCE = 0.04; // 最大操舵力

// 近傍範囲
export const SEPARATION_RADIUS = 35;
export const ALIGNMENT_RADIUS = 75;
export const COHESION_RADIUS = 75;

// 各ルールの重み
export const SEPARATION_WEIGHT = 1.8;
export const ALIGNMENT_WEIGHT = 1.0;
export const COHESION_WEIGHT = 1.0;
