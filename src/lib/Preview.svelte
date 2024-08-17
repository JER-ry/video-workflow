<script>
  import { onMount, tick } from "svelte"
  import { waitUntil } from "$lib/utils.js"

  export let previews
  export let duration
  export let previewsProgress = 0
  export let numberOfPreviews

  let body
  let widths = []
  let visiblePreviews = []

  onMount(async () => {
    await tick()
    const { height } = body.getBoundingClientRect()
    waitUntil(
      () => previews.length === numberOfPreviews,
      async () => {
        widths = await Promise.all(
          previews.map(async ([time, url]) => {
            return new Promise((resolve) => {
              const img = new Image()
              img.onload = () => resolve([time, (img.width / img.height) * height])
              img.src = url
            })
          })
        )
        updateVisiblePreviews()
      }
    )
  })

  function updateVisiblePreviews() {
    if (!body || previews.length !== numberOfPreviews) return
    const { width } = body.getBoundingClientRect()
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
</script>

<svelte:window on:resize={(e) => updateVisiblePreviews()} />
<div class="py-2 h-full w-full">
  <div class="flex flex-row h-full w-full transform overflow-clip" bind:this={body}>
    {#if previews.length === numberOfPreviews}
      {#each visiblePreviews as [time, url] (`preview_${time}`)}
        <!-- svelte-ignore a11y-missing-attribute -->
        <img
          src={url}
          style="left: {100 * (time / duration)}%"
          class="absolute top-0 h-full -translate-x-1/2 select-none"
          draggable="false" />
      {/each}
    {:else}
      <p class="w-full my-auto text-center">
        Generating previews ... ({previewsProgress} / {numberOfPreviews})
      </p>
    {/if}
  </div>
</div>
