<script lang="ts">
  import Icon from '@iconify/svelte'

  import { alertClass, alertIcon, alerts, removeAlert } from './alert.svelte'
</script>

<div class="toast toast-top toast-center" style="padding-top: env(safe-area-inset-top) !important;">
  {#each Object.entries(alerts) as [id, alert]}
    <div role="alert" class={`alert ${alertClass(alert.type)} gap-x-2`}>
      <Icon icon={alertIcon(alert.type)} class="h-5 w-5" />
      <span>
        {alert.text}
        {#if alert.subtext}
          <br />
          <span class="text-xs">{alert.subtext}</span>
        {/if}
      </span>
      <Icon icon="mdi:close" class="h-5 w-5" onclick={() => removeAlert(id)} />
    </div>
  {/each}
</div>
