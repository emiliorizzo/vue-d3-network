<template lang="pug">
  div.net
    svg-renderer(v-if='!canvas' 
      @action='methodCall'
      ref='svg'
      :size='size' 
      :nodes='nodes' 
      :links='links' 
      :selected='selected' 
      :linksSelected='linksSelected' 
      :strLinks='strLinks'
      :linkWidth='linkWidth'
      :nodeLabels='nodeLabels'
      :nodeSize='nSize'
      :fontSize='fontSize'
      :labelOffset='labelOffset'
      :nodeSym='nodeSvg'
      )
    canvas-renderer(v-else 
      @action='methodCall'
      ref='canvas'
      :size='size'
      :offset='offset' 
      :nodes='nodes' 
      :links='links' 
      :selected='selected' 
      :linksSelected='linksSelected' 
      :strLinks='strLinks'
      :linkWidth='linkWidth'
      :nodeLabels='nodeLabels'
      :nodeSize='nSize'
      :fontSize='fontSize'
      :labelOffset='labelOffset'
      :canvasStyles='options.canvasStyles'
      :nodeSym='nodeSvg'
      )

</template> 
<script>
import * as forceSimulation from 'd3-force'
const d3 = Object.assign({}, forceSimulation)
import svgRenderer from './components/svgRenderer.vue'
import canvasRenderer from './components/canvasRenderer.vue'
import saveImage from './lib/saveImage.js'
import svgExport from './lib/svgExport.js'

