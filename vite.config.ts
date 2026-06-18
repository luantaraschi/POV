import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { execSync } from 'node:child_process'

// Carimbo de build (sha curto do git + horário) — exposto como __APP_BUILD__ para o app
// logar no console, pra sempre dar pra confirmar QUAL versão está carregada.
function buildStamp(): string {
  let sha = 'dev'
  try {
    sha = execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    /* fora de um repo git — mantém 'dev' */
  }
  const time = new Date().toISOString().slice(0, 16).replace('T', ' ')
  return `${sha} · ${time}`
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  define: {
    __APP_BUILD__: JSON.stringify(buildStamp()),
  },
  server: {
    host: true, // expõe na rede local para testar no celular
    headers: {
      // Em DEV nunca cacheia: evita o navegador servir um bundle velho da MESMA porta
      // depois que o dev server reinicia com código novo (causa do "flash de versão antiga").
      'Cache-Control': 'no-store',
    },
  },
})
