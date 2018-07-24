export default {
  NS: 'http://www.w3.org/2000/svg',
  // svgOrg: svg element
  // allCss : true includes all svg css styles, false includes only matched styles
  export (svgOrg, allCss) {
    let svg = null
    if (this.isSvgData(svgOrg)) {
      svg = svgOrg.cloneNode(true)
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
        let style = document.createElementNS(this.NS, 'style')
        style.type = 'text/css'
        svg.insertBefore(style, svg.childNodes[0])
        style.innerHTML = css
        svg.appendChild(style)
      }
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
      cb(null, png, ctx)
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
  },

  toDom (svgData) {
    let div = document.createElement('div')
    div.innerHTML = svgData
    return div.firstChild || null
  },

  toObject (svg) {
    if (svg) {
      let attrs = {}
      if (svg.attributes) {
        for (let i = svg.attributes.length; i >= 0; i--) {
          let a = svg.attributes[i]
          if (a) attrs[a.name] = a.value
        }
      }
      let data = svg.innerHTML
      if (data) return { attrs, data }
    }
    return null
  },

  svgElFromString (svgData) {
    let svgEl = this.toDom(svgData)
    if (!this.isSvgData(svgEl)) return
    svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    return svgEl
  },

  svgDataToUrl (svgData, attrs) {
    if (typeof (attrs) === 'object') {
      for (let a in attrs) {
        let attribute = (attrs[a]) ? (attrs[a]) : ''
        svgData.setAttribute(a, attribute)
      }
    }
    let svg = this.export(svgData)
    if (svg) return this.svgToUrl(this.serialize(svg))
    return null
  },

  isSvgData (svgData) {
    if (!svgData.firstChild) return false
    return (svgData.firstChild.parentNode.nodeName === 'svg')
  },

  svgToUrl (svg) {
    let xml = new Blob([svg], { type: 'image/svg+xml' })
    let url = URL.createObjectURL(xml)
    return url
  }
}
