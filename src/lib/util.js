const theta = Math.PI * (3 - Math.sqrt(5))

export function phyllotaxis (radius) {
  return function (i) {
    const r = radius * Math.sqrt(i)
    const a = theta * i
    return [
      r * Math.cos(a),
      r * Math.sin(a)
    ]
  }
}
