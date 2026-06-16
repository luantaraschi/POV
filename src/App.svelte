<script lang="ts">
  import { game } from './lib/game/store.svelte'
  import Shell from './lib/ui/Shell.svelte'
  import Home from './lib/screens/Home.svelte'
  import HowToPlay from './lib/screens/HowToPlay.svelte'
  import Setup from './lib/screens/Setup.svelte'
  import RoundIntro from './lib/screens/RoundIntro.svelte'
  import InRound from './lib/screens/InRound.svelte'
  import Scoreboard from './lib/screens/Scoreboard.svelte'
  import GameOver from './lib/screens/GameOver.svelte'
  const dim = $derived(game.screen === 'inRound' && game.phase === 'reveal')
</script>

<Shell {dim}>
  {#if game.screen === 'home'}<Home />
  {:else if game.screen === 'howToPlay'}<HowToPlay />
  {:else if game.screen === 'setup'}<Setup />
  {:else if game.screen === 'roundIntro'}<RoundIntro />
  {:else if game.screen === 'inRound'}<InRound />
  {:else if game.screen === 'scoreboard'}<Scoreboard />
  {:else if game.screen === 'gameOver'}<GameOver />
  {/if}
</Shell>
