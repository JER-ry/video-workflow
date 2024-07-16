export function format(seconds) {
  if (isNaN(seconds)) return "--"

  const minutes = Math.floor(seconds / 60)
  seconds = Math.floor(seconds % 60)
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
