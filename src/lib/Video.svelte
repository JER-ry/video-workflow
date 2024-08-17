<!-- https://svelte.dev/repl/media-elements -->

<script>
  import { clamp, format, draggable } from "$lib/utils.js"

  // These values are bound to properties of the video
  export let src

  export let duration
  export let time = 0
  export let paused = true

  let loading = false
  let showInfo = true
  let showInfoTimeout

  let video

  export function playOrPause(toPlay) {
    if (toPlay) video.play()
    else video.pause()
  }

  export function triggerInfo(t = 2000) {
    if (t > 0) {
      // fade out after t second(s) of inactivity
      clearTimeout(showInfoTimeout)
      showInfoTimeout = setTimeout(() => (showInfo = false), t)
      showInfo = true
    } else showInfo = true
  }

  function handleMove(e) {
    triggerInfo()

    if (!duration) return // video not loaded yet

    if (e.detail.time > 200) {
      const { left, right } = this.getBoundingClientRect()
      const parentWidth = right - left
      time = clamp(time / duration + e.detail.dx / parentWidth, 0, 1) * duration
    }
  }

  function handleUp(e) {
    if (e.detail.time <= 200) {
      if (paused) video.play()
      else video.pause()

      triggerInfo()
    }
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  class="transform overflow-clip shadow-center"
  use:draggable
  on:mouseover={triggerInfo}
  on:dragmove|preventDefault|stopPropagation={handleMove}
  on:dragend|preventDefault|stopPropagation={handleUp}>
  <video
    class="w-full"
    preload="auto"
    {src}
    bind:this={video}
    bind:currentTime={time}
    bind:duration
    bind:paused>
    <!-- on:waiting={() => (loading = true)}
    on:loadeddata={() => (loading = false)}
    on:playing={() => (loading = false)} -->
    <track kind="captions" />
  </video>
  <div
    class="absolute top-0 w-full p-3 content-center text-white bg-gradient-to-b from-black/50 to-black/0 transition-opacity select-none"
    style="opacity: {duration && showInfo ? 1 : 0}">
    <b class="text-xl">{format(time)} / {format(duration)}</b>
    <br />
    {loading ? "Loading..." : `Click to ${paused ? "play" : "pause"}, drag to seek`}
  </div>
</div>
