// campfire-theme.js — Line emitter, warm palette, classic flame

export const campfireTheme = {
  name: 'campfire',
  emitterShape: 'line',
  defaults: {
    emissionWidth: 0.15,
    buoyancy: 1.5,
    turbulence: 1.0,
    turbulenceScale: 2.0,
    coolingRate: 0.6,
    particleScale: 2.5,
    glowIntensity: 1.5,
    smokeOpacity: 0.4,
  },
  background: {
    clearColor: [0.003, 0.001, 0.001, 1.0],
    topColor: [0.003, 0.001, 0.001],
    bottomColor: [0.025, 0.008, 0.003],
  },
};
