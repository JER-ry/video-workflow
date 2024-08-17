export function clamp(num, min, max) {
  return num < min ? min : num > max ? max : num
}

export function format(seconds, decimals = 2) {
  if (isNaN(seconds)) return "--"

  const minutes = Math.floor(seconds / 60)
  seconds = (seconds % 60).toFixed(decimals)
  if (seconds < 10) seconds = "0" + seconds
  return `${minutes}:${seconds}`
}

export function getNestedArrayIndex(arr, target) {
  return arr.findIndex(
    (item) =>
      Array.isArray(item) &&
      item.length === target.length &&
      item.every((val, index) => val === target[index])
  )
}

export function waitUntil(condition, action) {
  function checkFlag() {
    if (condition()) action()
    else window.setTimeout(checkFlag, 500)
  }

  checkFlag()
}

export function draggable(node) {
  let x
  let y
  let start

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

    node.dispatchEvent(
      new CustomEvent("dragmove", {
        detail: { x, y, dx, dy, time: new Date() - start }
      })
    )
  }

  function handleMouseup(event) {
    if (event.type === "mouseup" && event.button !== 0) return

    x = event.clientX
    y = event.clientY

    node.dispatchEvent(
      new CustomEvent("dragend", {
        detail: { x, y, time: new Date() - start }
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
