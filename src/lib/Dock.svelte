<script lang="ts">
  import Icon from '@iconify/svelte'
  import { selectedComponent } from './store'
</script>

<nav class="dock bg-base-100 relative">
  <button
    class:dock-active={$selectedComponent === 'scanner'}
    onclick={() => selectedComponent.set('scanner')}
  >
    <Icon icon="mdi:credit-card-scan" class="h-6 w-6" />
    <span class="dock-label">Scan ID</span>
  </button>

  <button
    class:dock-active={$selectedComponent === 'attendance'}
    onclick={() => selectedComponent.set('attendance')}
  >
    <div class="indicator">
      <Icon icon="ph:student" class="h-6 w-6" />
      <span class="badge badge-sm indicator-item bg-accent text-accent-content mt-1">20</span>
    </div>
    <span class="dock-label">Attendance</span>
  </button>

  <button
    class:dock-active={$selectedComponent === 'settings'}
    onclick={() => selectedComponent.set('settings')}
  >
    <Icon icon="solar:settings-outline" class="h-6 w-6" />
    <span class="dock-label">Settings</span>
  </button>
</nav>
