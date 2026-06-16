<script lang="ts">
  import Background from './Background.svelte'
  import TopBar from './TopBar.svelte'
  import { game } from '../game/store.svelte'
  let { dim = false, children }: { dim?: boolean; children?: import('svelte').Snippet } = $props()

  // theme-color do chrome do navegador acompanha o tema ativo (movido do InRound)
  $effect(() => {
    if (typeof document === 'undefined') return
    const m = document.querySelector('meta[name="theme-color"]')
    if (m) m.setAttribute('content', game.theme === 'dark' ? '#0c1d3b' : '#f3e7d2')
  })
</script>

<div class="scene" class:theme-dark={game.theme === 'dark'} class:theme-light={game.theme === 'light'}>
  <Background theme={game.theme} {dim} />
  <TopBar theme={game.theme} sound={game.sound} onToggleTheme={() => game.toggleTheme()} onToggleSound={() => game.toggleSound()} />
  <main class="screen-main">{@render children?.()}</main>
</div>

<style>
  .scene {
    position: relative;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--bg-base);
    color: var(--text);
    transition: background 0.3s ease;
  }
  .screen-main {
    position: relative;
    z-index: 1;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
</style>
