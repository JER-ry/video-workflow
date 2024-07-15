<script>
  import Slider from "$lib/Slider.svelte"
  import Video from "$lib/Video.svelte"

  function format(seconds) {
    if (isNaN(seconds)) return "--"

    const minutes = Math.floor(seconds / 60)
    seconds = Math.floor(seconds % 60)
    if (seconds < 10) seconds = "0" + seconds
    return `${minutes}:${seconds}`
  }

  let time, duration, paused, start, end

  let previews = [
    [0, "https://s2.loli.net/2024/07/16/A295y3dRGIN7Kml.jpg"],
    [200, "https://s2.loli.net/2024/07/16/iNPgJnE1YhBe2to.jpg"],
    [400, "https://s2.loli.net/2024/07/16/mtoG5jIZ71J4ark.jpg"],
    [600, "https://s2.loli.net/2024/07/16/sVwJAjfFkeULOg6.jpg"],
    [800, "https://s2.loli.net/2024/07/16/zO8lL7nGtgbJvcf.jpg"],
    [1000, "https://s2.loli.net/2024/07/16/a4HWsmEiMtJILUP.jpg"]
  ]
</script>

<div class="mx-auto px-24 py-10 max-w-[960px] space-y-5">
  <Video
    bind:time
    bind:duration
    bind:paused
    src="https://aniopen.an-i.workers.dev/2024-7/%5BANi%5D%20DDDD%20%E6%83%A1%E9%AD%94%E7%9A%84%E7%A0%B4%E5%A3%9E%20-%2004%20%5B1080P%5D%5BBaha%5D%5BWEB-DL%5D%5BAAC%20AVC%5D%5BCHT%5D.mp4" />

  <Slider bind:start bind:end bind:time {duration} {previews}/>

  <p>
    {paused ? "Paused" : "Playing"} at {format(time)}
    <br />
    Duration {format(duration)}
    <br />
    Clip range {format(start * duration)} to {format(end * duration)}
  </p>
</div>
