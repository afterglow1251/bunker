/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Bun runtime globals
declare interface ImportMeta {
  dir: string
}

declare const Bun: {
  file(path: string): Response
}
