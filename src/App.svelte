<script lang="ts">
  import { game } from './lib/game/store.svelte'
  import Shell from './lib/ui/Shell.svelte'
  import Home from './lib/screens/Home.svelte'
  import HowToPlay from './lib/screens/HowToPlay.svelte'
  import Setup from './lib/screens/Setup.svelte'
  import InRound from './lib/screens/InRound.svelte'
  import GameOver from './lib/screens/GameOver.svelte'
  import { fade } from 'svelte/transition'
  const dim = $derived(game.screen === 'inRound' && game.phase === 'reveal')
</script>

<Shell {dim}>
  {#key game.screen}
    <div
      class="screen-anim"
      in:fade={{ duration: game.reduce ? 0 : 170 }}
    >
      {#if game.screen === 'home'}<Home />
      {:else if game.screen === 'howToPlay'}<HowToPlay />
      {:else if game.screen === 'setup'}<Setup />
      {:else if game.screen === 'inRound'}<InRound />
      {:else if game.screen === 'gameOver'}<GameOver />
      {/if}
    </div>
  {/key}
</Shell>

<style>
  /* Flex passthrough: don't disrupt the Shell's .screen-main flex column */
  .screen-anim {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
</style>
