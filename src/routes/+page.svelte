<script>
  import { onMount } from "svelte"
  import Slider from "$lib/Slider.svelte"
  import Preview from "$lib/Preview.svelte"
  import Video from "$lib/Video.svelte"
  import { formatBytes, formatTime, getNestedArrayIndex, waitUntil } from "$lib/utils.js"
  import { FFmpeg } from "@ffmpeg/ffmpeg"
  import { fetchFile, toBlobURL, downloadWithProgress } from "$lib/ffmpeg-utils.ts"

  let step = 0 // 0: loading; 1: capture highlights; 2: clip audio; 3: create video
  let loadingWhich = 0 // 0: ffmpeg; 1: source video

  let videoSource = "https://sveltejs.github.io/assets/caminandes-llamigos.mp4"
  let videoSourceFormat = videoSource.split(".").pop()
  let videoLocalURL, videoComponent, time, duration, paused, pStart, pEnd

  let note = "When you capture a moment, we'll also keep the 5 seconds before it for later use."
  let warning = null

  // step 0
  let ffmpegProgress = ""
  let ffmpegProgressCallback = (event) => {
    ffmpegProgress = `(${formatBytes(event.received)} / ${formatBytes(32129114)})`
  }
  let videoProgress = ""
  let videoProgressCallback = (event) => {
    videoProgress =
      event.total > 0
        ? `(${formatBytes(event.received)} / ${formatBytes(event.total)})`
        : `(${formatBytes(event.received)})`
  }

  // step 1
  let previews = []
  let highlights = []
  let previewsProgress = 0
  const numberOfPreviews = 50
  let highlightsReady = false

  // step 2
  let wavepicURL
  let audioClips = []
  let audioClipsReady = false

  let ffmpeg
  onMount(async () => {
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm"
    ffmpeg = new FFmpeg()
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm",
        true,
        ffmpegProgressCallback
      )
    })
    loadingWhich = 1
    let videoArray = new Uint8Array(await downloadWithProgress(videoSource, videoProgressCallback))
    await ffmpeg.writeFile(`main.${videoSourceFormat}`, videoArray)
    const data = await ffmpeg.readFile(`main.${videoSourceFormat}`)
    videoLocalURL = URL.createObjectURL(
      new Blob([data.buffer], { type: `video/${videoSourceFormat}` })
    )
    step = 1
    await ffmpeg.createDir("previews")
    await ffmpeg.createDir("highlights")
    await ffmpeg.createDir("audioClips")
    waitUntil(
      () => duration > 0,
      async () => {
        let previousPreviewsProgress = 0
        ffmpeg.on("log", ({ _, message }) => {
          let tempPreviewsProgress = message.match(/frame=\s*(\d+)/)
          tempPreviewsProgress = tempPreviewsProgress ? parseInt(tempPreviewsProgress[1], 10) : 0
          if (tempPreviewsProgress >= previousPreviewsProgress) {
            previewsProgress = tempPreviewsProgress
            previousPreviewsProgress = tempPreviewsProgress
          }
        })
        await ffmpeg.exec([
          "-i",
          `main.${videoSourceFormat}`,
          "-vf",
          `fps=${numberOfPreviews / duration}`, // spf=duration/numberOfPreviews
          "previews/out%d.png"
        ])
        for (let i = 1; i <= numberOfPreviews; i++) {
          const data = await ffmpeg.readFile(`previews/out${i}.png`)
          previews.push([
            (i / numberOfPreviews) * duration,
            URL.createObjectURL(new Blob([data.buffer], { type: "image/png" }))
          ])
        }
        previews = previews
        highlightsReady = true
      }
    )
  })
</script>

