<script lang="ts">
  import Icon from '@iconify/svelte'
  import {
    devices,
    fps,
    rollRegex,
    selectedDevice,
    showAlert,
    theme,
    webhook
  } from './shared.svelte'
  import { download, postWebhook, toISOStringTZ } from './utils'

  const fpsMax = 60
  const fpsStep = 10
  const fpsValues = Array.from({ length: fpsMax / fpsStep }, (_, i) => (i + 1) * fpsStep)

  const urlPattern =
    import.meta.env.MODE === 'development'
      ? '^(https?://)?(localhost|([a-zA-Z0-9]([a-zA-Z0-9\\-].*[a-zA-Z0-9])?\\.)+[a-zA-Z]).*$'
      : '^(https?://)?([a-zA-Z0-9]([a-zA-Z0-9\\-].*[a-zA-Z0-9])?\\.)+[a-zA-Z].*$'

  let localRollRegex = ''
  let localWebhookUrl = ''
  let localWebhookToken = ''
  let fileInput: HTMLInputElement

  updateLocal()

  function updateLocal() {
    localRollRegex = rollRegex.value
    localWebhookUrl = webhook.url
    localWebhookToken = webhook.authToken
  }

  function saveRollRegex() {
    if (localRollRegex === rollRegex.value) return

    rollRegex.value = localRollRegex
    showAlert('settings', 'Roll Regex Saved!')
  }

  async function testWebhook() {
    if (localWebhookUrl !== '') postWebhook(localWebhookUrl, localWebhookToken, '{}')
  }

  async function saveWebhook() {
    if (localWebhookUrl === webhook.url && localWebhookToken === webhook.authToken) return

    webhook.url = localWebhookUrl
    webhook.authToken = localWebhookToken
    showAlert('settings', 'WebHook Saved!')
  }

  type Backup = {
    rollRegex: string
    webhook?: {
      url: string
      authToken?: string
    }
  }

  async function importBackup(event: Event) {
    const target = event.target as HTMLInputElement
    if (!target.files || target.files.length === 0) return

    const file = target.files[0]
    const text = await file.text()

    try {
      const backup = JSON.parse(text) as Backup

      rollRegex.value = backup.rollRegex
      if (backup.webhook) {
        webhook.url = backup.webhook?.url
        webhook.authToken = backup.webhook?.authToken || ''
      }

      updateLocal()
      showAlert('settings', 'Backup Imported Successfully!')
    } catch (error) {
      showAlert('webhook-error', 'Invalid Backup File!')
    }
  }

  function exportBackup() {
    const backup: Backup = {
      rollRegex: rollRegex.value,
      webhook: webhook
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json;charset=utf-8;'
    })
    const fname = `insti-attend-backup-${toISOStringTZ(new Date())}.json`

    download(blob, fname)
    showAlert('download', 'Downloading Backup!', fname)
  }
</script>

<div class="bg-base-200 flex flex-1 flex-col items-center gap-y-4 overflow-x-auto pb-4">
  <fieldset class="fieldset bg-base-300 rounded-box w-xs gap-y-4 border border-gray-700 p-4">
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

  <fieldset class="fieldset bg-base-300 rounded-box w-xs gap-y-4 border border-gray-700 p-4">
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
      <button class="btn btn-primary join-item" onclick={saveRollRegex}>Save</button>
    </div>
  </fieldset>

  <fieldset class="fieldset bg-base-300 rounded-box w-xs gap-y-4 border border-gray-700 p-4">
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

  <fieldset class="fieldset bg-base-300 rounded-box w-xs gap-y-4 border border-gray-700 p-4">
    <legend class="fieldset-legend">Theme</legend>

    <div class="join join-horizontal mx-auto grid grid-cols-3">
      <input
        type="radio"
        name="theme-buttons"
        class="btn theme-controller join-item !outline-0"
        class:btn-primary={theme.value === 'system'}
        aria-label="System"
        value="system"
        bind:group={theme.value}
      />
      <input
        type="radio"
        name="theme-buttons"
        class="btn theme-controller join-item !outline-0"
        class:btn-primary={theme.value === 'light'}
        aria-label="Light"
        value="light"
        bind:group={theme.value}
      />
      <input
        type="radio"
        name="theme-buttons"
        class="btn theme-controller join-item !outline-0"
        class:btn-primary={theme.value === 'dark'}
        aria-label="Dark"
        value="dark"
        bind:group={theme.value}
      />
    </div>
  </fieldset>

  <fieldset class="fieldset bg-base-300 rounded-box w-xs gap-y-4 border border-gray-700 p-4">
    <legend class="fieldset-legend">Sync</legend>

    <input
      bind:this={fileInput}
      type="file"
      accept=".json,application/json"
      class="hidden"
      onchange={importBackup}
    />

    <div class="flex justify-evenly">
      <button class="btn bg-primary text-primary-content" onclick={() => fileInput.click()}>
        <Icon icon="fa6-solid:file-import" class="h-4 w-4" />
        <span class="mt-0.5">Import</span>
      </button>

      <button class="btn bg-primary text-primary-content" onclick={exportBackup}>
        <Icon icon="fa6-solid:file-export" class="h-4 w-4" />
        <span class="mt-0.5">Export</span>
      </button>
    </div>
  </fieldset>

  <span class="mt-auto flex gap-x-1">
    Made with
    <Icon icon="mdi:heart" class="mt-1 text-red-500" />
    by
    <a href="https://github.com/arghyadipchak" class="group">
      Arghyadip
      <span class="bg-accent block h-0.5 max-w-0 transition-all duration-500 group-hover:max-w-full"
      ></span>
    </a>
    &
    <a href="https://github.com/rickydebojeet" class="group">
      Debojeet
      <span class="bg-accent block h-0.5 max-w-0 transition-all duration-500 group-hover:max-w-full"
      ></span>
    </a>
  </span>
</div>
