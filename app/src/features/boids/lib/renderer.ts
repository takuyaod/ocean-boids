import type { Boid } from './Boid';
import type { Predator } from './Predator';

// 両レンダラーが実装する共通インターフェース
export interface BoidsRenderer {
  resize(width: number, height: number): void;
  render(boids: Boid[], predator: Predator): void;
  destroy(): void;
}

export type RendererType = 'webgpu' | 'canvas2d';

export type CreateRendererResult = {
  renderer: BoidsRenderer;
  type: RendererType;
};

// WebGPU 対応チェックと初期化を試み、失敗時は Canvas 2D にフォールバックする
export async function createRenderer(canvas: HTMLCanvasElement): Promise<CreateRendererResult> {
  if (typeof navigator !== 'undefined' && 'gpu' in navigator && navigator.gpu) {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) {
        const device = await adapter.requestDevice();
        const { WebGPURenderer } = await import('./webgpuRenderer');
        return { renderer: new WebGPURenderer(canvas, device), type: 'webgpu' };
      }
    } catch {
      // WebGPU 初期化失敗: Canvas 2D にフォールバック
    }
  }
  const { Canvas2DRenderer } = await import('./canvas2DRenderer');
  return { renderer: new Canvas2DRenderer(canvas), type: 'canvas2d' };
}
