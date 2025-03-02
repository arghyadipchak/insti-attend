<script>
  import Icon from '@iconify/svelte'
  import { devices, fps, rollRegex, selectedDevice, webhook } from './shared.svelte'

  const fpsMax = 60
  const fpsStep = 10
  const fpsValues = Array.from({ length: fpsMax / fpsStep }, (_, i) => (i + 1) * fpsStep)

  let localRollRegex = rollRegex.value
  let localWebhookUrl = webhook.url
  let localWebhookToken = webhook.authToken

  function saveRollRegex() {
    localRollRegex !== rollRegex.value && (rollRegex.value = localRollRegex)
  }

  function saveWebhook() {
    localWebhookUrl !== webhook.url && (webhook.url = localWebhookUrl)
    localWebhookToken !== webhook.authToken && (webhook.authToken = localWebhookToken)
  }
</script>

<div class="flex flex-1 flex-col items-center gap-y-4 py-4">
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
      <span class="badge badge-neutral badge-xs">Optional</span>
    </label>

    <div class="join">
      <input
        id="roll-regex"
        type="text"
        class="input join-item"
        placeholder="Enter Roll Regex"
        bind:value={localRollRegex}
      />
      <button class="btn btn-primary join-item" onclick={saveRollRegex}> Save </button>
    </div>
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

  <fieldset class="fieldset bg-base-200 border-base-300 rounded-box w-xs gap-y-4 border p-4">
    <legend class="fieldset-legend">WebHook</legend>

    <div class="space-y-2">
      <label for="webhook-url" class="label">
        <span class="label-text">URL</span>
      </label>
      <label class="input validator">
        <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <g
            stroke-linejoin="round"
            stroke-linecap="round"
            stroke-width="2.5"
            fill="none"
            stroke="currentColor"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </g>
        </svg>
        <input
          id="webhook-url"
          type="url"
          required
          placeholder="https://"
          pattern="^(https?://)?([a-zA-Z0-9]([a-zA-Z0-9\-].*[a-zA-Z0-9])?\.)+[a-zA-Z].*$"
          bind:value={localWebhookUrl}
        />
      </label>
      <p class="validator-hint hidden">Must be valid URL</p>
    </div>

    <div class="space-y-2">
      <label for="webhook-url" class="label">
        <span class="label-text"> Authorization </span>
        <span class="badge badge-neutral badge-xs">Optional</span>
      </label>
      <input
        id="webhook-auth"
        type="password"
        class="input"
        placeholder="Token"
        bind:value={localWebhookToken}
      />
    </div>

    <button class="btn bg-primary text-primary-content" onclick={saveWebhook}>
      <Icon icon="mdi:content-save" class="h-5 w-5" />
      <span class="mt-0.5">Save</span>
    </button>
  </fieldset>

  <span class="mt-auto flex gap-x-1">
    Made with
    <Icon icon="mdi:heart" class="mt-1 text-red-500" />
    by Arghyadip & Debojeet</span
  >
</div>
