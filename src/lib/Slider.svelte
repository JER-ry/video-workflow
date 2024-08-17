<!-- https://github.com/mhkeller/svelte-double-range-slider/blob/master/src/DoubleRangeSlider.svelte -->

<script>
  import { clamp, draggable } from "$lib/utils.js"

  export let duration
  export let time
  export let timeDraggingFunc

  export let enableClipping
  export let pStart = 0
  export let pEnd = 0.5

  let leftHandle

  let body
  let slider

  function setHandlePosition(which, timeThreshold = false) {
    return function (e) {
      const { left, right } = slider.getBoundingClientRect()
      const parentWidth = right - left

      const p = clamp((e.detail.x - left) / parentWidth, 0, 1)

      if (which === "start") {
        pStart = p
        pEnd = Math.max(pEnd, p)
      } else if (which === "end") {
        pStart = Math.min(p, pStart)
        pEnd = p
      } else if (which === "time/duration") {
        if (!timeThreshold || e.detail.time <= 200 ) {
          time = p * duration
          timeDraggingFunc(!timeThreshold)
        } 
      }
    }
  }

  function setBodyPosition(e) {
    if (e.detail.time > 200) {
      const { left, right } = slider.getBoundingClientRect()
      const parentWidth = right - left
      const { width, left: bodyLeft } = body.getBoundingClientRect()

      const newBodyLeft = clamp(bodyLeft + e.detail.dx - left, 0, parentWidth - width)
      const newBodyRight = clamp(newBodyLeft + width, width, parentWidth)

      pStart = newBodyLeft / parentWidth
      pEnd = newBodyRight / parentWidth
    }
  }
</script>

<div class="h-12 select-none whitespace-nowrap bg-gradient-to-b from-slate-200 to-slate-300 px-0.5">
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="h-full w-full transform"
    bind:this={slider}
    use:draggable
    on:dragend|preventDefault|stopPropagation={setHandlePosition("time/duration", true)}>
    {#if enableClipping}
      <div
        style="left: {100 * pStart}%; right: {100 * (1 - pEnd)}%;"
        class="absolute top-0 h-full bg-gradient-to-b from-cyan-100/70 to-cyan-200/30">
      </div>
    {/if}
    <div class="py-2 h-full">
      <slot />
    </div>
    {#if enableClipping}
      <div
        bind:this={body}
        use:draggable
        on:dragmove|preventDefault|stopPropagation={setBodyPosition}
        style="left: {100 * pStart}%; right: {100 * (1 - pEnd)}%;"
        class="absolute top-0 h-full bg-none">
      </div>
      <div
        bind:this={leftHandle}
        use:draggable
        on:dragmove|preventDefault|stopPropagation={setHandlePosition("start")}
        style="left: {100 * pStart}%"
        class="absolute top-0 w-2 h-full bg-cyan-800 text-white text-sm font-bold flex items-center -translate-x-full">
        <span class="w-full text-center">&lt;</span>
      </div>
      <div
        use:draggable
        on:dragmove|preventDefault|stopPropagation={setHandlePosition("end")}
        style="left: {100 * pEnd}%"
        class="absolute top-0 w-2 h-full bg-cyan-800 text-white text-sm font-bold flex items-center">
        <span class="w-full text-center">&gt;</span>
      </div>
    {/if}
    <div
      use:draggable
      on:dragmove|preventDefault|stopPropagation={setHandlePosition("time/duration")}
      style="left: {100 * (time / duration)}%"
      class="absolute top-0 w-1 h-full bg-pink-600 -translate-x-1/2" />
  </div>
</div>
