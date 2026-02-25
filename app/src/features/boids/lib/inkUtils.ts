import {
  OCTOPUS_INK_CLOUD_DURATION_MS,
  OCTOPUS_INK_CLOUD_MAX_RADIUS,
} from './constants';

// スミ雲アニメーションの状態を計算する純粋関数（Boid ロジックとレンダラーの両方で共有）
// age: スミ放出からの経過時間（ミリ秒）。呼び出し元で有効範囲チェック済みであること
export function computeInkCloudState(age: number): { radius: number; alpha: number } {
  const progress = age / OCTOPUS_INK_CLOUD_DURATION_MS;
  // 最初は素早く広がり後半はゆっくり広がる（√ カーブ）。最小半径 5px を保証
  const radius = Math.max(5, OCTOPUS_INK_CLOUD_MAX_RADIUS * Math.sqrt(progress));
  // 時間とともに透明になる
  const alpha = (1 - progress) * 0.92;
  return { radius, alpha };
}
