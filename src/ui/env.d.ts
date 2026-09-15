/// <reference types="vite/client" />

declare module '*.vue' {
  import type {DefineComponent} from 'vue';
  const component:DefineComponent<Record<string,never>,Record<string,never>,unknown>;
  export default component;
}

interface Window {
  motionDesktop?:unknown;
  motionNativeExport?:unknown;
  motionExporter?:unknown;
  motionUiReady?:Promise<void>;
  motionEditor?:import('./app-controller').AppControllerContext;
  alightCompat?:unknown;
}
