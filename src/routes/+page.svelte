<script>
  import { onMount } from "svelte"
  import Slider from "$lib/Slider.svelte"
  import Preview from "$lib/Preview.svelte"
  import Video from "$lib/Video.svelte"
  import { format, getNestedArrayIndex, waitUntil } from "$lib/utils.js"
  import { FFmpeg } from "@ffmpeg/ffmpeg"
  import { fetchFile, toBlobURL } from "$lib/ffmpeg-utils.ts"

  let step = 0 // 0: loading; 1: capture highlights; 2: clip audio; 3: create video
  let loadingWhich = 0 // 0: ffmpeg; 1: source video

  let videoSource = "https://sveltejs.github.io/assets/caminandes-llamigos.mp4"
  let videoSourceFormat = videoSource.split(".").pop()
  let videoLocalURL, videoComponent, time, duration, paused, pStart, pEnd

  let note = "When you capture a moment, we'll also keep the 5 seconds before it for later use."
  let showNote = true
  let warning = ""
  let showWarning = false

  // step 1
  let previews = []
  let highlights = []
  const numberOfPreviews = 50

  let ffmpeg
  onMount(async () => {
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm"
    ffmpeg = new FFmpeg()
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm")
    })
    loadingWhich = 1
    await ffmpeg.writeFile(`main.${videoSourceFormat}`, await fetchFile(videoSource))
    const data = await ffmpeg.readFile(`main.${videoSourceFormat}`)
    videoLocalURL = URL.createObjectURL(
      new Blob([data.buffer], { type: `video/${videoSourceFormat}` })
    )
    step = 1
    await ffmpeg.createDir("previews")
    waitUntil(
      () => duration > 0,
      async () => {
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
            URL.createObjectURL(new Blob([data.buffer], { type: `image/png` }))
          ])
        }
        previews = previews
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
              depedencies ...
            </h2>
          {:else}
            <h2 class="text-2xl font-bold text-slate-400">
              <span class="text-cyan-500 font-normal">Loaded</span>
              depedencies.
              <br />
              <span class="text-cyan-500 font-normal">Now loading</span>
              your video ...
            </h2>
          {/if}
        </div>
      {/if}
      {#if step === 1}
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
          bind:start={pStart}
          bind:end={pEnd}
          bind:time
          {duration}
          enableClipping={false}
          timeDraggingFunc={(doesPause) => {
            videoComponent.triggerInfo()
            if (doesPause) videoComponent.playOrPause(false)
          }}>
          <Preview {previews} {duration} {numberOfPreviews} />
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
              disabled={!duration}
              on:click={async () => {
                const currentTime = time
                // if time hasn't been added to highlights
                if (!highlights.some((h) => format(h[0]) === format(currentTime))) {
                  ffmpeg.exec([
                    "-ss",
                    currentTime.toString(),
                    "-i",
                    `main.${videoSourceFormat}`,
                    "-frames:v",
                    "1",
                    "-q:v",
                    "3",
                    `${currentTime}.jpg`
                  ])
                  const data = await ffmpeg.readFile(`${currentTime}.jpg`)
                  highlights = [
                    ...highlights,
                    [
                      currentTime,
                      URL.createObjectURL(new Blob([data.buffer], { type: `image/jpeg` }))
                    ]
                  ].sort((a, b) => a[0] - b[0])
                } else {
                  warning = `You have already captured at ${format(currentTime)}.`
                  showWarning = true
                }
              }}>
              Capture {format(time)}
            </button>
            <button
              class="bg-gradient-to-b from-slate-500 to-slate-700 hover:from-slate-600 hover:to-slate-700 active:from-slate-700 active:to-slate-600 text-slate-100 disabled:from-slate-200 disabled:to-slate-200 disabled:text-gray-400 font-bold px-3 py-1.5 select-none"
              disabled={highlights.length < 1}>
              Next step
            </button>
          </div>
          {#if showNote}
            <p class="bg-gradient-to-b from-pink-100 to-pink-200 text-pink-800 p-3">
              <b>Note:</b>
              {note}
              <button
                class="underline underline-offset-4 hover:font-bold hover:bg-pink-300 active:bg-pink-400"
                on:click={() => (showNote = false)}>Got it!</button>
            </p>
          {/if}
          {#if showWarning}
            <p class="bg-gradient-to-b from-yellow-100 to-yellow-200 text-yellow-800 p-3">
              <b>Warning:</b>
              {warning}
              <button
                class="underline underline-offset-4 hover:font-bold hover:bg-yellow-300 active:bg-yellow-400"
                on:click={() => (showWarning = false)}>Got it!</button>
            </p>
          {/if}
          <div
            class={highlights.length > 0
              ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 2xl:grid-cols-3 lg:max-h-[40vh] 2xl:max-h-[60svh] lg:overflow-auto grid gap-5 select-none"
              : "italic"}>
            {#each highlights as [highlightTime, highlightUrl] (`highlight_${highlightTime}`)}
              <!-- svelte-ignore a11y-click-events-have-key-events -->
              <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
              <div class="group shrink">
                <img
                  src={highlightUrl}
                  class="w-full box-content"
                  alt={`highlight_${highlightTime}`}
                  draggable="false" />
                <div
                  class="flex flex-row transform bg-gradient-to-b from-slate-200 to-slate-300 h-9">
                  <div
                    class="bg-gradient-to-b from-slate-300 to-slate-400/50 font-bold px-3 py-1.5 text-center">
                    {getNestedArrayIndex(highlights, [highlightTime, highlightUrl]) + 1}
                  </div>
                  <span class="px-3 py-1.5"> {format(highlightTime)}</span>
                  <button
                    class="absolute top-0 right-0 h-9 w-9 p-1 invisible group-hover:visible bg-gradient-to-b hover:from-pink-200/50 hover:to-pink-300/50 active:from-pink-300/50 active:to-pink-400/50"
                    on:click={async () => {
                      let i = getNestedArrayIndex(highlights, [highlightTime, highlightUrl])
                      await ffmpeg.deleteFile(`${highlightTime}.jpg`)
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
    {/if}
  </div>
</div>
