<script>
  import Icon from '@iconify/svelte'
  import { devices, fps, rollRegex, selectedDevice } from './shared.svelte'

  const fpsMax = 60
  const fpsStep = 10
  const fpsValues = Array.from({ length: fpsMax / fpsStep }, (_, i) => (i + 1) * fpsStep)

  let localRollRegex = rollRegex.value
</script>

<div class="flex flex-1 flex-col items-center gap-y-4">
  <fieldset class="fieldset bg-base-200 border-base-300 rounded-box w-xs gap-y-4 border p-4">
    <legend class="fieldset-legend">Camera</legend>

    <div class="space-y-2">
      <label for="camera-select" class="label">
        <span class="label-text">Pick a camera</span>
      </label>
      <select id="camera-select" class="select" bind:value={selectedDevice.id}>
        <option disabled>Pick a camera</option>
        {#each Object.entries(devices.label) as [deviceId, deviceLabel]}
          <option value={deviceId}>{deviceLabel}</option>
        {/each}
      </select>
    </div>

    <div class="space-y-2">
      <label for="fps-slider" class="label">
        <span class="label-text">FPS</span>
      </label>
      <input
        id="fps-slider"
        type="range"
        min={fpsStep}
        max={fpsMax}
        class="range"
        step={fpsStep}
        bind:value={fps.value}
      />
      <div class="flex justify-between pl-1.5 text-xs">
        {#each fpsValues as value}
          <div class="flex flex-col items-center">
            <span>|</span>
            <span>{value}</span>
          </div>
        {/each}
      </div>
    </div>
  </fieldset>

  <fieldset class="fieldset bg-base-200 border-base-300 rounded-box w-xs gap-y-2 border p-4">
    <legend class="fieldset-legend">Attendance</legend>

    <label for="roll-regex" class="label">
      <span class="label-text">Roll Regex</span>
    </label>

    <input
      id="roll-regex"
      type="text"
      placeholder="Enter Roll Regex"
      class="input"
      bind:value={localRollRegex}
    />

    <button class="btn btn-primary" onclick={() => (rollRegex.value = localRollRegex)}>
      <Icon icon="mdi:content-save" class="h-6 w-6" />
      <span class="mt-0.5">Save</span>
    </button>
  </fieldset>

  <fieldset class="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
    <legend class="fieldset-legend">Theme</legend>

    <div class="join join-horizontal mx-auto">
      <input
        type="radio"
        name="theme-buttons"
        class="btn theme-controller join-item"
        aria-label="System"
        value="default"
        checked
      />
      <input
        type="radio"
        name="theme-buttons"
        class="btn theme-controller join-item"
        aria-label="Light"
        value="cupcake"
      />
      <input
        type="radio"
        name="theme-buttons"
        class="btn theme-controller join-item"
        aria-label="Dark"
        value="dim"
      />
    </div>
  </fieldset>
</div>
