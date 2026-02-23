import { Boid } from './Boid';
import { BoidSpecies } from './constants';

// 画面端のランダムな辺を選び座標を返す
function randomEdgePosition(width: number, height: number): { x: number; y: number } {
  // 0:上, 1:下, 2:左, 3:右
  const edge = Math.floor(Math.random() * 4);
  if (edge === 0) return { x: Math.random() * width, y: 0 };
  if (edge === 1) return { x: Math.random() * width, y: height };
  if (edge === 2) return { x: 0,     y: Math.random() * height };
  return              { x: width, y: Math.random() * height };
}

// 画面端のランダムな位置に指定した種のBoidを1体生成して返す
export function spawnBoidAtEdge(species: BoidSpecies, width: number, height: number): Boid {
  const { x, y } = randomEdgePosition(width, height);
  return new Boid(x, y, species);
}

// 画面端のランダムな位置にcount体のBoidを生成して返す
export function spawnBoidsAtEdge(count: number, width: number, height: number): Boid[] {
  return Array.from({ length: count }, () => {
    const { x, y } = randomEdgePosition(width, height);
    return new Boid(x, y);
  });
}
