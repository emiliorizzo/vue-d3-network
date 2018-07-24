<template lang="pug">
  canvas(id='canvas' ref='canvas'
    :width='size.w'
    :height='size.h'
    :style='canvasStyle'
    @mouseup.prevent='canvasClick'
    @mousedown.prevent='canvasClick'
    @touchstart.prevent='canvasClick'
    @touchend.passive='canvasClick'
    v-render-canvas='{links, nodes}'
    )
</template>
<script>
import canvasStyles from '../lib/js/canvasStyles.js'
import stylePicker from '../lib/js/stylePicker.js'
import svgExport from '../lib/js/svgExport.js'
export default {
  name: 'canvas-renderer',
  props: [
    'size',
    'offset',
    'padding',
    'nodes',
    'selected',
    'linksSelected',
    'links',
    'nodeSize',
    'fontSize',
    'strLinks',
    'linkWidth',
    'nodeLabels',
    'labelOffset',
    'canvasStyles',
    'nodeSym',
    'noNodes'
  ],
  data () {
    return {
      hitCanvas: null,
      shapes: {},
      drag: null,
      stylesReady: false,
      CssStyles: true, // load style from css props
      // canvas styles
      styles: canvasStyles,
      sprites: {}
    }
  },
  computed: {
    nodeSvg () {
      return this.nodeSym
    },
    canvasStyle () {
      let left = this.padding.x + 'px'
      let top = this.padding.y + 'px'
      return { left, top }
    }
  },
  directives: {
    renderCanvas (canvas, data, vnode) {
      let nodes = data.value.nodes
      let links = data.value.links
      vnode.context.draw(nodes, links, canvas)
    }
  },
  created () {
    if (this.canvasStyles) {
      for (let o in this.canvasStyles) {
        this.styles[o] = this.canvasStyles[o]
      }
    }
  },
  mounted () {
    let vm = this
    this.$nextTick(() => {
      vm.hitCanvas.width = vm.size.w
      vm.hitCanvas.height = vm.size.h
    })
  },
  watch: {
    nodeSize () {
      this.resetSprites()
    },
    canvasStyles () {
      this.resetSprites()
    }
  },
  methods: {
    //  canvas to png
    canvasScreenShot (cb, bgColor) {
      let graph = this.$refs.canvas
      let canvas = document.createElement('canvas')
      canvas.width = graph.width
      canvas.height = graph.height
      // background color
      let background = this.styles.background
      if (bgColor) background = this.getCssColor(bgColor)
      let ctx = canvas.getContext('2d')
      ctx = this.setCtx(ctx, background)
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(graph, 0, 0)
      let img = canvas.toDataURL('image/png')
      if (img) cb(null, img)
      else cb(new Error('error generating canvas image'))
    },
    // emits events as 'action'
    emit (e, args) {
      this.$emit('action', e, args)
    },
    // creates 'virtual' canvas to catch mouse interaction
    canvasInit () {
      let hitCanvas = document.createElement('canvas')
      hitCanvas.width = this.size.w
      hitCanvas.height = this.size.h
      hitCanvas.top = this.offset.y
      hitCanvas.left = this.offset.x
      hitCanvas.id = 'hit-canvas'
      this.hitCanvas = hitCanvas
      this.resetSprites()
    },
    resetSprites () {
      this.sprites = {}
      let sprites = ['node', 'nodeSelected', 'nodePinned', 'nodeSelectedPinned']
      for (let sp of sprites) {
        this.sprites[sp] = this.nodeSprite(this.styles[sp])
      }
    },
    // canvas click handler
    canvasClick (event) {
      let hitCtx = this.hitCanvas.getContext('2d')
      let e = (event.touches) ? event.touches[0] || event.changedTouches[0] : event
      let scrollTop = document.body.scrollTop
      let scrollLeft = document.body.scrollLeft
      let x = e.clientX + scrollLeft - this.padding.x
      let y = e.clientY + scrollTop - this.padding.y

      let pixel = hitCtx.getImageData(x, y, 1, 1).data
      let color = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`
      let shape = this.shapes[color]
      if (shape) {
        let col = shape.type + 's'
        let item = this[col][shape.index]
        if (item) {
          if (event.type === 'mouseup' || event.type === 'touchend') {
            if (this.drag) {
              this.drag = null
              this.emit('dragEnd')
            }
            this.emit(shape.type + 'Click', [event, item])
          } else if (event.type === 'mousedown' || event.type === 'touchstart') {
            this.drag = item
            this.emit('dragStart', [event, item.index])
          }
        }
      }
    },
    // draw circ node to canvas
    drawNode (ctx, node) {
      ctx.beginPath()
      ctx.arc(node.x, node.y, this.nodeSize / 2, 0, 2 * Math.PI, false)
      let fillStyle = ctx.fillStyle
      let strokeStyle = ctx.strokeStyle
      if (node._color) ctx.fillStyle = node._color
      if (node._borderColor) ctx.strokeStyle = node._borderColor
      ctx.fill()
      ctx.stroke()
      ctx.closePath()
      ctx.fillStyle = fillStyle
      ctx.strokeStyle = strokeStyle
    },
    // draw link to canvas
    drawLink (ctx, link) {
      ctx.beginPath()
      ctx.moveTo(link.source.x, link.source.y)
      ctx.lineTo(link.target.x, link.target.y)
      ctx.lineWidth = this.linkWidth
      ctx.strokeStyle = (link._color) ? link._color : link.color
      ctx.stroke()
    },
    // draw text to canvas
    drawText (item, ctx, style, key) {
      ctx = this.setCtx(ctx, style)
      if (this.fontSize) ctx.font = this.fontSize + 'px ' + style.fontFamily
      let text = (key) ? item[key] : item.name
      // let x = (item.size) ? item.x + item.size : item.x
      // let y = (item.size) ? item.y + (item.size / 2) : item.y
      let x = item.x + this.labelOffset.x
      let y = item.y + this.labelOffset.y
      ctx.fillText(text, x, y)
    },
    // render canvas
    draw (nodes, links, canvas) {
      if (!this.hitCanvas) this.canvasInit()
      let ctx = canvas.getContext('2d')
      let hitCtx = this.hitCanvas.getContext('2d')
      if (!this.stylesReady && this.CssStyles) {
        this.getCssStyles()
        this.resetSprites()
      }
      // clean canvas
      ctx.clearRect(0, 0, this.size.w, this.size.h)

      // draw  links
      ctx = this.setCtx(ctx, this.styles.link)
      for (let link of links) {
        if (!this.linksSelected[link.id]) {
          this.drawLink(ctx, link)
        }
        this.mapShape(link, 'link', this.drawLink, hitCtx)
      }

      // draw selected links
      ctx = this.setCtx(ctx, this.styles.linkSelected)
      for (let lid in this.linksSelected) {
        let link = this.linksSelected[lid]

        if (this.isOnView(link.source) && this.isOnView(link.target)) {
          this.drawLink(ctx, link)
        }
      }

      // draw nodes
      ctx = this.setCtx(ctx, this.styles.node)
      for (let node of nodes) {
        if (this.isOnView(node)) {
          if (!this.noNodes) {
            let sprite = this.getNodeSprite(node)
            ctx.drawImage(sprite, node.x - sprite.width / 2, node.y - sprite.height / 2)
            // map node shape
            this.mapShape(node, 'node', this.drawNode, hitCtx)
          }
          // draw  node labels
          if (this.nodeLabels) {
            node.size = this.nodeSize
            this.drawText(node, ctx, this.labelStyle(node))
            // ctx = this.setCtx(ctx, this.styles.node)
          }
        }
      }
      // draw selected nodes
      ctx = this.setCtx(ctx, this.styles.nodeSelected)
      for (let nid in this.selected) {
        let node = this.selected[nid]
        if (this.isOnView(node)) {
          // this.drawNode(node, ctx)
          // let sprite = this.sprites.nodeSelected
          let sprite = this.getNodeSprite(node)
          ctx.drawImage(sprite, node.x - sprite.width / 2, node.y - sprite.height / 2)
        }
      }
    },
    getNodeSprite (node) {
      let name = this.nodeSpriteName(node)
      let sprite = this.sprites[name]
      if (!sprite) { // set style and create sprite
        let style = this.loadNodeStyle(node)
        sprite = this.nodeSprite(style)
        this.sprites[name] = sprite
      }
      return sprite
    },
    nodeSpriteName (node) {
      let name = 'node'
      if (this.selected[node.id]) name += 'Selected'
      if (node.pinned) name += 'Pinned'
      if (node._cssClass) name += '-' + node._cssClass
      if (node._color) name += '-' + stylePicker.compColor(node._color)
      return name
    },
    nodeSprite (style) {
      let size = this.nodeSize + this.styles.node.lineWidth
      let canvasSize = (this.nodeSvg) ? size : size * 2
      let canvas = this.spriteCanvas(canvasSize)
      let ctx = canvas.getContext('2d')
      if (this.nodeSvg) {
        let attrs = { width: size, height: size, class: style._cssClass || '', style: style._cssStyle || '' }
        let url = svgExport.svgDataToUrl(this.nodeSvg, attrs)
        if (url) {
          let img = new Image()
          img.onload = () => {
            ctx.drawImage(img, 0, 0)
            URL.revokeObjectURL(url)
          }
          img.onerror = (error) => {
            // eslint-disable-next-line
            console.log('error creating node image', error)
          }
          img.src = url
        }
      } else {
        ctx = this.setCtx(ctx, style)
        this.drawNode(ctx, { x: size, y: size })
      }
      return canvas
    },
    spriteCanvas (size) {
      let canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      return canvas
    },
    isOnView (obj) {
      return (obj.x > 0 && obj.y > 0 && obj.x < this.size.w && obj.y < this.size.h)
    },
    // index shapes by random colors
    mapShape (shape, type, drawFunc, hitCtx) {
      // search unique color index
      if (!shape.colorIndex) shape.colorIndex = this.newColorIndex()
      let nShape = Object.assign({}, shape)
      nShape.color = shape.colorIndex.rgb
      nShape.borderColor = shape.colorIndex.rgb
      nShape.type = type
      // uncoment to debug
      // hitCtx = this.$refs.canvas.getContext('2d') // to debug
      let sprite = this.sprites[type] // the color is not important
      if (sprite) {
        sprite = this.cloneCanvas(sprite)
        sprite = this.fillCanvas(sprite, shape.colorIndex)
        hitCtx.drawImage(sprite, shape.x - sprite.width / 2, shape.y - sprite.height / 2)
      } else {
        drawFunc(hitCtx, nShape)
      }
      this.shapes[shape.colorIndex.rgb] = nShape
    },
    fillCanvas (canvas, color) {
      let ctx = canvas.getContext('2d')
      let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      let pixels = canvas.width * canvas.height * 4
      for (let p = 3; p <= pixels; p += 4) {
        if (imgData.data[p] > 0) { // a
          imgData.data[p] = 255 // sers alpha max to prevent transparency match
          imgData.data[p - 3] = color.r // r
          imgData.data[p - 2] = color.g // g
          imgData.data[p - 1] = color.b // b
        }
      }
      ctx.putImageData(imgData, 0, 0)
      return canvas
    },
    // generates color intex to shapes
    newColorIndex () {
      while (true) {
        let color = this.randomColor()
        if (!this.shapes[color.rgb]) return color
      }
    },
    // generates random color
    randomColor () {
      const r = Math.round(Math.random() * 255)
      const g = Math.round(Math.random() * 255)
      const b = Math.round(Math.random() * 255)
      return { r, g, b, rgb: `rgb(${r},${g},${b})` }
    },
    // sets canvas context style
    setCtx (ctx, conf) {
      for (let p in conf) {
        ctx[p] = conf[p]
      }
      return ctx
    },
    cloneCanvas (canvas) {
      let newCanvas = document.createElement('canvas')
      let ctx = newCanvas.getContext('2d')
      newCanvas.width = canvas.width
      newCanvas.height = canvas.height
      ctx.drawImage(canvas, 0, 0)
      return newCanvas
    },
    Sprite (name, cb) {
      if (!this.sprites[name]) {
        this.sprites[name] = cb()
      }
      return this.sprites[name]
    },
    // sets canvas properties form css properies
    getCssStyles () {
      let svg = stylePicker.create('svg', 'css-picker')
      for (let styleName in this.styles) {
        let style = this.styles[styleName] || {}
        style = stylePicker.fillStyle(style, svg)
      }
      document.body.removeChild(svg)
      this.stylesReady = true
    },
    loadNodeStyle (node) {
      let styleName = 'node'
      let selected = this.selected[node.id]
      if (selected) styleName = 'nodeSelected'
      if (node.pinned) styleName = 'nodePinned'
      if (selected && node.pinned) styleName = 'nodeSelectedPinned'
      // merge styles and update
      if (node._cssClass) {
        let name = styleName + '-' + node._cssClass
        if (!this.styles[name]) {
          let cStyle = Object.assign({}, this.styles[styleName] || {})
          cStyle._cssClass = cStyle._cssClass || ''
          cStyle._cssClass += ' ' + node._cssClass
          this.updateStyle(name, cStyle)
        }
        styleName = name
      }
      let style = Object.assign({}, this.styles[styleName] || this.updateStyle(styleName))
      if (node._color) {
        style.fillStyle = node._color
        style._cssStyle = 'fill:' + node._color
      }
      if (node._cssClass) {
        style._cssClass += ' ' + node._cssClass
      }
      return style
    },
    updateStyle (styleName, style) {
      style = style || this.styles[styleName] || {}
      let svg = stylePicker.create('svg', 'css-picker')
      style = stylePicker.fillStyle(style, svg)
      this.styles[styleName] = style
      document.body.removeChild(svg)
      return style
    },
    getCssColor (color) {
      let el = stylePicker.create('div', 'color-picker')
      let id = el.id
      el.setAttribute('style', 'background-color:' + color)
      let style = stylePicker.mapStyle(id, { fillStyle: 'background-color' }, [])
      document.body.removeChild(el)
      return style
    },
    labelStyle (node) {
      let style = this.styles.labels
      let labelClass = node._labelClass
      if (labelClass) {
        let styleName = 'labels-' + labelClass
        let labelStyle = this.styles[styleName]
        if (!labelStyle) {
          labelStyle = Object.assign({}, style)
          labelStyle._cssClass += ' ' + labelClass
          labelStyle = this.updateStyle(styleName, labelStyle)
        }
        style = labelStyle
      }
      return style
    }
  }
}
</script>
<style lang="stylus">
  canvas
    position absolute
    top 0
    left 0
</style>
