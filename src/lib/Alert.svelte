<script lang="ts">
  import Icon from '@iconify/svelte'
  import { alerts, removeAlert } from './shared.svelte'
</script>

<div class="toast toast-top toast-center">
  {#each Object.entries(alerts) as [id, alert]}
    {#if alert.type === 'settings'}
      <div role="alert" class="alert alert-success gap-x-2">
        <Icon icon="mdi:content-save" class="h-5 w-5" />
        <span>
          {alert.text}
          {#if alert.subtext}
            <br />
            <span class="text-xs">{alert.subtext}</span>
          {/if}
        </span>
        <Icon icon="mdi:close" class="h-5 w-5" onclick={() => removeAlert(id)} />
      </div>
    {:else if alert.type === 'download'}
      <div role="alert" class="alert alert-success gap-x-2">
        <Icon icon="fa6-solid:download" class="h-5 w-5" />
        <span>
          {alert.text}
          {#if alert.subtext}
            <br />
            <span class="text-xs">{alert.subtext}</span>
          {/if}
        </span>
        <Icon icon="mdi:close" class="h-5 w-5" onclick={() => removeAlert(id)} />
      </div>
    {:else if alert.type === 'webhook-success'}
      <div role="alert" class="alert alert-success gap-x-2">
        <Icon icon="fa-solid:sync-alt" class="h-5 w-5" />
        <span>
          {alert.text}
          {#if alert.subtext}
            <br />
            <span class="text-xs">{alert.subtext}</span>
          {/if}
        </span>
        <Icon icon="mdi:close" class="h-5 w-5" onclick={() => removeAlert(id)} />
      </div>
    {:else if alert.type === 'webhook-error'}
      <div role="alert" class="alert alert-error gap-x-2">
        <Icon icon="mingcute:alert-line" class="h-5 w-5" />
        <span>
          {alert.text}
          {#if alert.subtext}
            <br />
            <span class="text-xs">{alert.subtext}</span>
          {/if}
        </span>
        <Icon icon="mdi:close" class="h-5 w-5" onclick={() => removeAlert(id)} />
      </div>
    {/if}
  {/each}
</div>
