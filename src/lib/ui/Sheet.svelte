<script lang="ts">
  import { tick } from 'svelte'
  type Props = { open: boolean; onClose: () => void; ariaLabel: string; variant?: 'sheet' | 'modal'; children?: import('svelte').Snippet }
  let { open, onClose, ariaLabel, variant = 'modal', children }: Props = $props()
  let dialogEl: HTMLDivElement | null = $state(null)
  let opener: Element | null = null

  function focusables(): HTMLElement[] {
    if (!dialogEl) return []
    return [...dialogEl.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])'
    )]
  }
  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') { e.stopPropagation(); onClose(); return }
    if (e.key !== 'Tab') return
    const f = focusables(); if (!f.length) return
    const first = f[0], last = f[f.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }
  $effect(() => {
    if (open) {
      opener = document.activeElement
      tick().then(() => focusables()[0]?.focus())
    } else if (opener instanceof HTMLElement) {
      opener.focus(); opener = null
    }
  })
</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="scrim {variant}" onclick={(e) => { if (e.target === e.currentTarget) onClose() }}>
    <div class="dialog {variant}" bind:this={dialogEl} role="dialog" aria-modal="true" aria-label={ariaLabel} onkeydown={onKeydown} tabindex="-1">
      {#if variant === 'sheet'}<div class="grip" aria-hidden="true"></div>{/if}
      {@render children?.()}
    </div>
  </div>
{/if}

<style>
  .scrim { position: fixed; inset: 0; z-index: 20; background: rgba(7,13,28,.6); backdrop-filter: blur(4px); display: grid; }
  .scrim.modal { place-items: center; padding: var(--sp-5); }
  .scrim.sheet { align-items: end; }
  .dialog { background: linear-gradient(180deg, var(--console-top), var(--console-bot)); color: var(--text); box-shadow: var(--elev-3); overscroll-behavior: contain; }
  .dialog.modal { width: min(380px, 92vw); border-radius: var(--r-5); padding: var(--sp-5); }
  .dialog.sheet { width: 100%; border-radius: var(--r-5) var(--r-5) 0 0; padding: var(--sp-3) var(--sp-5) max(var(--sp-5), env(safe-area-inset-bottom)); }
  .grip { width: 40px; height: 5px; border-radius: 3px; background: rgba(255,255,255,.22); margin: 0 auto var(--sp-3); }
  @media (prefers-reduced-motion: no-preference) { .scrim { animation: fade .18s ease both } }
  @keyframes fade { from { opacity: 0 } to { opacity: 1 } }
</style>
