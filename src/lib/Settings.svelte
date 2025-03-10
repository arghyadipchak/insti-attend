<script>
  import Icon from '@iconify/svelte'
  import { devices, fps, rollRegex, selectedDevice, showAlert, webhook } from './shared.svelte'

  const fpsMax = 60
  const fpsStep = 10
  const fpsValues = Array.from({ length: fpsMax / fpsStep }, (_, i) => (i + 1) * fpsStep)

  const urlPattern =
    import.meta.env.MODE === 'development'
      ? '^(https?://)?(localhost|([a-zA-Z0-9]([a-zA-Z0-9\\-].*[a-zA-Z0-9])?\\.)+[a-zA-Z]).*$'
      : '^(https?://)?([a-zA-Z0-9]([a-zA-Z0-9\\-].*[a-zA-Z0-9])?\\.)+[a-zA-Z].*$'

  let localRollRegex = rollRegex.value
  let localWebhookUrl = webhook.url
  let localWebhookToken = webhook.authToken

  function saveRollRegex() {
    if (localRollRegex === rollRegex.value) return

    rollRegex.value = localRollRegex
    showAlert('settings', 'Roll Regex Saved!')
  }

  async function testWebhook() {
    if (localWebhookUrl === '') return

    try {
      const response = await fetch(localWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localWebhookToken && {
            Authorization: `Bearer ${localWebhookToken}`
          })
        },
        body: '{}'
      })

      if (response.ok) showAlert('webhook-success', 'WebHook Success!')
      else
        showAlert('webhook-error', 'WebHook Failed!', `${response.status}: ${response.statusText}`)
    } catch {
      showAlert('webhook-error', 'WebHook Error!')
    }
  }

  function saveWebhook() {
    if (localWebhookUrl === webhook.url && localWebhookToken === webhook.authToken) return

    webhook.url = localWebhookUrl
    webhook.authToken = localWebhookToken
    showAlert('settings', 'WebHook Saved!')
  }
</script>

<div class="flex flex-1 flex-col items-center gap-y-4 overflow-x-auto py-4">
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
        <Icon icon="meteor-icons:link" />
        <input
          id="webhook-url"
          type="url"
          placeholder="https://"
          pattern={urlPattern}
          bind:value={localWebhookUrl}
        />
      </label>
      <p class="validator-hint hidden">Must be valid URL</p>
    </div>

    <div class="space-y-2">
      <label for="webhook-auth" class="label">
        <span class="label-text">Authorization</span>
        <span class="badge badge-neutral badge-xs">Optional</span>
      </label>
      <label class="input">
        <Icon icon="solar:key-bold" />
        <input id="webhook-auth" type="url" placeholder="Token" bind:value={localWebhookToken} />
      </label>
    </div>

    <div class="flex justify-evenly">
      <button class="btn bg-primary text-primary-content" onclick={testWebhook}>
        <Icon icon="mdi:webhook" class="h-5 w-5" />
        <span class="mt-0.5">Test</span>
      </button>

      <button class="btn bg-primary text-primary-content" onclick={saveWebhook}>
        <Icon icon="mdi:content-save" class="h-5 w-5" />
        <span class="mt-0.5">Save</span>
      </button>
    </div>
  </fieldset>

  <span class="mt-auto flex gap-x-1">
    Made with
    <Icon icon="mdi:heart" class="mt-1 text-red-500" />
    by Arghyadip & Debojeet
  </span>
</div>
