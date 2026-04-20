const fpsEl = document.getElementById('perf-fps')!;
const featuresEl = document.getElementById('perf-features')!;
const renderedEl = document.getElementById('perf-rendered')!;

let frames = 0;
let lastTime = performance.now();

function tick() {
  frames++;
  const now = performance.now();
  if (now - lastTime >= 1000) {
    const fps = Math.round((frames * 1000) / (now - lastTime));
    fpsEl.textContent = `${fps} FPS`;

    // Color code FPS
    if (fps >= 50) fpsEl.style.color = '#0f0';
    else if (fps >= 30) fpsEl.style.color = '#ff0';
    else fpsEl.style.color = '#f00';

    frames = 0;
    lastTime = now;
  }
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);

export function setFeatureCount(count: number) {
  featuresEl.textContent = `${count.toLocaleString()} features`;
}

export function setRenderedCount(count: number) {
  renderedEl.textContent = `${count.toLocaleString()} rendered`;
}
