export default {
  // svgOrg: svg element
  // allCss : true includes all svg css styles, false includes only matched styles
  export (svgOrg, allCss) {
    let NS = 'http://www.w3.org/2000/svg'
    let svg = svgOrg.cloneNode(true)
    let childs = svgOrg.parentNode.querySelectorAll('*')
    let cssStyle = {}
    let rules = this.getcssRules()

    for (let child of childs) {
      let elRules = rules
      if (!allCss) {
        elRules = rules.filter((rule) => {
          return child.matches(rule.selectorText)
        })
      }
      for (let rule of elRules) {
        cssStyle[rule.selectorText] = rule.cssText
      }
    }
    let css = Object.values(cssStyle).join('\n')
    if (css) {
      let style = document.createElementNS(NS, 'style')
      style.type = 'text/css'
      svg.insertBefore(style, svg.childNodes[0])
      style.innerHTML = css
      svg.appendChild(style)
    }
    return svg
  },
  makeCanvas (width, height, background) {
    let canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    let ctx = canvas.getContext('2d')
    ctx.fillStyle = background || 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    return canvas
  },
  serialize (svg) {
    return (new XMLSerializer()).serializeToString(svg)
  },
  svgToImg (svg, canvas, cb) {
    let xml = this.serialize(svg)
    let img = new Image()
    let ctx = canvas.getContext('2d')
    img.onload = function () {
      ctx.drawImage(this, 0, 0)
      let png = canvas.toDataURL('image/png')
      cb(null, png)
    }
    img.onerror = function (err) {
      cb(err)
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml)))
  },
  save (svg) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(this.serialize(svg))
  },
  getcssRules () {
    let rules = []
    for (let styles of document.styleSheets) {
      let styleRules = this.readRules(styles)
      for (let rule of styleRules) {
        if (rule && rule.cssText) {
          rules.push(rule)
        }
      }
    }
    return rules
  },
  readRules (styles) {
    try {
      if (!styles.cssRules) return styles.rules || []
    } catch (e) {
      // Firefox returns Security Error if stylesheet originates from different domain
      if (e.name !== 'SecurityError') throw e
      return []
    }
    return styles.cssRules
  }
}
