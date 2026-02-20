// buffers.js — Buffer creation, HDR texture, resize logic

const PARTICLE_BYTE_SIZE = 32; // 2×vec2 + 4×f32 = 8 floats × 4 = 32 bytes

export class Buffers {
  #device;

  particleBuffer = null;
  simParamsBuffer = null;
  emitCounterBuffer = null;

  hdrTexture = null;
  hdrView = null;
  hdrSampler = null;

  #width = 0;
  #height = 0;
  #particleCount = 0;

  constructor(device) {
    this.#device = device;
  }

  init(particleCount, width, height) {
    this.#particleCount = particleCount;
    this.#createParticleBuffer(particleCount);
    this.#createSimParamsBuffer();
    this.#createEmitCounterBuffer();
    this.#createHdrTexture(width, height);
    this.#createSampler();
  }

  #createParticleBuffer(count) {
    if (this.particleBuffer) this.particleBuffer.destroy();

    // Initialize all particles as dead (flags = 0)
    const data = new ArrayBuffer(count * PARTICLE_BYTE_SIZE);
    // All zeros = pos(0,0), vel(0,0), temp(0), age(0), life(0), flags(0) → dead

    this.particleBuffer = this.#device.createBuffer({
      label: 'particleBuffer',
      size: data.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Uint8Array(this.particleBuffer.getMappedRange()).set(new Uint8Array(data));
    this.particleBuffer.unmap();
  }

  #createSimParamsBuffer() {
    if (this.simParamsBuffer) this.simParamsBuffer.destroy();
    this.simParamsBuffer = this.#device.createBuffer({
      label: 'simParamsBuffer',
      size: 96, // FireParams struct size
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  #createEmitCounterBuffer() {
    if (this.emitCounterBuffer) this.emitCounterBuffer.destroy();
    this.emitCounterBuffer = this.#device.createBuffer({
      label: 'emitCounterBuffer',
      size: 4, // single u32 atomic
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
  }

  #createHdrTexture(width, height) {
    if (this.hdrTexture) this.hdrTexture.destroy();
    this.#width = width;
    this.#height = height;

    this.hdrTexture = this.#device.createTexture({
      label: 'hdrTexture',
      size: [width, height],
      format: 'rgba16float',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    this.hdrView = this.hdrTexture.createView();
  }

  #createSampler() {
    this.hdrSampler = this.#device.createSampler({
      label: 'hdrSampler',
      magFilter: 'linear',
      minFilter: 'linear',
    });
  }

  handleResize(width, height) {
    if (width === this.#width && height === this.#height) return false;
    this.#createHdrTexture(width, height);
    return true;
  }

  uploadSimParams(data) {
    this.#device.queue.writeBuffer(this.simParamsBuffer, 0, data);
  }

  /** Reset emit counter to 0 before each emit pass */
  resetEmitCounter() {
    this.#device.queue.writeBuffer(this.emitCounterBuffer, 0, new Uint32Array([0]));
  }

  get particleCount() { return this.#particleCount; }

  destroy() {
    this.particleBuffer?.destroy();
    this.simParamsBuffer?.destroy();
    this.emitCounterBuffer?.destroy();
    this.hdrTexture?.destroy();
  }
}
