<script lang="ts">
  import Icon from '@iconify/svelte'

  import { showAlert } from './alert.svelte'
  import {
    allowlist,
    autofocus,
    blocklist,
    devices,
    fps,
    overwrite,
    rollRegex,
    selectedDevice,
    setRollRegex,
    theme,
    THEME_OPTIONS,
    webhook
  } from './settings.svelte'
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
    localRollRegex = rollRegex.value?.source || ''
    localWebhookUrl = webhook.url
    localWebhookToken = webhook.authToken
  }

  function saveRollRegex() {
    if (localRollRegex === (rollRegex.value?.source || '')) return

    setRollRegex(localRollRegex)
      ? showAlert('settings', 'Roll Regex Saved!')
      : showAlert('error', 'Invalid Roll Regex!')
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
    rollRegex?: string
    allowlist?: string[]
    blocklist?: string[]
    overwrite?: boolean
    webhook?: {
      url: string
      authToken?: string
    }
  }

  const maxListCount = 99_999
  const acceptListFiles = 'text/plain,application/json,text/csv'
  const csvHeader = new Set(['roll', 'rollno', 'rollnumber'])

  function formatListCount(targetList: typeof allowlist | typeof blocklist): string {
    const count = targetList.value.size
    return count > maxListCount ? `${maxListCount}+` : count.toString()
  }

  function resetList(targetList: typeof allowlist | typeof blocklist) {
    if (targetList.value.size === 0) return

    targetList.value = new Set()

    if (targetList === allowlist) showAlert('settings', 'Allowlist Cleared!')
    else showAlert('settings', 'Blocklist Cleared!')
  }

  function normalizeList(items: string[]): Set<string> {
    return new Set(items.map(item => item.trim()).filter(item => item.length > 0))
  }

  function addToList(newItems: string[], targetList: typeof allowlist | typeof blocklist) {
    const normalized = normalizeList(newItems)
    if (normalized.size === 0) {
      showAlert('error', 'Empty List!')
    } else {
      targetList.value = targetList.value.union(normalized)
      showAlert('settings', 'List Imported Successfully!')
    }
  }

  async function importList(event: Event, targetList: typeof allowlist | typeof blocklist) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (!file) return
    if (!new Set(acceptListFiles.split(',')).has(file.type)) {
      target.value = ''
      showAlert('error', 'Invalid File Type!', 'Only plain text, CSV, or JSON files are allowed')
      return
    }

    const text = (await file.text()).trim()
    target.value = ''

    if (file.type === 'application/json') {
      try {
        const parsed = JSON.parse(text)
        if (!Array.isArray(parsed) || parsed.some(item => typeof item !== 'string')) {
          return showAlert('error', 'Invalid JSON Format!', 'JSON must contain an array of strings')
        }

        addToList(parsed, targetList)
      } catch {
        showAlert('error', 'Invalid JSON File!', 'JSON must contain an array of strings')
      }
    } else {
      let lines = text.split(/[\n\r]+/)

      if (file.type === 'text/csv') {
        if (lines[0].includes(',')) {
          return showAlert('error', 'Invalid CSV Format!', 'CSV must contain a single column')
        }
        if (csvHeader.has(lines[0].trim().toLowerCase())) {
          lines = lines.slice(1)
        }
      }

      addToList(lines, targetList)
    }
  }

  async function importBackup(event: Event) {
    const target = event.target as HTMLInputElement
    if (!target.files || target.files.length === 0) return

    const file = target.files[0]
    const text = await file.text()
    target.value = ''

    try {
      const backup = JSON.parse(text) as Backup
      let partial = false

      if (typeof backup.rollRegex === 'string') {
        if (!setRollRegex(backup.rollRegex)) {
          showAlert('error', 'Invalid Roll Regex in Backup!')
          partial = true
        }
      }

      if (Array.isArray(backup.allowlist)) {
        allowlist.value = normalizeList(
          backup.allowlist.filter((item): item is string => typeof item === 'string')
        )
      }

      if (Array.isArray(backup.blocklist)) {
        blocklist.value = normalizeList(
          backup.blocklist.filter((item): item is string => typeof item === 'string')
        )
      }

      if (typeof backup.overwrite === 'boolean') {
        overwrite.value = backup.overwrite
      }

      if (backup.webhook) {
        webhook.url = backup.webhook?.url || ''
        webhook.authToken = backup.webhook?.authToken || ''
      }

      updateLocal()

      partial
        ? showAlert('warning', 'Backup Imported Partially!')
        : showAlert('settings', 'Backup Imported Successfully!')
    } catch (error) {
      showAlert('error', 'Invalid Backup File!')
    }
  }

  function exportBackup() {
    const backup: Backup = {
      rollRegex: rollRegex.value?.source || '',
      allowlist: Array.from(allowlist.value),
      blocklist: Array.from(blocklist.value),
      overwrite: overwrite.value,
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

<div
  class="bg-base-200 flex w-full flex-1 flex-col items-center gap-y-4 overflow-x-hidden overflow-y-auto pb-4"
>
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

    <label class="label justify-between">
      <span class="label-text">Autofocus</span>
      <input type="checkbox" bind:checked={autofocus.value} class="toggle toggle-primary" />
    </label>

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

    <label for="allowlist-file" class="label justify-between">
      <span class="label-text">Allowlist</span>
      <div class="flex items-center gap-x-2">
        <div class="badge badge-info badge-sm badge-soft">{formatListCount(allowlist)}</div>
        <button
          type="button"
          class="btn btn-secondary btn-sm btn-soft"
          onclick={() => resetList(allowlist)}
        >
          Reset
        </button>
      </div>
    </label>

    <input
      id="allowlist-file"
      type="file"
      class="file-input file-input-primary"
      accept={acceptListFiles}
      onchange={event => importList(event, allowlist)}
    />

    <label for="blocklist-file" class="label justify-between">
      <span class="label-text">Blocklist</span>
      <div class="flex items-center gap-x-2">
        <div class="badge badge-info badge-sm badge-soft">{formatListCount(blocklist)}</div>
        <button
          type="button"
          class="btn btn-secondary btn-sm btn-soft"
          onclick={() => resetList(blocklist)}
        >
          Reset
        </button>
      </div>
    </label>

    <input
      id="blocklist-file"
      type="file"
      class="file-input file-input-primary"
      accept={acceptListFiles}
      onchange={event => importList(event, blocklist)}
    />

    <label class="label justify-between">
      <span class="label-text">Overwrite</span>
      <input type="checkbox" bind:checked={overwrite.value} class="toggle toggle-primary" />
    </label>
  </fieldset>

  <fieldset class="fieldset bg-base-300 rounded-box w-xs gap-y-4 border border-gray-700 p-4">
    <legend class="fieldset-legend">WebHook</legend>

    <div class="space-y-2">
      <label for="webhook-url" class="label">
        <span class="label-text">URL</span>
      </label>
      <label class="input validator">
        <Icon icon="lucide:link-2" />
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
        <Icon icon="lucide:key-round" />
        <input id="webhook-auth" type="url" placeholder="Token" bind:value={localWebhookToken} />
      </label>
    </div>

    <div class="flex justify-evenly">
      <button
        class="btn bg-primary text-primary-content inline-flex items-center gap-x-2"
        onclick={testWebhook}
      >
        <Icon icon="lucide:webhook" class="h-4.5 w-4.5" />
        <span>Test</span>
      </button>

      <button
        class="btn bg-primary text-primary-content inline-flex items-center gap-x-2"
        onclick={saveWebhook}
      >
        <Icon icon="lucide:save" class="h-4.5 w-4.5" />
        <span>Save</span>
      </button>
    </div>
  </fieldset>

  <fieldset class="fieldset bg-base-300 rounded-box w-xs gap-y-4 border border-gray-700 p-4">
    <legend class="fieldset-legend">Theme</legend>

    <div class="bg-base-200 grid w-full grid-cols-3 gap-1 rounded-lg p-1">
      {#each THEME_OPTIONS as opt}
        <button
          type="button"
          class="btn btn-sm flex items-center justify-center gap-x-1.5 border-0 px-2 transition-all duration-200"
          class:btn-primary={theme.value === opt.value}
          class:btn-ghost={theme.value !== opt.value}
          onclick={() => (theme.value = opt.value)}
        >
          <Icon icon={opt.icon} class="h-4 w-4 shrink-0" />
          <span class="text-sm font-medium">{opt.label}</span>
        </button>
      {/each}
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
      <button
        class="btn bg-primary text-primary-content inline-flex items-center gap-x-2"
        onclick={() => fileInput.click()}
      >
        <Icon icon="lucide:file-down" class="h-4.5 w-4.5" />
        <span>Import</span>
      </button>

      <button
        class="btn bg-primary text-primary-content inline-flex items-center gap-x-2"
        onclick={exportBackup}
      >
        <Icon icon="lucide:file-up" class="h-4.5 w-4.5" />
        <span>Export</span>
      </button>
    </div>
  </fieldset>

  <fieldset class="fieldset bg-base-300 rounded-box w-xs gap-y-3 border border-gray-700 p-4">
    <legend class="fieldset-legend">About</legend>

    <div class="flex items-center justify-between">
      <span class="text-sm font-semibold">InstiAttend</span>
      <span class="badge badge-primary badge-xs">v{__APP_VERSION__}</span>
    </div>

    <a
      href={__APP_REPO__}
      target="_blank"
      rel="noopener noreferrer"
      class="btn btn-neutral btn-sm flex w-full items-center justify-center gap-x-2"
    >
      <Icon icon="lucide:github" class="h-4 w-4" />
      <span>GitHub Repository</span>
      <Icon icon="lucide:external-link" class="h-3 w-3 opacity-60" />
    </a>

    <div class="flex flex-col gap-y-2">
      <span class="text-base-content/70 text-xs font-medium">Developers</span>

      {#each __APP_DEVELOPERS__ as dev}
        <div class="bg-base-200 flex items-center justify-between rounded-lg px-3 py-2">
          <span class="text-sm font-medium">{dev.name}</span>
          <div class="flex items-center gap-x-1">
            {#if dev.url}
              <a
                href={dev.url}
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-ghost btn-xs btn-circle"
                aria-label="{dev.name}'s GitHub"
              >
                <Icon icon="lucide:github" class="h-4 w-4" />
              </a>
            {/if}
            {#if dev.website}
              <a
                href={dev.website}
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-ghost btn-xs btn-circle"
                aria-label="{dev.name}'s Website"
              >
                <Icon icon="lucide:globe" class="h-4 w-4" />
              </a>
            {/if}
            {#if dev.email}
              <a
                href="mailto:{dev.email}"
                class="btn btn-ghost btn-xs btn-circle"
                aria-label="Email {dev.name}"
              >
                <Icon icon="lucide:mail" class="h-4 w-4" />
              </a>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </fieldset>
</div>
