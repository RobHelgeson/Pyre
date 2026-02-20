// compute-pipeline.js — Emit and simulate compute pipelines

import { loadFireShader, loadShader } from './shader-loader.js';

export class ComputePipelines {
  #device;

  emitPipeline = null;
  emitBGL = null;

  simulatePipeline = null;
  simulateBGL = null;

  async init(device) {
    this.#device = device;
    await Promise.all([
      this.#createEmitPipeline(),
      this.#createSimulatePipeline(),
    ]);
  }

  async #createEmitPipeline() {
    const code = await loadFireShader('src/shaders/emit.wgsl');
    const module = this.#device.createShaderModule({ label: 'emit', code });

    // particles (rw) + params (uniform) + emit_counter (rw)
    this.emitBGL = this.#device.createBindGroupLayout({
      label: 'emit-bgl',
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
        { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
      ],
    });
    this.emitPipeline = this.#device.createComputePipeline({
      label: 'emitPipeline',
      layout: this.#device.createPipelineLayout({ bindGroupLayouts: [this.emitBGL] }),
      compute: { module, entryPoint: 'cs_main' },
    });
  }

  async #createSimulatePipeline() {
    // simulate needs shared-structs + noise + simulate.wgsl
    const [structs, noise, sim] = await Promise.all([
      loadShader('src/shaders/shared-structs.wgsl'),
      loadShader('src/shaders/noise.wgsl'),
      loadShader('src/shaders/simulate.wgsl'),
    ]);
    const code = structs + '\n' + noise + '\n' + sim;
    const module = this.#device.createShaderModule({ label: 'simulate', code });

    // particles (rw) + params (uniform)
    this.simulateBGL = this.#device.createBindGroupLayout({
      label: 'simulate-bgl',
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
      ],
    });
    this.simulatePipeline = this.#device.createComputePipeline({
      label: 'simulatePipeline',
      layout: this.#device.createPipelineLayout({ bindGroupLayouts: [this.simulateBGL] }),
      compute: { module, entryPoint: 'cs_main' },
    });
  }

  createBindGroups(buffers) {
    const d = this.#device;

    const emitBG = d.createBindGroup({
      label: 'emit-bg',
      layout: this.emitBGL,
      entries: [
        { binding: 0, resource: { buffer: buffers.particleBuffer } },
        { binding: 1, resource: { buffer: buffers.simParamsBuffer } },
        { binding: 2, resource: { buffer: buffers.emitCounterBuffer } },
      ],
    });

    const simulateBG = d.createBindGroup({
      label: 'simulate-bg',
      layout: this.simulateBGL,
      entries: [
        { binding: 0, resource: { buffer: buffers.particleBuffer } },
        { binding: 1, resource: { buffer: buffers.simParamsBuffer } },
      ],
    });

    return { emitBG, simulateBG };
  }
}
