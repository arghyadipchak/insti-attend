<script lang="ts">
  import { selectComponent, selectedComponent } from './store'
</script>

<div class="dock bg-base-100">
  <button
    class:dock-active={$selectedComponent === 'scanner'}
    onclick={() => selectComponent('scanner')}
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
      ><path
        fill="currentColor"
        d="M18 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2m0 6H6V9h12M2 4h4V2H2a2 2 0 0 0-2 2v4h2zm20-2h-4v2h4v4h2V4a2 2 0 0 0-2-2M2 16H0v4a2 2 0 0 0 2 2h4v-2H2zm20 4h-4v2h4a2 2 0 0 0 2-2v-4h-2z"
      /></svg
    >
    <span class="dock-label">Scan ID</span>
  </button>

  <button
    class:dock-active={$selectedComponent === 'attendance'}
    onclick={() => selectComponent('attendance')}
  >
    <div class="indicator">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 256 256"
        ><g fill="currentColor"
          ><path d="m224 64l-96 32l-96-32l96-32Z" opacity="0.2" /><path
            d="m226.53 56.41l-96-32a8 8 0 0 0-5.06 0l-96 32a8 8 0 0 0-5.4 6.75A5 5 0 0 0 24 64v80a8 8 0 0 0 16 0V75.1l33.59 11.19a64 64 0 0 0 20.65 88.05c-18 7.06-33.56 19.83-44.94 37.29a8 8 0 1 0 13.4 8.74C77.77 197.25 101.57 184 128 184s50.23 13.25 65.3 36.37a8 8 0 0 0 13.4-8.74c-11.38-17.46-27-30.23-44.94-37.29a64 64 0 0 0 20.65-88l44.12-14.7a8 8 0 0 0 0-15.18ZM176 120a48 48 0 1 1-86.65-28.45l36.12 12a8 8 0 0 0 5.06 0l36.12-12A47.9 47.9 0 0 1 176 120m-48-32.43L57.3 64L128 40.43L198.7 64Z"
          /></g
        ></svg
      >
      <span class="badge badge-sm indicator-item bg-accent text-accent-content mt-1">8</span>
    </div>
    <span class="dock-label">Attendance</span>
  </button>

  <button
    class:dock-active={$selectedComponent === 'settings'}
    onclick={() => selectComponent('settings')}
  >
    <svg class="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
      ><g fill="currentColor" stroke-linejoin="miter" stroke-linecap="butt"
        ><circle
          cx="12"
          cy="12"
          r="3"
          fill="none"
          stroke="currentColor"
          stroke-linecap="square"
          stroke-miterlimit="10"
          stroke-width="2"
        ></circle><path
          d="m22,13.25v-2.5l-2.318-.966c-.167-.581-.395-1.135-.682-1.654l.954-2.318-1.768-1.768-2.318.954c-.518-.287-1.073-.515-1.654-.682l-.966-2.318h-2.5l-.966,2.318c-.581.167-1.135.395-1.654.682l-2.318-.954-1.768,1.768.954,2.318c-.287.518-.515,1.073-.682,1.654l-2.318.966v2.5l2.318.966c.167.581.395,1.135.682,1.654l-.954,2.318,1.768,1.768,2.318-.954c.518.287,1.073.515,1.654.682l.966,2.318h2.5l.966-2.318c.581-.167,1.135-.395,1.654-.682l2.318.954,1.768-1.768-.954-2.318c.287-.518.515-1.073.682-1.654l2.318-.966Z"
          fill="none"
          stroke="currentColor"
          stroke-linecap="square"
          stroke-miterlimit="10"
          stroke-width="2"
        ></path></g
      ></svg
    >
    <span class="dock-label">Settings</span>
  </button>
</div>
