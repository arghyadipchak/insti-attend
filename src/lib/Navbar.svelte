<script lang="ts">
  import Icon from '@iconify/svelte'

  import { cycleTheme, getThemeIcon, theme } from './settings.svelte'
  import { preferDark } from './system.svelte'

  let themeIcon = $derived(getThemeIcon(theme.value))
  let themeTooltip = $derived(
    theme.value === 'system'
      ? `Theme: System (${preferDark.value ? 'Dark' : 'Light'})`
      : `Theme: ${theme.value.charAt(0).toUpperCase() + theme.value.slice(1)}`
  )
</script>

<nav
  class="navbar bg-base-100/90 border-base-content/10 min-h-14 w-full border-b px-4 backdrop-blur-md"
>
  <div class="flex flex-1 items-center">
    <a href="/" class="flex items-center gap-x-2.5 transition-opacity hover:opacity-85">
      <img
        src="/logo.png"
        alt="InstiAttend Logo"
        class="h-7 w-7 rounded-lg object-contain shadow-xs"
      />
      <span class="text-base-content text-lg font-bold tracking-tight">InstiAttend</span>
      <span class="badge badge-neutral badge-xs font-mono font-medium opacity-80">
        v{__APP_VERSION__}
      </span>
    </a>
  </div>

  <div class="flex flex-none items-center gap-x-1">
    <button
      class="btn btn-ghost btn-circle btn-sm tooltip tooltip-bottom"
      data-tip={themeTooltip}
      onclick={cycleTheme}
      aria-label="Toggle theme"
    >
      <Icon icon={themeIcon} class="h-4.5 w-4.5" />
    </button>

    <a
      href={__APP_REPO__}
      target="_blank"
      rel="noopener noreferrer"
      class="btn btn-ghost btn-circle btn-sm tooltip tooltip-left"
      data-tip="GitHub Repository"
      aria-label="GitHub Repository"
    >
      <Icon icon="lucide:github" class="h-4.5 w-4.5" />
    </a>
  </div>
</nav>
