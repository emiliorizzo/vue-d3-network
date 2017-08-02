export default {
  randomId () {
    return Math.random().toString(36).substring(7)
  },

  // gets canvas style from css properties
  fillStyle (style, svg) {
    let pseudo = null
    let id = 'picker-' + this.randomId()
    let el = this.canvasPicker(style, id)
    // to replace 'px'
    svg.appendChild(el)
    let props = {
      fillStyle: 'fill',
      strokeStyle: 'stroke',
      lineWidth: 'stroke-width',
      fontFamily: 'font-family'
    }
    style = this.mapStyle(id, props, style, pseudo)
    svg.removeChild(el)
    return style
  },
  mapStyle (id, props, style, pseudo, numberValues) {
    let cStyle = window.getComputedStyle(document.getElementById(id), pseudo)
    numberValues = numberValues || ['lineWidth']
    for (let p in props) {
      let value = cStyle.getPropertyValue(props[p])
      if (numberValues.indexOf(p) > -1) value = parseInt(value, 10)
      if (value) {
        style[p] = value
      }
    }
    return style
  },
  // creates svg elements to pick css properties
  canvasPicker (style, id) {
    let attrs = style._svgAttrs || {}
    let element = style._svgElement || 'circle'
    if (!style._svgAttrs) {
      switch (element) {
        case 'text':
          attrs = { x: 10, y: 10, fontSize: 20 }
          break
        case 'circle':
          attrs = { cx: 10, cy: 10, r: 10 }
          break
      }
    }
    attrs.class = style._cssClass
    attrs.id = id
    return this.svgCreate(element, attrs)
  },
  compColor (color) {
    let el = document.createElement('div')
    el.style.backgroundColor = color
    document.body.appendChild(el)
    let nColor = window.getComputedStyle(el, null).getPropertyValue('background-color')
    document.body.removeChild(el)
    return nColor
  },
  // creates svg element
  svgCreate (element, attrs) {
    let el = document.createElementNS('http://www.w3.org/2000/svg', element)
    for (let a in attrs) {
      el.setAttributeNS(null, a, attrs[a])
    }
    return el
  },
  create (element, idPref, appendTo) {
    appendTo = appendTo || 'body'
    let el = document.createElement(element)
    let id = idPref || ''
    id += this.randomId()
    el.setAttribute('id', id)
    document[appendTo].appendChild(el)
    return el
  }
}
