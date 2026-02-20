// ui-panel.js — lil-gui wrapper, binds config parameters to UI sliders

import GUI from '../lib/lil-gui.esm.min.js';
import { Config } from './config.js';

export class UIPanel {
  #gui;
  #config;
  #visible = false;
  #proxy = {};
  perf = { fps: 0, frameTime: 0, activeParticles: 0 };

  constructor(config) {
    this.#config = config;
    this.#gui = new GUI({ title: 'Pyre' });
    this.#gui.domElement.style.position = 'fixed';
    this.#gui.domElement.style.top = '0';
    this.#gui.domElement.style.right = '0';
    this.#gui.domElement.style.zIndex = '1000';

    this.#buildFolders();

    // Start hidden for screensaver feel
    this.#gui.domElement.style.display = 'none';
  }

  #buildFolders() {
    const params = Config.PARAMS;
    const folders = {};

    for (const [key, def] of Object.entries(params)) {
      const cat = def.category;
      if (!folders[cat]) {
        folders[cat] = this.#gui.addFolder(cat.charAt(0).toUpperCase() + cat.slice(1));
      }
      const folder = folders[cat];

      this.#proxy[key] = this.#config.get(key);

      if (typeof def.value === 'boolean') {
        folder.add(this.#proxy, key).name(def.label).onChange((v) => {
          this.#config.set(key, v);
        });
      } else if (key === 'theme') {
        folder.add(this.#proxy, key, ['campfire', 'candle', 'bonfire']).name(def.label).onChange((v) => {
          this.#config.set(key, v);
        });
      } else if (key === 'emitterShape') {
        folder.add(this.#proxy, key, ['line', 'point', 'circle']).name(def.label).onChange((v) => {
          this.#config.set(key, v);
        });
      } else if (def.min !== undefined) {
        folder.add(this.#proxy, key, def.min, def.max, def.step).name(def.label).onChange((v) => {
          this.#config.set(key, v);
        });
      }
    }

    // Close physics by default
    if (folders.physics) folders.physics.close();
    if (folders.interaction) folders.interaction.close();
    if (folders.performance) folders.performance.close();

    // Performance folder (read-only)
    const perf = this.#gui.addFolder('Stats');
    perf.add(this.perf, 'fps', 0, 120, 1).name('FPS').listen().disable();
    perf.add(this.perf, 'frameTime', 0, 50, 0.1).name('Frame ms').listen().disable();
    perf.add(this.perf, 'activeParticles', 0, 200000, 1).name('Particles').listen().disable();
  }

  toggle() {
    this.#visible = !this.#visible;
    this.#gui.domElement.style.display = this.#visible ? '' : 'none';
  }

  get visible() { return this.#visible; }

  destroy() {
    this.#gui.destroy();
  }
}
