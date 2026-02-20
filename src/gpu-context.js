// gpu-context.js — WebGPU device/adapter initialization and canvas configuration

export class GpuContext {
  /** @type {GPUDevice} */
  device = null;
  /** @type {GPUCanvasContext} */
  ctx = null;
  /** @type {GPUTextureFormat} */
  format = 'bgra8unorm';
  /** @type {HTMLCanvasElement} */
  canvas = null;

  async init(canvas) {
    this.canvas = canvas;

    if (!navigator.gpu) {
      this.#showError();
      return false;
    }

    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: 'high-performance',
    });
    if (!adapter) {
      this.#showError();
      return false;
    }

    this.device = await adapter.requestDevice();

    this.device.lost.then((info) => {
      console.error('WebGPU device lost:', info.message);
      if (info.reason !== 'destroyed') {
        this.init(canvas);
      }
    });

    this.ctx = canvas.getContext('webgpu');
    this.format = navigator.gpu.getPreferredCanvasFormat();

    this.ctx.configure({
      device: this.device,
      format: this.format,
      alphaMode: 'premultiplied',
    });

    this.#syncSize();
    return true;
  }

  #syncSize() {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.floor(this.canvas.clientWidth * dpr);
    const h = Math.floor(this.canvas.clientHeight * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  handleResize() {
    const oldW = this.canvas.width;
    const oldH = this.canvas.height;
    this.#syncSize();
    return this.canvas.width !== oldW || this.canvas.height !== oldH;
  }

  get width() { return this.canvas.width; }
  get height() { return this.canvas.height; }

  #showError() {
    const overlay = document.getElementById('error-overlay');
    if (overlay) overlay.classList.add('visible');
  }

  destroy() {
    if (this.device) {
      this.device.destroy();
      this.device = null;
    }
  }
}
