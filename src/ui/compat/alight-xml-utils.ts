import type { ExternalEffectProperty } from '../../core/project-model';

export const MAX_XML_SIZE = 10 * 1024 * 1024;
export const MAX_LAYERS = 5000;
export const MAX_KEYFRAMES = 10_000;

export const LAYER_TAGS = new Set([
  'shape',
  'text',
  'drawing',
  'color',
  'group',
  'audio',
  'camera',
  'null',
  'media',
  'image',
  'video',
]);

export const KNOWN_LAYER_CHILDREN = new Set([
  'transform',
  'fillColor',
  'fillImage',
  'gradient',
  'content',
  'path',
  'property',
  'effect',
  'blendMode',
  'stroke',
]);

export const BLEND_BY_NUMBER: Record<string, string> = {
  0: 'normal',
  1: 'multiply',
  2: 'screen',
  6: 'difference',
  7: 'exclusion',
  8: 'lighten',
  9: 'darken',
  12: 'color-burn',
  14: 'color-dodge',
  16: 'overlay',
  17: 'soft-light',
  18: 'hard-light',
  23: 'hue',
  24: 'saturation',
  25: 'color',
  26: 'luminosity',
};

export const DEFAULT_EFFECTS = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hue: 0,
  blur: 0,
  grayscale: 0,
  sepia: 0,
  invert: 0,
  glow: 0,
  vignette: 0,
  sharpen: 0,
  chromaTolerance: 0,
  motionBlur: 0,
  redGain: 100,
  greenGain: 100,
  blueGain: 100,
};

export function clamp(value: unknown, min: number, max: number): number {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

export function num(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function direct(node: Element, name: string): Element | null {
  return [...node.children].find((child) => child.tagName === name) || null;
}

export function directAll(node: Element, name: string): Element[] {
  return [...node.children].filter((child) => child.tagName === name);
}

export function round(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

export function attributesOf(
  node: Element,
  excluded: string[] = [],
): Record<string, string> {
  return Object.fromEntries(
    [...node.attributes]
      .filter((attribute) => !excluded.includes(attribute.name))
      .map((attribute) => [attribute.name, String(attribute.value).slice(0, 2048)]),
  );
}

export function normalizeEffectId(value: unknown): string {
  return String(value || '')
    .replace(/^com\.alightcreative\.(?:effects\.)?/i, '')
    .slice(0, 300);
}

export function parseXml(xml: string): XMLDocument {
  if (typeof xml !== 'string' || !xml.trim()) {
    throw new Error('O arquivo XML está vazio');
  }
  if (new Blob([xml]).size > MAX_XML_SIZE) {
    throw new Error('O XML excede o limite de 10 MB');
  }
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) {
    throw new Error('DOCTYPE e entidades externas não são permitidos');
  }

  const document = new DOMParser().parseFromString(xml, 'application/xml');
  if (document.querySelector('parsererror')) {
    throw new Error('XML inválido ou malformado');
  }
  if (document.documentElement.tagName !== 'scene') {
    throw new Error('Este arquivo não contém uma cena <scene>');
  }
  return document;
}

export function parseXmlFragment(raw: string): Element | null {
  if (/<!DOCTYPE|<!ENTITY/i.test(raw)) return null;

  const parsed = new DOMParser().parseFromString(
    `<root>${raw}</root>`,
    'application/xml',
  );
  return parsed.querySelector('parsererror')
    ? null
    : parsed.documentElement.firstElementChild;
}

export function vector(value: unknown, count = 2): number[] {
  const parts = String(value || '')
    .split(',')
    .map((part) => num(part.trim(), 0));
  while (parts.length < count) parts.push(0);
  return parts.slice(0, count);
}

export function argbToHex(value: unknown): string {
  const raw = String(value || '').trim();
  if (/^#[0-9a-f]{8}$/i.test(raw)) return `#${raw.slice(3)}`;
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw;
  return '#ffffff';
}

export function hexToArgb(value: unknown): string {
  const raw = String(value || '#ffffff').trim();
  if (/^#[0-9a-f]{8}$/i.test(raw)) return raw.toUpperCase();
  return /^#[0-9a-f]{6}$/i.test(raw)
    ? `#FF${raw.slice(1)}`.toUpperCase()
    : '#FFFFFFFF';
}

export function normalizeEasing(value: unknown): string {
  const easing = String(value || 'linear').trim();
  if (!easing || easing === 'linear') return 'linear';

  const match = easing.match(
    /^cubicBezier\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)$/,
  );
  return match
    ? `cubicBezier ${match.slice(1).map((part) => num(part)).join(' ')}`
    : 'linear';
}

export function localPathFromUri(uri: string): string {
  try {
    const parsed = new URL(uri);
    if (parsed.protocol !== 'file:') return '';

    let pathname = decodeURIComponent(parsed.pathname).replace(/\//g, '\\');
    if (/^\\[A-Za-z]:/.test(pathname)) pathname = pathname.slice(1);
    return pathname;
  } catch {
    return '';
  }
}

export function mediaType(uri: string, mime = ''): string {
  const probe = `${mime} ${uri}`.toLowerCase();
  if (/audio|\.(mp3|wav|aac|m4a|ogg|flac)(?:$|[?#])/.test(probe)) {
    return 'audio';
  }
  if (/video|\.(mp4|mov|mkv|webm|avi)(?:$|[?#])/.test(probe)) {
    return 'video';
  }
  return 'image';
}

export function propertyData(node: Element): ExternalEffectProperty {
  const keyframes = directAll(node, 'kf')
    .slice(0, MAX_KEYFRAMES)
    .map((key) => ({
      time: num(key.getAttribute('t')),
      value: String(key.getAttribute('v') || '').slice(0, 2048),
      ...(key.hasAttribute('e')
        ? { easing: String(key.getAttribute('e')).slice(0, 2048) }
        : {}),
      attributes: attributesOf(key, ['t', 'v', 'e']),
    }));

  return {
    name: String(node.getAttribute('name') || '').slice(0, 200),
    type: String(node.getAttribute('type') || 'float').slice(0, 80),
    value: node.hasAttribute('value')
      ? String(node.getAttribute('value')).slice(0, 2048)
      : null,
    keyframes,
    attributes: attributesOf(node, ['name', 'type', 'value']),
  };
}

export function propertyValue(
  property: ExternalEffectProperty | undefined,
  fallback = 0,
): number {
  const value = property?.value ?? property?.keyframes?.[0]?.value;
  return num(String(value ?? fallback).split(',')[0], fallback);
}
