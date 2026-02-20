// main.js — Entry point and orchestrator

import { GpuContext } from './gpu-context.js';
import { Config } from './config.js';
import { Input } from './input.js';
import { UIPanel } from './ui-panel.js';
import { Emitter } from './emitter.js';
import { Buffers } from './gpu/buffers.js';
import { RenderPipelines } from './gpu/render-pipeline.js';
import { ComputePipelines } from './gpu/compute-pipeline.js';
import { FrameEncoder } from './gpu/frame.js';
import { loadSharedStructs } from './gpu/shader-loader.js';
import { setActiveTheme, applyThemeDefaults } from './themes/theme-registry.js';

async function main() {
  const canvas = document.getElementById('canvas');
  const config = new Config();
  const gpu = new GpuContext();

  const ok = await gpu.init(canvas);
  if (!ok) return;

  console.log('WebGPU initialized', `${gpu.width}x${gpu.height}`);

  await loadSharedStructs();

  const buffers = new Buffers(gpu.device);
  buffers.init(config.get('particleCount'), gpu.width, gpu.height);

  const renderPipelines = new RenderPipelines();
  const computePipelines = new ComputePipelines();
  await Promise.all([
    renderPipelines.init(gpu.device, gpu.format),
    computePipelines.init(gpu.device),
  ]);

  const frameEncoder = new FrameEncoder(gpu.device, renderPipelines, computePipelines, buffers);
  const emitter = new Emitter();
  const input = new Input(canvas, config);
  const ui = new UIPanel(config);

  // Wire input events
  input.onPause((paused) => {
    console.log(paused ? 'Paused' : 'Resumed');
  });
  input.onRestart(() => {
    buffers.init(config.get('particleCount'), gpu.width, gpu.height);
    frameEncoder.rebuildBindGroups();
    emitter.reset();
  });
  input.onToggleUI(() => {
    ui.toggle();
    input.setKeepCursorVisible(ui.visible);
  });

  // Handle config changes
  config.onChange((key, value) => {
    if (key === 'particleCount') {
      buffers.init(value, gpu.width, gpu.height);
      frameEncoder.rebuildBindGroups();
    }
    if (key === 'theme') {
      const theme = setActiveTheme(value);
      applyThemeDefaults(config, value);
    }
  });

  // FPS tracking
  let frameNumber = 0;
  let lastFpsTime = performance.now();
  let frameCount = 0;
  let fps = 60;
  let frameTimeAccum = 0;

  // Adaptive particle scaling
  let activeParticleCount = config.get('particleCount');
  let targetActiveCount = activeParticleCount;

  function frame(now) {
    requestAnimationFrame(frame);

    if (input.paused) return;

    const frameDt = now - (frame.lastTime || now);
    frame.lastTime = now;

    // FPS tracking
    frameCount++;
    frameTimeAccum += frameDt;
    if (now - lastFpsTime >= 500) {
      fps = Math.round(frameCount / ((now - lastFpsTime) / 1000));
      const avgFrameTime = frameTimeAccum / frameCount;
      ui.perf.fps = fps;
      ui.perf.frameTime = Math.round(avgFrameTime * 10) / 10;
      frameCount = 0;
      frameTimeAccum = 0;
      lastFpsTime = now;

      // Adaptive scaling
      if (config.get('adaptiveParticles')) {
        const ceiling = config.get('particleCount');
        if (fps < 50 && targetActiveCount > 5000) {
          targetActiveCount = Math.max(5000, Math.floor(targetActiveCount * 0.9));
        } else if (fps > 58 && targetActiveCount < ceiling) {
          targetActiveCount = Math.min(ceiling, Math.floor(targetActiveCount * 1.05));
        }
      } else {
        targetActiveCount = config.get('particleCount');
      }
    }

    // Smooth lerp toward target
    activeParticleCount += Math.round((targetActiveCount - activeParticleCount) * 0.1);
    ui.perf.activeParticles = activeParticleCount;

    const resized = gpu.handleResize();
    if (resized) {
      buffers.handleResize(gpu.width, gpu.height);
      frameEncoder.rebuildBindGroups();
    }

    // Upload sim params
    const simData = config.toSimParams(
      gpu.width, gpu.height,
      input.mouseX, input.mouseY,
      frameNumber,
      activeParticleCount,
    );
    buffers.uploadSimParams(simData);

    // Reset emit counter before each frame
    buffers.resetEmitCounter();

    // Render
    frameEncoder.render(gpu, activeParticleCount);

    frameNumber++;
  }

  requestAnimationFrame(frame);

  window.__pyre = { config, gpu, input, ui, buffers, frameEncoder };
}

main();
