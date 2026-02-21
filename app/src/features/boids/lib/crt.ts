// CRTフィルターオーバーレイを描画する
export function drawCRTOverlay(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // スキャンラインを描画
  ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
  for (let y = 0; y < height; y += 3) {
    ctx.fillRect(0, y, width, 1);
  }

  // 画面端のビネット効果
  const vignette = ctx.createRadialGradient(
    width / 2, height / 2, height * 0.35,
    width / 2, height / 2, height * 0.85
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}
