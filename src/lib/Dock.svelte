<script lang="ts">
  import Icon from '@iconify/svelte'
  import { selectComponent, selectedComponent } from './store'
</script>

<div class="dock bg-base-100">
  <button
    class:dock-active={$selectedComponent === 'scanner'}
    onclick={() => selectComponent('scanner')}
  >
    <Icon icon="mdi:credit-card-scan" width="1.5rem" height="1.5rem" />
    <span class="dock-label">Scan ID</span>
  </button>

  <button
    class:dock-active={$selectedComponent === 'attendance'}
    onclick={() => selectComponent('attendance')}
  >
    <div class="indicator">
      <Icon icon="ph:student" width="1.5rem" height="1.5rem" />
      <span class="badge badge-sm indicator-item bg-accent text-accent-content mt-1">8</span>
    </div>
    <span class="dock-label">Attendance</span>
  </button>

  <button
    class:dock-active={$selectedComponent === 'settings'}
    onclick={() => selectComponent('settings')}
  >
    <Icon icon="solar:settings-outline" width="1.5rem" height="1.5rem" />
    <span class="dock-label">Settings</span>
  </button>
</div>
