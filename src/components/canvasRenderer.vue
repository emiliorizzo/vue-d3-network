<template lang="pug">
  canvas(id='canvas' ref='canvas' 
    :width='size.w' 
    :height='size.h'
    @mousemove.capture='emit("move",[$event])'
    @mouseup.prevent='canvasClick'
    @mousedown.prevent='canvasClick'
    @touchmove.capture='emit("move",[$event])'
    @touchstart.prevent='canvasClick'
    @touchend.prevent='canvasClick'
    v-render-canvas='{links, nodes}'
    )
</template>
<script>
import canvasStyles from '../lib/canvasStyles.js'
import stylePicker from '../lib/stylePicker.js'
export default {
  name: 'canvas-renderer',
  props: [
    'size',
    'offset',
    'nodes',
    'selected',
    'linksSelected',
    'links',
    'nodeSize',
    'fontSize',
    'strLinks',
    'linkWidth',
    'nodeLabels',
    'canvasStyles'
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
      else cb('error generating canvas image')
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
      this.sprites.node = this.nodeSprite(this.styles.node)
      this.sprites.nodeSelected = this.nodeSprite(this.styles.nodeSelected)
      this.sprites.nodePinned = this.nodeSprite(this.styles.nodePinned)
    },
    // canvas click handler
    canvasClick (event) {
      let hitCtx = this.hitCanvas.getContext('2d')
      let e = (event.touches) ? event.touches[0] || event.changedTouches[0] : event
      let x = e.clientX - this.offset.x
      let y = e.clientY - this.offset.y

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
    // draw node to canvas
    drawNode (node, ctx) {
      ctx.beginPath()
      ctx.arc(node.x, node.y, this.nodeSize, 0, 2 * Math.PI, false)
      let fillStyle = ctx.fillStyle
      if (node.color) ctx.fillStyle = node.color
      ctx.fill()
      ctx.stroke()
      ctx.closePath()
      ctx.fillStyle = fillStyle
    },
    // draw link to canvas
    drawLink (link, ctx) {
      ctx.beginPath()
      ctx.moveTo(link.source.x, link.source.y)
      ctx.lineTo(link.target.x, link.target.y)
      ctx.lineWidth = this.linkWidth
      ctx.strokeStyle = link.color
      ctx.stroke()
    },
    // draw text to canvas
    drawText (item, ctx, style, key) {
      ctx = this.setCtx(ctx, style)
      if (this.fontSize) ctx.font = this.fontSize + 'px ' + style.fontFamily
      let text = (key) ? item[key] : item.name
      let x = (item.size) ? item.x + item.size * 1.25 : item.x
      let y = (item.size) ? item.y + item.size / 2 : item.y
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
          this.drawLink(link, ctx)
        }
        this.mapShape(link, 'link', this.drawLink, hitCtx)
      }

      // draw selected links
      ctx = this.setCtx(ctx, this.styles.linkSelected)
      for (let lid in this.linksSelected) {
        let link = this.linksSelected[lid]

        if (this.isOnView(link.source) && this.isOnView(link.target)) {
          this.drawLink(link, ctx)
        }
      }

      // draw nodes
      ctx = this.setCtx(ctx, this.styles.node)
      for (let node of nodes) {
        if (this.isOnView(node)) {
          // this.drawNode(node, ctx)
          let sprite = this.sprites.node
          if (node.pinned) sprite = this.sprites.nodePinned

          if (node.color) {
            let spriteName = 'node-' + node.color
            if (!this.sprites[spriteName]) {
              let style = Object.assign({}, this.styles.node)
              style.fillStyle = node.color
              this.sprites[spriteName] = this.nodeSprite(style)
            }
            sprite = this.sprites[spriteName]
          }
          ctx.drawImage(sprite, node.x - sprite.width / 2, node.y - sprite.height / 2)
          this.mapShape(node, 'node', this.drawNode, hitCtx)

          // draw  node labels
          if (this.nodeLabels) {
            node.size = this.nodeSize
            this.drawText(node, ctx, this.styles.labels)
            ctx = this.setCtx(ctx, this.styles.node)
          }
        }
      }
      // draw selected nodes
      ctx = this.setCtx(ctx, this.styles.nodeSelected)
      for (let nid in this.selected) {
        let node = this.selected[nid]
        if (this.isOnView(node)) {
          // this.drawNode(node, ctx)
          let sprite = this.sprites.nodeSelected
          ctx.drawImage(sprite, node.x - sprite.width / 2, node.y - sprite.height / 2)
        }
      }
    },
    nodeSprite (style) {
      let size = this.nodeSize + this.styles.node.lineWidth
      let canvas = this.spriteCanvas(size * 2)
      let ctx = canvas.getContext('2d')
      ctx = this.setCtx(ctx, style)
      ctx.beginPath()
      ctx.arc(size, size, this.nodeSize, 0, 2 * Math.PI, false)
      ctx.fill()
      ctx.stroke()
      ctx.closePath()
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
      nShape.color = shape.colorIndex
      nShape.type = type
      drawFunc(nShape, hitCtx)
      this.shapes[shape.colorIndex] = nShape
    },
    // generates color intex to shapes
    newColorIndex () {
      while (true) {
        let color = this.randomColor()
        if (!this.shapes[color]) return color
      }
    },
    // generates random color
    randomColor () {
      const r = Math.round(Math.random() * 255)
      const g = Math.round(Math.random() * 255)
      const b = Math.round(Math.random() * 255)
      return `rgb(${r},${g},${b})`
    },
    // sets canvas context style
    setCtx (ctx, conf) {
      for (let p in conf) {
        ctx[p] = conf[p]
      }
      return ctx
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
        let style = this.styles[styleName]
        style = stylePicker.fillStyle(style, svg)
      }
      document.body.removeChild(svg)
      this.stylesReady = true
    },
    getCssColor (color) {
      let el = stylePicker.create('div', 'color-picker')
      let id = el.id
      el.setAttribute('style', 'background-color:' + color)
      let style = stylePicker.mapStyle(id, { fillStyle: 'background-color' }, [])
      document.body.removeChild(el)
      return style
    }
  }
}
</script>
<style lang="stylus">
  canvas
    position:absolute
    top: 0
    left: 0
</style>
