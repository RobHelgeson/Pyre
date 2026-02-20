// theme-registry.js — Theme lookup and active theme management

import { campfireTheme } from './campfire-theme.js';
import { candleTheme } from './candle-theme.js';
import { bonfireTheme } from './bonfire-theme.js';

const THEMES = {
  campfire: campfireTheme,
  candle: candleTheme,
  bonfire: bonfireTheme,
};

let activeTheme = campfireTheme;

export function getTheme(name) {
  return THEMES[name] || campfireTheme;
}

export function getActiveTheme() {
  return activeTheme;
}

export function setActiveTheme(name) {
  activeTheme = THEMES[name] || campfireTheme;
  return activeTheme;
}

/** Apply a theme's defaults to a config instance */
export function applyThemeDefaults(config, themeName) {
  const theme = getTheme(themeName);
  config.set('emitterShape', theme.emitterShape);
  for (const [key, value] of Object.entries(theme.defaults)) {
    config.set(key, value);
  }
}
