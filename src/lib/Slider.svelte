<!-- https://github.com/mhkeller/svelte-double-range-slider/blob/master/src/DoubleRangeSlider.svelte -->

<script>
  import Preview from "$lib/Preview.svelte"

  function clamp(num, min, max) {
    return num < min ? min : num > max ? max : num
  }

  export let start = 0
  export let end = 1
  export let time = 0
  export let duration
  export let previews

  let leftHandle

  let body
  let slider
  let previewContainer

  function draggable(node) {
    let x
    let y

    function handleMousedown(event) {
      if (event.type === "touchstart") {
        event = event.touches[0]
      }
      x = event.clientX
      y = event.clientY

      node.dispatchEvent(
        new CustomEvent("dragstart", {
          detail: { x, y }
        })
      )

      window.addEventListener("mousemove", handleMousemove)
      window.addEventListener("mouseup", handleMouseup)

      window.addEventListener("touchmove", handleMousemove)
      window.addEventListener("touchend", handleMouseup)
    }

    function handleMousemove(event) {
      if (event.type === "touchmove") {
        event = event.changedTouches[0]
      }

      const dx = event.clientX - x
      const dy = event.clientY - y

      x = event.clientX
      y = event.clientY

      node.dispatchEvent(
        new CustomEvent("dragmove", {
          detail: { x, y, dx, dy }
        })
      )
    }

    function handleMouseup(event) {
      x = event.clientX
      y = event.clientY

      node.dispatchEvent(
        new CustomEvent("dragend", {
          detail: { x, y }
        })
      )

      window.removeEventListener("mousemove", handleMousemove)
      window.removeEventListener("mouseup", handleMouseup)

      window.removeEventListener("touchmove", handleMousemove)
      window.removeEventListener("touchend", handleMouseup)
    }

    node.addEventListener("mousedown", handleMousedown)
    node.addEventListener("touchstart", handleMousedown)

    return {
      destroy() {
        node.removeEventListener("mousedown", handleMousedown)
        node.removeEventListener("touchstart", handleMousedown)
      }
    }
  }

  function setHandlePosition(which) {
    return function (evt) {
      const { left, right } = slider.getBoundingClientRect()
      const parentWidth = right - left

      const p = clamp((evt.detail.x - left) / parentWidth, 0, 1)

      if (which === "start") {
        start = p
        end = Math.max(end, p)
      } else if (which === "end") {
        start = Math.min(p, start)
        end = p
      } else if (which === "time/duration") {
        time = p * duration
      }
    }
  }

  function setBodyPosition(evt) {
    const { left, right } = slider.getBoundingClientRect()
    const parentWidth = right - left
    const { width, left: bodyLeft } = body.getBoundingClientRect()

    const pxStart = clamp(bodyLeft + evt.detail.dx - left, 0, parentWidth - width)
    const pxEnd = clamp(pxStart + width, width, parentWidth)

    const pStart = pxStart / parentWidth
    const pEnd = pxEnd / parentWidth

    console.log(left, right, bodyLeft, evt.detail.dx > 0, pStart > start)

    start = pStart
    end = pEnd
  }
</script>

<div class="h-12 select-none whitespace-nowrap transform bg-gray-200" bind:this={slider}>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    bind:this={body}
    use:draggable
    on:dragmove|preventDefault|stopPropagation={setBodyPosition}
    style="left: {100 * start}%; right: {100 * (1 - end)}%;"
    class="absolute top-0 h-full bg-blue-300 bottom-0">
  </div>
  <div class="py-2 h-full" bind:this={previewContainer}>
    <Preview {previews} {duration} {previewContainer} />
  </div>
  <div
    bind:this={leftHandle}
    use:draggable
    on:dragmove|preventDefault|stopPropagation={setHandlePosition("start")}
    style="left: {100 * start}%"
    class="absolute top-0 w-3 h-full bg-blue-600 text-white flex items-center -translate-x-full">
    <span class="w-full text-center">&lt;</span>
  </div>
  <div
    use:draggable
    on:dragmove|preventDefault|stopPropagation={setHandlePosition("end")}
    style="left: {100 * end}%"
    class="absolute top-0 w-3 h-full bg-blue-600 text-white flex items-center">
    <span class="w-full text-center">&gt;</span>
  </div>
  <div
    use:draggable
    on:dragmove|preventDefault|stopPropagation={setHandlePosition("time/duration")}
    style="left: {100 * (time / duration)}%"
    class="absolute top-0 w-1 h-full bg-pink-600 -translate-x-1/2" />
</div>
