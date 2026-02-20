// render-pipeline.js — Fire particle, background, and tonemap render pipelines

import { loadFireShader, loadShader } from './shader-loader.js';

export class RenderPipelines {
  #device;

  backgroundPipeline = null;
  backgroundBGL = null;

  firePipeline = null;
  fireBGL = null;

  tonemapPipeline = null;
  tonemapBGL = null;

  async init(device, canvasFormat) {
    this.#device = device;
    await Promise.all([
      this.#createBackgroundPipeline(),
      this.#createFirePipeline(),
      this.#createTonemapPipeline(canvasFormat),
    ]);
  }

  async #createBackgroundPipeline() {
    const code = await loadShader('src/shaders/background.wgsl');
    const module = this.#device.createShaderModule({ label: 'background', code });

    this.backgroundBGL = this.#device.createBindGroupLayout({
      label: 'bg-bgl',
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
      ],
    });

    this.backgroundPipeline = this.#device.createRenderPipeline({
      label: 'backgroundPipeline',
      layout: this.#device.createPipelineLayout({ bindGroupLayouts: [this.backgroundBGL] }),
      vertex: { module, entryPoint: 'vs_main' },
      fragment: {
        module,
        entryPoint: 'fs_main',
        targets: [{ format: 'rgba16float' }],
      },
      primitive: { topology: 'triangle-list' },
    });
  }

  async #createFirePipeline() {
    const [vertCode, fragCode] = await Promise.all([
      loadFireShader('src/shaders/fire-vertex.wgsl'),
      loadShader('src/shaders/fire-fragment.wgsl'),
    ]);

    const vertModule = this.#device.createShaderModule({ label: 'fire-vert', code: vertCode });
    const fragModule = this.#device.createShaderModule({ label: 'fire-frag', code: fragCode });

    this.fireBGL = this.#device.createBindGroupLayout({
      label: 'fire-bgl',
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
        { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } },
      ],
    });

    this.firePipeline = this.#device.createRenderPipeline({
      label: 'firePipeline',
      layout: this.#device.createPipelineLayout({ bindGroupLayouts: [this.fireBGL] }),
      vertex: { module: vertModule, entryPoint: 'vs_main' },
      fragment: {
        module: fragModule,
        entryPoint: 'fs_main',
        targets: [{
          format: 'rgba16float',
          blend: {
            color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
            alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
          },
        }],
      },
      primitive: { topology: 'triangle-list' },
    });
  }

  async #createTonemapPipeline(canvasFormat) {
    const code = await loadShader('src/shaders/tonemap.wgsl');
    const module = this.#device.createShaderModule({ label: 'tonemap', code });

    this.tonemapBGL = this.#device.createBindGroupLayout({
      label: 'tonemap-bgl',
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
      ],
    });

    this.tonemapPipeline = this.#device.createRenderPipeline({
      label: 'tonemapPipeline',
      layout: this.#device.createPipelineLayout({ bindGroupLayouts: [this.tonemapBGL] }),
      vertex: { module, entryPoint: 'vs_main' },
      fragment: {
        module,
        entryPoint: 'fs_main',
        targets: [{ format: canvasFormat }],
      },
      primitive: { topology: 'triangle-list' },
    });
  }

  createBindGroups(buffers) {
    const d = this.#device;

    const fireBG = d.createBindGroup({
      label: 'fire-bg',
      layout: this.fireBGL,
      entries: [
        { binding: 0, resource: { buffer: buffers.particleBuffer } },
        { binding: 1, resource: { buffer: buffers.simParamsBuffer } },
      ],
    });

    const tonemapBG = d.createBindGroup({
      label: 'tonemap-bg',
      layout: this.tonemapBGL,
      entries: [
        { binding: 0, resource: buffers.hdrView },
        { binding: 1, resource: buffers.hdrSampler },
      ],
    });

    return { fireBG, tonemapBG };
  }

  createBackgroundBindGroup(bgParamsBuffer) {
    return this.#device.createBindGroup({
      label: 'bg-bg',
      layout: this.backgroundBGL,
      entries: [
        { binding: 0, resource: { buffer: bgParamsBuffer } },
      ],
    });
  }
}
