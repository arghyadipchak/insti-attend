<script>
  import Icon from '@iconify/svelte'
</script>

<nav class="navbar bg-base-100">
  <div class="flex-1">
    <a class="btn btn-ghost text-xl" href={import.meta.env.BASE_URL}>
      InstiAttend
      <span class="text-primary text-xs">{__APP_VERSION__}</span>
    </a>
  </div>
  <div class="flex-none">
    <a href="https://github.com/arghyadipchak/insti-attend" class="btn btn-ghost">
      <Icon icon="akar-icons:github-fill" class="h-5 w-5" />
    </a>
  </div>
</nav>
