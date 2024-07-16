<script>
  import Slider from "$lib/Slider.svelte"
  import Video from "$lib/Video.svelte"
  import { format, getNestedArrayIndex } from "$lib/utils.js"

  let time, duration, paused, start, end

  let previews = [
    [0, "https://s2.loli.net/2024/07/16/A295y3dRGIN7Kml.jpg"],
    [800, "https://s2.loli.net/2024/07/16/zO8lL7nGtgbJvcf.jpg"],
    [950, "https://s2.loli.net/2024/07/16/a4HWsmEiMtJILUP.jpg"],
    [200, "https://s2.loli.net/2024/07/16/iNPgJnE1YhBe2to.jpg"],
    [400, "https://s2.loli.net/2024/07/16/mtoG5jIZ71J4ark.jpg"],
    [600, "https://s2.loli.net/2024/07/16/sVwJAjfFkeULOg6.jpg"]
  ].sort((a, b) => a[0] - b[0])

  let highlights = [
    [50, "https://s2.loli.net/2024/07/16/ubzMSXh1Qft6Av9.png"],
    [510, "https://s2.loli.net/2024/07/16/zTLd4qS2pPyewYG.png"],
    [540, "https://s2.loli.net/2024/07/16/jZwKxfFYtzADGMP.png"],
    [340, "https://s2.loli.net/2024/07/16/2KehuSOpRaWoi1l.png"],
    [620, "https://s2.loli.net/2024/07/16/lhMsC1EgXZitoxP.png"],
    [170, "https://s2.loli.net/2024/07/16/NideqpFEWMCkgQD.png"]
  ].sort((a, b) => a[0] - b[0])

  let selectedHighlights = []
</script>

<div class="mx-auto px-24 py-10 max-w-[960px] space-y-5">
  <Video
    bind:time
    bind:duration
    bind:paused
    src="https://aniopen.an-i.workers.dev/2024-7/%5BANi%5D%20DDDD%20%E6%83%A1%E9%AD%94%E7%9A%84%E7%A0%B4%E5%A3%9E%20-%2004%20%5B1080P%5D%5BBaha%5D%5BWEB-DL%5D%5BAAC%20AVC%5D%5BCHT%5D.mp4" />

  <Slider bind:start bind:end bind:time {duration} {previews} />

  <div class="p-3 bg-gray-200 space-y-4">
    <p>
      <b class="text-xl">Highlights</b>
      <br />
      selected period {format(start * duration)} - {format(end * duration)}
    </p>
    <div class="flex flex-wrap gap-3">
      {#each highlights as [highlightTime, highlightUrl] (`highlight_${highlightTime}`)}
        {#if (highlightTime / duration >= start && highlightTime / duration <= end) || getNestedArrayIndex( selectedHighlights, [highlightTime, highlightUrl] ) !== -1}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
          <img
            src={highlightUrl}
            class="w-24 box-content {getNestedArrayIndex(selectedHighlights, [
              highlightTime,
              highlightUrl
            ]) !== -1
              ? 'ring-4 ring-blue-600'
              : ''}"
            alt={`highlight_${highlightTime}`}
            draggable="false"
            on:click={() => {
              let i = getNestedArrayIndex(selectedHighlights, [highlightTime, highlightUrl])
              if (i !== -1) {
                selectedHighlights.splice(i, 1)
                selectedHighlights = selectedHighlights
              } else {
                selectedHighlights = [...selectedHighlights, [highlightTime, highlightUrl]]
              }
            }} />
        {/if}
      {/each}
    </div>
    <button
      class="bg-blue-600 hover:bg-blue-900 text-white disabled:bg-gray-300 disabled:text-gray-400 font-bold px-3 py-1.5"
      disabled={selectedHighlights.length < 1}>
      Go ahead
    </button>
  </div>
</div>
