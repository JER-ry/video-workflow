<script>
  export let containerNode
  export let previews
  export let duration

  let body
  let visiblePreviews = previews

  async function getImageWidths(previews, height) {
    return await Promise.all(
      previews.map(async ([time, url]) => {
        return new Promise((resolve, reject) => {
          const img = new Image()
          img.onload = () => resolve([time, (img.width / img.height) * height])
          img.onerror = () => {
            if (retries > 0) {
              console.log(`Retrying for ${url}, attempts left: ${retries}`)
              resolve(attemptLoadImage(url, retries - 1))
            } else {
              reject(`Failed to load image after ${maxRetries} attempts`)
            }
          }
          img.src = url
        })
      })
    )
  }

  function updateVisiblePreviews() {
    const { width, height } = containerNode.getBoundingClientRect()
    getImageWidths(previews, height).then((widths) => {
      let visibleWidths = widths.slice(0, 1)
      visiblePreviews = previews.slice(0, 1)
      for (let i = 1; i < widths.length; i++) {
        const [lastTime, lastWidth] = visibleWidths.slice(-1)[0]
        const lastPosition = (lastTime / duration) * width
        const [thisTime, thisWidth] = widths[i]
        const thisPosition = (thisTime / duration) * width
        if (thisPosition - 0.5 * thisWidth > lastPosition + 0.5 * lastWidth) {
          visibleWidths.push(widths[i])
          visiblePreviews.push(previews[i])
        } else console.log(thisTime, thisWidth)
      }
    })
  }
</script>

<svelte:window on:resize={(e) => updateVisiblePreviews()} />
<div
  class="flex flex-row h-full select-none whitespace-nowrap transform overflow-clip"
  bind:this={body}>
  {#each visiblePreviews as [time, url]}
    <img
      src={url}
      style="left: {100 * (time / duration)}%"
      class="absolute top-0 h-full -translate-x-1/2 select-none"
      alt="time" />
  {/each}
</div>
