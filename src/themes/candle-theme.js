// candle-theme.js — Point emitter, soft yellows, tight tall flame

export const candleTheme = {
  name: 'candle',
  emitterShape: 'point',
  defaults: {
    emissionWidth: 0.02,
    buoyancy: 2.2,
    turbulence: 0.6,
    turbulenceScale: 3.0,
    coolingRate: 1.0,
    particleScale: 2.0,
    glowIntensity: 1.8,
    smokeOpacity: 0.2,
  },
  background: {
    clearColor: [0.002, 0.001, 0.0, 1.0],
    topColor: [0.002, 0.001, 0.001],
    bottomColor: [0.015, 0.006, 0.002],
  },
};