<div class="bg-slate-100 text-slate-800 h-full w-full min-h-screen">
  <div
    class="mx-auto px-6 lg:px-24 pb-10 flex flex-col space-y-5 lg:flex-row lg:space-x-5 lg:space-y-0">
    <div class="space-y-5 lg:w-3/5">
      <div class="flex items-end h-24 p-3 bg-gradient-to-b from-cyan-200 to-cyan-300">
        <h1 class="text-[1.7rem] font-bold text-cyan-700 truncate">New Video Project 1</h1>
      </div>
      {#if step === 0}
        <div class="flex items-end pt-6 lg:h-48 lg:pb-3 lg:pt-6">
          {#if loadingWhich === 0}
            <h2 class="text-2xl font-bold text-slate-400">
              <span class="text-cyan-500 font-normal">Now loading</span>
              depedencies ... {ffmpegProgress}
            </h2>
          {:else}
            <h2 class="text-2xl font-bold text-slate-400">
              <span class="text-cyan-500 font-normal">Loaded</span>
              depedencies.
              <br />
              <span class="text-cyan-500 font-normal">Now loading</span>
              your video ... {videoProgress}
            </h2>
          {/if}
        </div>
      {/if}
      {#if step === 1 || step === 2}
        <Video
          bind:time
          bind:duration
          bind:paused
          bind:this={videoComponent}
          on:load={() => this.triggerInfo(0)}
          src={videoLocalURL} />
      {/if}
      {#if step === 1}
        <Slider
          bind:time
          {duration}
          enableClipping={false}
          timeDraggingFunc={(doesPause) => {
            videoComponent.triggerInfo()
            if (doesPause) videoComponent.playOrPause(false)
          }}>
          {#each highlights as [highlightTime, _] (`highlight_mark_${highlightTime}`)}
            <div
              style="left: {100 * (highlightTime / duration)}%"
              class="absolute top-0 w-1 h-full bg-slate-600/50 -translate-x-1/2" />
          {/each}
          <Preview {previews} {duration} {previewsProgress} {numberOfPreviews} slot="upper" />
        </Slider>
      {/if}
      {#if step === 2}
        <Slider
          bind:pStart
          bind:pEnd
          bind:time
          {duration}
          enableClipping={true}
          timeDraggingFunc={(doesPause) => {
            videoComponent.triggerInfo()
            if (doesPause) videoComponent.playOrPause(false)
          }}>
          {#each audioClips as [audioClipPStart, audioClipPEnd, _] (`audioClip_mark_${audioClipPStart}-${audioClipPEnd}`)}
            <div
              style="left: {100 * audioClipPStart}%; right: {100 * (1 - audioClipPEnd)}%;"
              class="absolute top-0 h-full bg-slate-400/30">
            </div>
          {/each}
          <div class="flex h-full w-full" slot="upper">
            {#if wavepicURL}
              <!-- svelte-ignore a11y-missing-attribute -->
              <img src={wavepicURL} class="h-full w-full" draggable="false" />
            {:else}
              <p class="w-full my-auto text-center">Generating waveform image ...</p>
            {/if}
          </div>
        </Slider>
      {/if}
    </div>
    {#if step === 1}
      <div class="space-y-5 lg:w-2/5">
        <div class="flex items-end pt-6 lg:h-24 lg:pb-3 lg:pt-6">
          <h2 class="text-2xl font-bold text-slate-400">
            <span class="text-cyan-500 font-normal">Step 1.</span> Capture Highlights
          </h2>
        </div>
        <div class="flex flex-col space-y-5">
          <div class="flex flex-row space-x-5">
            <button
              class="bg-gradient-to-b from-slate-500 to-slate-700 hover:from-slate-600 hover:to-slate-700 active:from-slate-700 active:to-slate-600 text-slate-100 disabled:from-slate-200 disabled:to-slate-200 disabled:text-gray-400 font-bold px-3 py-1.5 select-none"
              disabled={!highlightsReady}
              on:click={async () => {
                const currentTime = time
                if (!highlights.some((h) => formatTime(h[0]) === formatTime(currentTime))) {
                  highlightsReady = false
                  await ffmpeg.exec([
                    "-ss",
                    currentTime.toString(),
                    "-i",
                    `main.${videoSourceFormat}`,
                    "-frames:v",
                    "1",
                    `highlights/${currentTime}.png`
                  ])
                  const data = await ffmpeg.readFile(`highlights/${currentTime}.png`)
                  highlights = [
                    ...highlights,
                    [
                      currentTime,
                      URL.createObjectURL(new Blob([data.buffer], { type: "image/png" }))
                    ]
                  ].sort((a, b) => a[0] - b[0])
                  highlightsReady = true
                } else warning = `You have already captured at ${formatTime(currentTime)}.`
              }}>
              Capture {formatTime(time)}
            </button>
            <button
              class="bg-gradient-to-b from-slate-500 to-slate-700 hover:from-slate-600 hover:to-slate-700 active:from-slate-700 active:to-slate-600 text-slate-100 disabled:from-slate-200 disabled:to-slate-200 disabled:text-gray-400 font-bold px-3 py-1.5 select-none"
              disabled={highlights.length < 1}
              on:click={async () => {
                note = null
                warning = null
                step = 2
                if (!wavepicURL) {
                  await ffmpeg.exec([
                    "-i",
                    `main.${videoSourceFormat}`,
                    "-filter_complex",
                    "compand=gain=+5,showwavespic=s=2000x400",
                    "-frames:v",
                    "1",
                    "wavepic.png"
                  ])
                  const data = await ffmpeg.readFile("wavepic.png")
                  wavepicURL = URL.createObjectURL(new Blob([data.buffer], { type: "image/png" }))
                  audioClipsReady = true
                }
              }}>
              Next step
            </button>
          </div>
          {#if note}
            <p class="bg-gradient-to-b from-pink-100 to-pink-200 text-pink-800 p-3">
              <b>Note:</b>
              {note}
              <button
                class="underline underline-offset-4 hover:font-bold hover:bg-pink-300 active:bg-pink-400"
                on:click={() => (note = null)}>Got it!</button>
            </p>
          {/if}
          {#if warning}
            <p class="bg-gradient-to-b from-yellow-100 to-yellow-200 text-yellow-800 p-3">
              <b>Warning:</b>
              {warning}
              <button
                class="underline underline-offset-4 hover:font-bold hover:bg-yellow-300 active:bg-yellow-400"
                on:click={() => (warning = null)}>Got it!</button>
            </p>
          {/if}
          <div
            class={highlights.length > 0
              ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 2xl:grid-cols-3 lg:max-h-[40vh] 2xl:max-h-[60svh] lg:overflow-auto grid gap-5 select-none"
              : "italic"}>
            {#each highlights as [highlightTime, highlightURL] (`highlight_${highlightTime}`)}
              <!-- svelte-ignore a11y-click-events-have-key-events -->
              <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
              <div class="group shrink">
                <img
                  src={highlightURL}
                  class="w-full box-content"
                  alt={`highlight_${highlightTime}`}
                  draggable="false" />
                <div
                  class="flex flex-row transform bg-gradient-to-b from-slate-200 to-slate-300 h-9">
                  <div
                    class="bg-gradient-to-b from-slate-300 to-slate-400/50 font-bold px-3 py-1.5 text-center">
                    {getNestedArrayIndex(highlights, [highlightTime, highlightURL]) + 1}
                  </div>
                  <span class="px-3 py-1.5"> {formatTime(highlightTime)}</span>
                  <button
                    class="absolute top-0 right-0 h-9 w-9 p-1 invisible group-hover:visible bg-gradient-to-b hover:from-pink-200/50 hover:to-pink-300/50 active:from-pink-300/50 active:to-pink-400/50"
                    on:click={async () => {
                      let i = getNestedArrayIndex(highlights, [highlightTime, highlightURL])
                      await ffmpeg.deleteFile(`highlights/${highlightTime}.png`)
                      URL.revokeObjectURL(highlightURL)
                      highlights.splice(i, 1)
                      highlights = highlights.sort((a, b) => a[0] - b[0])
                    }}>
                    <svg
                      viewBox="-3.6 -3.6 31.20 31.20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg">
                      <g>
                        <path
                          d="M10 12V17"
                          stroke="#db2777"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"></path>
                        <path
                          d="M14 12V17"
                          stroke="#db2777"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"></path>
                        <path
                          d="M4 7H20"
                          stroke="#db2777"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"></path>
                        <path
                          d="M6 10V18C6 19.6569 7.34315 21 9 21H15C16.6569 21 18 19.6569 18 18V10"
                          stroke="#db2777"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"></path>
                        <path
                          d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z"
                          stroke="#db2777"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"></path>
                      </g>
                    </svg>
                  </button>
                </div>
              </div>
            {:else}
              Captured highlights will be displayed here.
            {/each}
          </div>
        </div>
      </div>
    {:else if step === 2}
      <div class="space-y-5 lg:w-2/5">
        <div class="flex items-end pt-6 lg:h-24 lg:pb-3 lg:pt-6">
          <h2 class="text-2xl font-bold text-slate-400">
            <span class="text-cyan-500 font-normal">Step 2.</span> Clip Audio
          </h2>
        </div>
        <div class="flex flex-col space-y-5">
          <div class="flex flex-row space-x-5">
            <button
              class="bg-gradient-to-b from-slate-500 to-slate-700 hover:from-slate-600 hover:to-slate-700 active:from-slate-700 active:to-slate-600 text-slate-100 disabled:from-slate-200 disabled:to-slate-200 disabled:text-gray-400 font-bold px-3 py-1.5 select-none"
              on:click={() => (step = 1)}>
              Last step
            </button>
            <button
              class="bg-gradient-to-b from-slate-500 to-slate-700 hover:from-slate-600 hover:to-slate-700 active:from-slate-700 active:to-slate-600 text-slate-100 disabled:from-slate-200 disabled:to-slate-200 disabled:text-gray-400 font-bold px-3 py-1.5 select-none"
              disabled={!audioClipsReady}
              on:click={async () => {
                const currentPStart = pStart
                const currentPEnd = pEnd
                if (!audioClips.some((a) => a[0] === currentPStart && a[1] === currentPEnd)) {
                  audioClipsReady = false
                  await ffmpeg.exec([
                    "-i",
                    `main.${videoSourceFormat}`,
                    "-ss",
                    (currentPStart * duration).toString(),
                    "-t",
                    ((currentPEnd - currentPStart) * duration).toString(),
                    "-vn",
                    "-acodec",
                    "flac",
                    `audioClips/${currentPStart}-${currentPEnd}.flac`
                  ])
                  const data = await ffmpeg.readFile(
                    `audioClips/${currentPStart}-${currentPEnd}.flac`
                  )
                  audioClips = [
                    ...audioClips,
                    [
                      currentPStart,
                      currentPEnd,
                      URL.createObjectURL(new Blob([data.buffer], { type: "audio/flac" }))
                    ]
                  ].sort((a, b) => {
                    let delta0 = a[0] - b[0]
                    return delta0 === 0 ? a[1] - b[1] : delta0
                  })
                  audioClipsReady = true
                } else
                  warning = `You have already clipped at ${formatTime(currentPStart * duration)} - ${formatTime(currentPEnd * duration)}.`
              }}>
              Clip {formatTime(pStart * duration)} - {formatTime(pEnd * duration)}
            </button>
            <button
              class="bg-gradient-to-b from-slate-500 to-slate-700 hover:from-slate-600 hover:to-slate-700 active:from-slate-700 active:to-slate-600 text-slate-100 disabled:from-slate-200 disabled:to-slate-200 disabled:text-gray-400 font-bold px-3 py-1.5 select-none"
              disabled={true}>
              Next step
            </button>
          </div>
          {#if note}
            <p class="bg-gradient-to-b from-pink-100 to-pink-200 text-pink-800 p-3">
              <b>Note:</b>
              {note}
              <button
                class="underline underline-offset-4 hover:font-bold hover:bg-pink-300 active:bg-pink-400"
                on:click={() => (note = null)}>Got it!</button>
            </p>
          {/if}
          {#if warning}
            <p class="bg-gradient-to-b from-yellow-100 to-yellow-200 text-yellow-800 p-3">
              <b>Warning:</b>
              {warning}
              <button
                class="underline underline-offset-4 hover:font-bold hover:bg-yellow-300 active:bg-yellow-400"
                on:click={() => (warning = null)}>Got it!</button>
            </p>
          {/if}
          <div
            class={audioClips.length > 0
              ? "grid-cols-1 lg:max-h-[40vh] 2xl:max-h-[60svh] lg:overflow-auto grid gap-5 select-none"
              : "italic"}>
            {#each audioClips as [audioClipPStart, audioClipPEnd, audioClipURL] (`audioClip_${audioClipPStart}-${audioClipPEnd}`)}
              <div class="group shrink">
                <audio class="w-full" controls src={audioClipURL}></audio>
                <div
                  class="flex flex-row transform bg-gradient-to-b from-slate-200 to-slate-300 h-9">
                  <div
                    class="bg-gradient-to-b from-slate-300 to-slate-400/50 font-bold px-3 py-1.5 text-center">
                    {getNestedArrayIndex(audioClips, [
                      audioClipPStart,
                      audioClipPEnd,
                      audioClipURL
                    ]) + 1}
                  </div>
                  <span class="px-3 py-1.5">
                    {formatTime(audioClipPStart * duration)} - {formatTime(
                      audioClipPEnd * duration
                    )}</span>
                  <button
                    class="absolute top-0 right-0 h-9 w-9 p-1 invisible group-hover:visible bg-gradient-to-b hover:from-pink-200/50 hover:to-pink-300/50 active:from-pink-300/50 active:to-pink-400/50"
                    on:click={async () => {
                      let i = getNestedArrayIndex(audioClips, [
                        audioClipPStart,
                        audioClipPEnd,
                        audioClipURL
                      ])
                      await ffmpeg.deleteFile(`audioClips/${audioClipPStart}-${audioClipPEnd}.flac`)
                      URL.revokeObjectURL(audioClipURL)
                      audioClips.splice(i, 1)
                      audioClips = audioClips.sort((a, b) => {
                        let delta0 = a[0] - b[0]
                        return delta0 === 0 ? a[1] - b[1] : delta0
                      })
                    }}>
                    <svg
                      viewBox="-3.6 -3.6 31.20 31.20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg">
                      <g>
                        <path
                          d="M10 12V17"
                          stroke="#db2777"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"></path>
                        <path
                          d="M14 12V17"
                          stroke="#db2777"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"></path>
                        <path
                          d="M4 7H20"
                          stroke="#db2777"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"></path>
                        <path
                          d="M6 10V18C6 19.6569 7.34315 21 9 21H15C16.6569 21 18 19.6569 18 18V10"
                          stroke="#db2777"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"></path>
                        <path
                          d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z"
                          stroke="#db2777"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"></path>
                      </g>
                    </svg>
                  </button>
                </div>
              </div>
            {:else}
              Audio clips will be displayed here.
            {/each}
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
