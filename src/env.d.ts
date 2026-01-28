/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // outras variáveis podem ser adicionadas aqui
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
