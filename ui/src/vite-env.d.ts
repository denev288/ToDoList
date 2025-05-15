/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APIURL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
