<!-- https://svelte.dev/repl/media-elements -->

<script>
  import { format } from "$lib/utils.js"

  // These values are bound to properties of the video
  export let poster, src

  export let time = 0
  export let duration
  export let paused = true

  let showInfo = true
  let showInfoTimeout

  let video

  // Used to track time of last mouse down event
  let lastMouseDown

  function handleMove(e) {
    // Make the info visible, but fade out after 2s of inactivity
    clearTimeout(showInfoTimeout)
    showInfoTimeout = setTimeout(() => (showInfo = false), 2000)
    showInfo = true

    if (!duration) return // video not loaded yet
    if (e.type !== "touchmove" && !(e.buttons & 1)) return // mouse not down

    const clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX
    const { left, right } = this.getBoundingClientRect()
    time = duration * ((clientX - left) / (right - left))
  }

  // we can't rely on the click event, because it fires after a drag — we have to listen for clicks ourselves
  function handleMousedown(e) {
    if (e.button === 0) lastMouseDown = new Date()
  }

  function handleMouseup(e) {
    if (e.button === 0 && new Date() - lastMouseDown < 300) {
      if (paused) video.play()
      else video.pause()

      // Make the info visible, but fade out after 2s of inactivity
      clearTimeout(showInfoTimeout)
      showInfoTimeout = setTimeout(() => (showInfo = false), 2000)
      showInfo = true
    }
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="transform"
  on:mousedown={handleMousedown}
  on:mouseup={handleMouseup}
  on:mousemove={handleMove}
  on:touchmove|preventDefault={handleMove}>
  <video {poster} {src} bind:this={video} bind:currentTime={time} bind:duration bind:paused>
    <track kind="captions" />
  </video>
  <div
    class="absolute top-0 w-full p-3 content-center text-white bg-gradient-to-b from-black/50 to-black/0 transition-opacity select-none"
    style="opacity: {duration && showInfo ? 1 : 0}">
    <b class="text-xl">{format(time)} / {format(duration)}</b>
    <br />
    click to {paused ? "play" : "pause"}, drag to seek
  </div>
</div>
