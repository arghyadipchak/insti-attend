<script>
  import Icon from '@iconify/svelte'
</script>

<div class="flex flex-col items-center space-y-4">
  <fieldset class="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-3">
    <legend class="fieldset-legend">Camera Configurations</legend>

    <label for="camera-select" class="label">
      <span class="label-text">Pick a camera</span>
    </label>
    <select id="camera-select" class="select">
      <option disabled>Pick a camera</option>
      <option selected>Inbuilt Webcam</option>
      <option>Back Camera</option>
      <option>Front Camera</option>
    </select>

    <div class="mt-2 w-full max-w-xs">
      <label for="fps-slider" class="label">
        <span class="label-text">FPS</span>
      </label>
      <input id="fps-slider" type="range" min="0" max="60" value="60" class="range" step="10" />
      <div class="mt-2 flex justify-between px-2.5 text-xs">
        <span>|</span>
        <span>|</span>
        <span>|</span>
        <span>|</span>
        <span>|</span>
        <span>|</span>
        <span>|</span>
      </div>
      <div class="mt-2 flex justify-between px-2.5 text-xs">
        <span>1</span>
        <span>10</span>
        <span>20</span>
        <span>30</span>
        <span>40</span>
        <span>50</span>
        <span>60</span>
      </div>
    </div>
  </fieldset>

  <fieldset class="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-3">
    <legend class="fieldset-legend">Attendance Configurations</legend>

    <label for="roll-regex" class="label">
      <span class="label-text">Roll Regex</span>
    </label>
    <input id="roll-regex" type="text" placeholder="Enter Roll Regex" class="input" />
  </fieldset>

  <fieldset class="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-3">
    <legend class="fieldset-legend">Theme Configurations</legend>
    <div class="flex space-x-4">
      <label class="label cursor-pointer">
        <input type="radio" name="theme" value="system" class="radio" checked />
        <span class="label-text">System</span>
      </label>
      <label class="label cursor-pointer">
        <input type="radio" name="theme" value="light" class="radio" />
        <span class="label-text">Light</span>
      </label>
      <label class="label cursor-pointer">
        <input type="radio" name="theme" value="dark" class="radio" />
        <span class="label-text">Dark</span>
      </label>
    </div>
  </fieldset>

    <button class="btn btn-primary">
        <Icon icon="mdi:content-save" height="1.2rem" />
        <span>Save Settings</span>
</div>
