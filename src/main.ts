import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

// Carimbo de build no console — confirma qual versão está carregada (diagnóstico de cache).
console.log(
  `%cPOV%c build ${__APP_BUILD__}`,
  'font-weight:800;color:#e25744',
  'color:#8aa0c8',
)

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
