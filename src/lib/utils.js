export function clamp(num, min, max) {
  return num < min ? min : num > max ? max : num
}

export function formatBytes(b, decimals = 1) {
  // https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript#comment91365260_42408230
  let i = ~~(Math.log2(b) / 10)
  return (b / Math.pow(1024, i)).toFixed(decimals) + ["B", "KiB", "MiB", "GiB", "TiB"][i]
}

export function formatTime(seconds, decimals = 2) {
  if (isNaN(seconds)) return "--"

  const minutes = Math.floor(seconds / 60)
  seconds = (seconds % 60).toFixed(decimals)
  if (seconds < 10) seconds = "0" + seconds
  return `${minutes}:${seconds}`
}

export function getNestedArrayIndex(arr, target) {
  // https://stackoverflow.com/a/67125183/19102358
  return arr.findIndex(
    (item) =>
      Array.isArray(item) &&
      item.length === target.length &&
      item.every((val, index) => val === target[index])
  )
}

export function waitUntil(condition, action) {
  // https://stackoverflow.com/questions/7193238/wait-until-a-condition-is-true
  function checkFlag() {
    if (condition()) action()
    else window.setTimeout(checkFlag, 500)
  }

  checkFlag()
}

export function draggable(node) {
  // https://github.com/mhkeller/svelte-double-range-slider/blob/master/src/DoubleRangeSlider.svelte
  let x
  let y
  let start
  let time

  function handleMousedown(event) {
    if (event.type === "touchstart") event = event.touches[0]
    else if (event.button !== 0) return
    x = event.clientX
    y = event.clientY
    start = new Date()

    node.dispatchEvent(
      new CustomEvent("dragstart", {
        detail: { x, y }
      })
    )

    window.addEventListener("mousemove", handleMousemove)
    window.addEventListener("touchmove", handleMousemove)
    window.addEventListener("mouseup", handleMouseup)
    window.addEventListener("touchend", handleMouseup)
  }

  function handleMousemove(event) {
    if (event.type === "touchmove") event = event.changedTouches[0]
    else if (event.button !== 0) return

    const dx = event.clientX - x
    const dy = event.clientY - y

    x = event.clientX
    y = event.clientY
    time = new Date() - start

    node.dispatchEvent(
      new CustomEvent("dragmove", {
        detail: { x, y, dx, dy, time }
      })
    )
  }

  function handleMouseup(event) {
    if (event.type === "mouseup" && event.button !== 0) return

    x = event.clientX
    y = event.clientY
    time = new Date() - start

    node.dispatchEvent(
      new CustomEvent("dragend", {
        detail: { x, y, time, short: time <= 200 }
      })
    )

    window.removeEventListener("mousemove", handleMousemove)
    window.removeEventListener("touchmove", handleMousemove)
    window.removeEventListener("mouseup", handleMouseup)
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