export default {
  name: 'd3-network',
  components: {
    canvasRenderer,
    svgRenderer
  },
  props: {
    netNodes: {
      type: Array
    },
    netLinks: {
      type: Array
    },
    options: {
      type: Object
    },
    nodeSym: {
      type: String
    },
    nodeCb: {
      type: Function
    },
    linkCb: {
      type: Function
    },
    selection: {
      type: Object,
      default: () => {
        return {
          nodes: {},
          links: {}
        }
      }
    }
  },
  data () {
    return {
      canvas: false,
      nodes: [],
      links: [],
      size: {
        w: 500,
        h: 500
      },
      offset: {
        x: 0,
        y: 0
      },
      force: 500,
      strLinks: true,
      fontSize: 10,
      dragging: false,
      linkWidth: 1,
      nodeLabels: false,
      nodeSize: 5,
      mouseOfst: {
        x: 0,
        y: 0
      },
      padding: {
        x: 0,
        y: 0
      },
      simulation: null,
      nodeSvg: null
    }
  },
  created () {
    this.updateOptions(this.options)
    this.buildNodes(this.netNodes)
    this.links = this.buildLinks(this.netLinks)
    this.updateNodeSvg()
  },
  mounted () {
    this.onResize()
    this.$nextTick(() => {
      this.animate()
    })
    window.addEventListener('resize', this.onResize)
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.onResize)
  },
  computed: {
    selected () {
      return this.selection.nodes
    },
    linksSelected () {
      return this.selection.links
    },
    center () {
      return {
        x: this.size.w / 2 + (this.size.w / 200) * this.offset.x,
        y: this.size.h / 2 + (this.size.h / 200) * this.offset.y
      }
    },
    nSize () {
      let size = this.nodeSize
      if (!this.nodeSvg) size = size / 2
      return size
    },
    labelOffset () {
      return {
        x: (this.nodeSize / 2) + (this.fontSize / 2),
        y: this.fontSize / 2
      }
    }
  },
  watch: {
    netNodes (newValue) {
      this.buildNodes(newValue)
      this.reset()
    },
    netLinks (newValue, oldValue) {
      this.links = this.buildLinks(newValue)
      this.reset()
    },
    nodeSym () {
      this.updateNodeSvg()
    },
    options (newValue, oldValue) {
      this.updateOptions(newValue)
      if (oldValue.size && newValue.size) {
        if ((oldValue.size.w !== newValue.size.w) || (oldValue.size.h !== newValue.size.h)) {
          this.onResize()
        }
      }
      this.animate()
    }
  },
  methods: {
    updateNodeSvg () {
      let svg = null
      if (this.nodeSym) {
        svg = svgExport.svgElFromString(this.nodeSym)
      }
      this.nodeSvg = svg
    },
    methodCall (action, args) {
      let method = this[action]
      if (method && typeof (method) === 'function') {
        if (args) method(...args)
        else method()
      } else {
        console.error('Call to undefined method:', action)
      }
    },
    onResize () {
      if (!this.options.size.w) this.size.w = this.$el.clientWidth
      if (!this.options.size.h) this.size.h = this.$el.clientHeight
      this.padding.x = 0
      this.padding.y = 0
      // serach offsets of parents
      let vm = this
      while (vm.$parent) {
        this.padding.x += vm.$el.offsetLeft
        this.padding.y += vm.$el.offsetTop
        vm = vm.$parent
      }
      this.animate()
    },
    // -- Data
    updateOptions (options) {
      for (let op in options) {
        if (this.hasOwnProperty(op)) {
          this[op] = options[op]
        }
      }
    },
    buildNodes (nodes) {
      let vm = this
      this.nodes = nodes.map((node, index) => {
        // node formatter option
        node = this.itemCb(this.nodeCb, node)
        // index as default node id
        if (!node.id) vm.$set(node, 'id', index)
        // initialize node coords
        if (!node.x) vm.$set(node, 'x', 0)
        if (!node.y) vm.$set(node, 'y', 0)
        // node default name
        if (!node.name) vm.$set(node, 'name', 'node ' + node.id)
        return node
      })
    },

    buildLinks (links) {
      return links.concat().map((link) => {
        // link formatter option
        link = this.itemCb(this.linkCb, link)
        // source and target for d3
        link.source = link.sid
        link.target = link.tid
        return link
      })
    },
    itemCb (cb, item) {
      if (cb && typeof (cb) === 'function') item = cb(item)
      return item
    },
    // -- Animation
    simulate (nodes, links) {
      let sim = d3.forceSimulation()
        .stop()
        .alpha(0.5)
        // .alphaMin(0.05)
        .nodes(nodes)
        // .force('center', d3.forceCenter(this.center.x, this.center.y))
        .force('X', d3.forceX(this.center.x).strength(0.5))
        .force('Y', d3.forceY(this.center.y).strength(0.5))
        .force('charge', d3.forceManyBody().strength(-this.force))
        .force('link', d3.forceLink(links).id(function (d) { return d.id }))
      return sim
    },
    animate () {
      if (this.simulation) this.simulation.stop()
      this.simulation = this.simulate(this.nodes, this.links)
      this.simulation.restart()
    },
    reset () {
      this.animate()
      this.nodes = this.simulation.nodes()
      this.links = this.simulation.force('link').links()
    },
    // -- Mouse Interaction
    move (event) {
      let x = (event.touches) ? event.touches[0].clientX : event.clientX
      let y = (event.touches) ? event.touches[0].clientY : event.clientY
      if (this.dragging !== false) {
        if (this.nodes[this.dragging]) {
          this.simulation.restart()
          this.simulation.alpha(0.5)
          this.nodes[this.dragging].fx = x - this.padding.x - this.offset.x
          this.nodes[this.dragging].fy = y - this.padding.y - this.offset.y
        }
      }
    },
    dragStart (event, nodeKey) {
      this.dragging = (nodeKey === false) ? false : nodeKey
      this.setMouseOffset(event, this.nodes[nodeKey])
      if (!this.dragging) {
        this.simulation.alpha(0.1)
        this.simulation.restart()
        this.setMouseOffset()
      }
    },
    dragEnd () {
      let node = this.nodes[this.dragging]
      if (node && !node.pinned) {
        // unfix node position
        node.fx = null
        node.fy = null
      }
      this.dragStart(false)
    },
    // -- Render helpers
    nodeClick (event, node) {
      this.$emit('node-click', event, node)
    },
    linkClick (event, link) {
      this.$emit('link-click', event, link)
    },
    setMouseOffset (event, node) {
      let x = 0
      let y = 0
      if (event && node) {
        x = event.clientX - node.x
        y = event.clientY - node.y
      }
      this.mouseOfst = { x, y }
    },
    screenShot (name, bgColor, toSVG, svgAllCss) {
      let exportFunc
      let args = []
      if (this.canvas) {
        toSVG = false
        exportFunc = this.$refs.canvas.canvasScreenShot
        args = [bgColor]
      } else {
        exportFunc = this.$refs.svg.svgScreenShot
        args = [toSVG, bgColor, svgAllCss]
      }
      if (toSVG) name = name || 'export.svg'

      exportFunc((err, url) => {
        if (!err) {
          if (!toSVG) saveImage.save(url, name)
          else saveImage.download(url, name)
        }
        this.$emit('screen-shot', err)
      }, ...args)
    }
  }
}
</script>

<style lang="stylus">
 @import 'vars.styl'
.net
  height: 100%
  margin: 0
.net-svg 
  // fill: white // background color to export as image
.node 
  stroke: alpha($dark,0.7)
  stroke-width: 3px
  transition: fill 0.5s ease
  fill: $white
 
.node.selected
  stroke: $color2

.node.pinned
  stroke: alpha($warn,.6)

.link
  stroke: alpha($dark,0.3)
   
.node
.link
  stroke-linecap: round
  &:hover
      stroke: $warn
      stroke-width: 5px
 .link.selected
    stroke: alpha($color2,0.6)

.curve
  fill: none

.node-label
  fill: $dark
</style>  

