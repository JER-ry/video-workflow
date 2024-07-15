<!-- https://svelte.dev/repl/media-elements -->

<script>
  // These values are bound to properties of the video
  export let poster, src

  export let time = 0
  export let duration
  export let paused = true

  // Used to track time of last mouse down event
  let lastMouseDown

  function handleMove(e) {
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
    if (e.button === 0 && new Date() - lastMouseDown < 1000) {
      if (paused) e.target.play()
      else e.target.pause()
    }
  }
</script>

<video
  {poster}
  {src}
  on:mousemove={handleMove}
  on:touchmove|preventDefault={handleMove}
  on:mousedown={handleMousedown}
  on:mouseup={handleMouseup}
  bind:currentTime={time}
  bind:duration
  bind:paused>
  <track kind="captions" />
</video>
