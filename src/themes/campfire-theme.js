// campfire-theme.js — Line emitter, warm palette, classic flame

export const campfireTheme = {
  name: 'campfire',
  emitterShape: 'line',
  defaults: {
    emissionWidth: 0.15,
    buoyancy: 1.5,
    turbulence: 1.0,
    turbulenceScale: 2.0,
    coolingRate: 0.8,
    particleScale: 2.0,
    glowIntensity: 1.5,
    smokeOpacity: 0.3,
  },
  background: {
    clearColor: [0.01, 0.005, 0.0, 1.0],
    topColor: [0.02, 0.01, 0.005],
    bottomColor: [0.05, 0.02, 0.01],
  },
};
