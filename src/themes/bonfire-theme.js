// bonfire-theme.js — Circle emitter, wide chaotic multi-tongue flames

export const bonfireTheme = {
  name: 'bonfire',
  emitterShape: 'circle',
  defaults: {
    emissionWidth: 0.3,
    buoyancy: 1.2,
    turbulence: 1.8,
    turbulenceScale: 1.5,
    coolingRate: 0.6,
    particleScale: 2.5,
    glowIntensity: 1.3,
    smokeOpacity: 0.5,
  },
  background: {
    clearColor: [0.015, 0.005, 0.0, 1.0],
    topColor: [0.025, 0.01, 0.003],
    bottomColor: [0.06, 0.025, 0.01],
  },
};
