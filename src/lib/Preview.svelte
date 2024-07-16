<script>
  import { onMount, tick } from "svelte"

  export let previews
  export let duration
  export let previewContainer

  let body
  let widths = []
  let visiblePreviews = []

  function waitUnitl(condition, action) {
    function checkFlag() {
      if (condition()) action()
      else window.setTimeout(checkFlag, 500)
    }

    checkFlag()
  }

  onMount(async () => {
    await tick()
    const { height } = previewContainer.getBoundingClientRect()
    widths = await Promise.all(
      previews.map(async ([time, url]) => {
        return new Promise((resolve) => {
          const img = new Image()
          img.onload = () => resolve([time, (img.width / img.height) * (height - 2 * 8)])
          img.src = url
        })
      })
    )
    updateVisiblePreviews()
  })

  function updateVisiblePreviews() {
    waitUnitl(
      () => duration > 0,
      () => {
        const { width } = previewContainer.getBoundingClientRect()
        let visibleWidths = widths.slice(0, 1)
        visiblePreviews = previews.slice(0, 1)
        for (let i = 1; i < widths.length; i++) {
          const [lastTime, lastWidth] = visibleWidths[visibleWidths.length - 1]
          const lastPosition = (lastTime / duration) * width
          const [thisTime, thisWidth] = widths[i]
          const thisPosition = (thisTime / duration) * width
          if (thisPosition - 0.5 * thisWidth > lastPosition + 0.5 * lastWidth) {
            visibleWidths = [...visibleWidths, widths[i]]
            visiblePreviews = [...visiblePreviews, previews[i]]
          }
        }
      }
    )
  }
</script>

<svelte:window on:resize={(e) => updateVisiblePreviews()} />
<div
  class="flex flex-row h-full select-none whitespace-nowrap transform overflow-clip"
  bind:this={body}>
  {#each visiblePreviews as [time, url] (time)}
    <img
      src={url}
      style="left: {100 * (time / duration)}%"
      class="absolute top-0 h-full -translate-x-1/2 select-none"
      alt="time" />
  {/each}
</div>
