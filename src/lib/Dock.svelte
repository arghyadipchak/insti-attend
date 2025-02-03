<script lang="ts">
  import Icon from '@iconify/svelte'
  import { attendance, component } from './shared.svelte'

  let totalCount = $derived(Object.keys(attendance).length)
</script>

<nav class="dock bg-base-100 relative">
  <button
    class:dock-active={component.selected === 'scanner'}
    onclick={() => (component.selected = 'scanner')}
  >
    <Icon icon="mdi:credit-card-scan" class="h-6 w-6" />
    <span class="dock-label">Scan ID</span>
  </button>

  <button
    class:dock-active={component.selected === 'attendance'}
    onclick={() => (component.selected = 'attendance')}
  >
    <div class="indicator">
      <Icon icon="ph:student" class="h-6 w-6" />
      {#if totalCount > 0}
        <span class="badge badge-sm indicator-item bg-accent text-accent-content mt-1">
          {totalCount}
        </span>
      {/if}
    </div>
    <span class="dock-label">Attendance</span>
  </button>

  <button
    class:dock-active={component.selected === 'settings'}
    onclick={() => (component.selected = 'settings')}
  >
    <Icon icon="solar:settings-outline" class="h-6 w-6" />
    <span class="dock-label">Settings</span>
  </button>
</nav>
