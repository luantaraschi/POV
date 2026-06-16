<script lang="ts">
  import Background from './Background.svelte'
  import TopBar from './TopBar.svelte'
  import PauseSheet from './PauseSheet.svelte'
  import SettingsSheet from './SettingsSheet.svelte'
  import { game } from '../game/store.svelte'
  let { dim = false, children }: { dim?: boolean; children?: import('svelte').Snippet } = $props()

  let showPause = $state(false)
  let showSettings = $state(false)

  const inGameScreens: typeof game.screen[] = ['roundIntro', 'inRound', 'scoreboard']

  // theme-color do chrome do navegador acompanha o tema ativo (movido do InRound)
  $effect(() => {
    if (typeof document === 'undefined') return
    const m = document.querySelector('meta[name="theme-color"]')
    if (m) m.setAttribute('content', game.theme === 'dark' ? '#0c1d3b' : '#f3e7d2')
  })

  // When navigating away (e.g. "Como jogar" causes screen change), close the pause sheet
  $effect(() => {
    if (!inGameScreens.includes(game.screen)) {
      showPause = false
    }
  })
</script>

<div class="scene" class:theme-dark={game.theme === 'dark'} class:theme-light={game.theme === 'light'}>
  <Background theme={game.theme} {dim} />
  <TopBar
    theme={game.theme}
    sound={game.sound}
    onToggleTheme={() => game.toggleTheme()}
    onToggleSound={() => game.toggleSound()}
    onMenu={inGameScreens.includes(game.screen) ? () => (showPause = true) : undefined}
    onHome={game.screen !== 'home' ? () => game.goHome() : undefined}
  />
  <main class="screen-main">{@render children?.()}</main>

  <!-- PauseSheet first so SettingsSheet stacks on top (higher z-index via DOM order) -->
  <PauseSheet
    open={showPause}
    onClose={() => (showPause = false)}
    onSettings={() => (showSettings = true)}
    onHowToPlay={() => { showPause = false; game.openHowToPlay() }}
  />
  <SettingsSheet
    open={showSettings}
    onClose={() => (showSettings = false)}
  />
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
