<script lang="ts">
  import { palette, type ColorName } from '../design/tokens'
  type Props = { color: 'coral' | 'piscina' | 'lilas' | 'menta' | 'mostarda' | 'rosa' | 'laranja' | 'petroleo'; name: string; size?: number; ring?: boolean }
  let { color, name, size = 30, ring = false }: Props = $props()
  const hex = $derived(palette[color as ColorName])
  function ink(h: string): string {
    const c = h.replace('#', '')
    if (c.length < 6) return '#11233f'
    const ch = (i: number) => parseInt(c.slice(i, i + 2), 16) / 255
    const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))
    const L = 0.2126 * lin(ch(0)) + 0.7152 * lin(ch(2)) + 0.0722 * lin(ch(4))
    return L < 0.46 ? '#f7f1e3' : '#11233f'
  }
  const initial = $derived((name.trim()[0] || '?').toUpperCase())
</script>

<span class="tok" class:ring style:--bg={hex} style:--fg={ink(hex)} style:width="{size}px" style:height="{size}px" style:font-size="{size * 0.46}px" role="img" aria-label={name}>{initial}</span>

<style>
  .tok { display: grid; place-items: center; border-radius: 50%; background: var(--bg); color: var(--fg); font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; flex: none; line-height: 1; }
  .tok.ring { box-shadow: 0 0 0 4px color-mix(in srgb, var(--bg) 30%, transparent); }
</style>
