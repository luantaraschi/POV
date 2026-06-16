<script lang="ts">
  import { game } from './lib/game/store.svelte'
  import InRound from './lib/screens/InRound.svelte'
</script>

{#if game.screen === 'inRound'}<InRound />{/if}
