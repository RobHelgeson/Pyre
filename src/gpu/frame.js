// frame.js — Per-frame command encoding: emit -> simulate -> render

import { getActiveTheme } from '../themes/theme-registry.js';

export class FrameEncoder {
  #device;
  #bgParamsBuffer;
  #bgBindGroup = null;
  #startTime = performance.now();

  renderPipelines = null;
  computePipelines = null;
  renderBindGroups = null;
  computeBindGroups = null;

  constructor(device, renderPipelines, computePipelines, buffers) {
    this.#device = device;
    this.renderPipelines = renderPipelines;
    this.computePipelines = computePipelines;
    this.buffers = buffers;

    // Background params: width, height, time, pad
    this.#bgParamsBuffer = device.createBuffer({
      label: 'bgParamsBuffer',
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.#bgBindGroup = renderPipelines.createBackgroundBindGroup(this.#bgParamsBuffer);

    this.renderBindGroups = renderPipelines.createBindGroups(buffers);
    this.computeBindGroups = computePipelines.createBindGroups(buffers);
  }

  rebuildBindGroups() {
    this.renderBindGroups = this.renderPipelines.createBindGroups(this.buffers);
    this.computeBindGroups = this.computePipelines.createBindGroups(this.buffers);
  }

  render(gpu, particleCount) {
    const encoder = this.#device.createCommandEncoder({ label: 'frame' });

    // Compute: emit + simulate
    this.#runEmit(encoder, particleCount);
    this.#runSimulate(encoder, particleCount);

    // Render: background -> fire particles -> tonemap
    this.#uploadBgParams(gpu.width, gpu.height);
    this.#renderBackground(encoder);
    this.#renderFire(encoder, particleCount);
    this.#renderTonemap(encoder, gpu.ctx.getCurrentTexture().createView());

    this.#device.queue.submit([encoder.finish()]);
  }

  #runEmit(encoder, particleCount) {
    const pass = encoder.beginComputePass({ label: 'emit' });
    pass.setPipeline(this.computePipelines.emitPipeline);
    pass.setBindGroup(0, this.computeBindGroups.emitBG);
    pass.dispatchWorkgroups(Math.ceil(particleCount / 64));
    pass.end();
  }

  #runSimulate(encoder, particleCount) {
    const pass = encoder.beginComputePass({ label: 'simulate' });
    pass.setPipeline(this.computePipelines.simulatePipeline);
    pass.setBindGroup(0, this.computeBindGroups.simulateBG);
    pass.dispatchWorkgroups(Math.ceil(particleCount / 64));
    pass.end();
  }

  #uploadBgParams(width, height) {
    const buf = new Float32Array(4);
    buf[0] = width;
    buf[1] = height;
    buf[2] = (performance.now() - this.#startTime) / 1000;
    buf[3] = 0;
    this.#device.queue.writeBuffer(this.#bgParamsBuffer, 0, buf);
  }

  #renderBackground(encoder) {
    const theme = getActiveTheme();
    const pass = encoder.beginRenderPass({
      label: 'background',
      colorAttachments: [{
        view: this.buffers.hdrView,
        clearValue: theme.background.clearColor,
        loadOp: 'clear',
        storeOp: 'store',
      }],
    });
    pass.setPipeline(this.renderPipelines.backgroundPipeline);
    pass.setBindGroup(0, this.#bgBindGroup);
    pass.draw(3);
    pass.end();
  }

  #renderFire(encoder, particleCount) {
    const pass = encoder.beginRenderPass({
      label: 'fire',
      colorAttachments: [{
        view: this.buffers.hdrView,
        loadOp: 'load',
        storeOp: 'store',
      }],
    });
    pass.setPipeline(this.renderPipelines.firePipeline);
    pass.setBindGroup(0, this.renderBindGroups.fireBG);
    pass.draw(6, particleCount);
    pass.end();
  }

  #renderTonemap(encoder, swapView) {
    const pass = encoder.beginRenderPass({
      label: 'tonemap',
      colorAttachments: [{
        view: swapView,
        clearValue: [0, 0, 0, 1],
        loadOp: 'clear',
        storeOp: 'store',
      }],
    });
    pass.setPipeline(this.renderPipelines.tonemapPipeline);
    pass.setBindGroup(0, this.renderBindGroups.tonemapBG);
    pass.draw(3);
    pass.end();
  }

  destroy() {
    this.#bgParamsBuffer?.destroy();
  }
}
