<script lang="ts">
  import Icon from '@iconify/svelte'

  import { attendance } from './stores/attendance.svelte'
  import { currentEvent } from './stores/events.svelte'
  import { component } from './stores/system.svelte'

  let totalCount = $derived(Object.keys(attendance[currentEvent.id] ?? {}).length)
</script>

<nav
  class="dock bg-base-100 relative"
  style="height: calc(4rem + env(safe-area-inset-bottom) + 0.75rem); padding-bottom: calc(env(safe-area-inset-bottom) + 0.75rem);"
>
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
