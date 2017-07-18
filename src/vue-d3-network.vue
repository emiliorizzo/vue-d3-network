<template lang="pug">
  div.net
    svg( ref="svg" 
      :width="size.w" 
      :height="size.h"
      class="graph" 
      @mousemove.capture="move"
      @mouseup="dragEnd")
      //-> links
      g( v-if='strLinks' id="links" class="links")
          line( v-for="link,index in links" 
            :x1='link.source.x' 
            :y1='link.source.y' 
            :x2='link.target.x' 
            :y2='link.target.y' 
            @click="clickLink($event,link)"
            :stroke-width='linkWidth'
            :class='linkClass(link.id)')
      
      g( v-else id="links" class="links" )
          path(v-for="link in links" 
            :d="curve(link)"
            @click="clickLink($event,link)"
            :stroke-width='linkWidth'
            :class='linkClass(link.id) + " curve"')
      //- -> nodes
      g( id="nodes" class="nodes" )
        circle(v-for='(node,key) in nodes'
        :key='key'
        :r="nodeSize" 
        @click='clickNode($event,node)'
        @mousedown.prevent="dragStart($event,key)"
        :cx="node.x" 
        :cy="node.y" 
        :style='nodeStyle(node)'
        :title="node.name"
        :class="nodeClass(node)"
        )
      //- -> Labels  
      g( v-if="nodeLabels" id="names")
        text(v-for="node in nodes"
          :x='node.x + nodeSize + fontSize /2'
          :y='node.y + nodeSize  - fontSize /2'
          font-family="Arial"
          :font-size="fontSize"
          class="node-names"
          :stroke-width='fontSize / 8'  
        ) {{ node.name }}

</template> 
<script>
import * as forceSimulation from 'd3-force'
const d3 = Object.assign({}, forceSimulation)

export default {
  name: 'd3-network',
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
      nodes: [],
      links: [],
      simulation: null,
      force: 500,
      size: { w: 500, h: 500 },
      offset: {
        x: 0,
        y: 0
      },
      maxLinks: 3,
      maxNodes: 20,
      strLinks: true,
      linkStyle: 'line',
      fontSize: 10,
      dragging: false,
      mouseOfst: {
        x: 0,
        y: 0
      },
      conf: {
        allEventsAs: false
      },
      linkWidth: 1,
      nodeLabels: false,
      nodeSize: 5,
      padding: {
        x: 0,
        y: 0
      }
    }
  },
  created () {
    this.updateOptions(this.options)
    this.buildNodes(this.netNodes)
    this.links = this.buildLinks(this.netLinks)
  },
  mounted () {
    this.size.w = this.$el.clientWidth
    this.size.h = this.$el.clientHeight
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
    onResize () {
      this.size.w = this.$el.clientWidth
      this.size.h = this.$el.clientHeight
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
        // source and target for d3
        link.source = link.sid
        link.target = link.tid
        return link
      })
    },
    // -- Animation
    simulate (nodes, links) {
      return d3.forceSimulation()
        .alpha(0.6)
        .nodes(nodes)
        .force('center', d3.forceCenter(this.center.x, this.center.y))
        .force('X', d3.forceX(this.center.x).strength(0.5))
        .force('Y', d3.forceY(this.center.y).strength(0.5))
        .force('charge', d3.forceManyBody().strength(-this.force))
        .force('link', d3.forceLink(links).id(function (d) { return d.id }))
    },
    animate () {
      if (this.simulation) this.simulation.stop()
      this.simulation = this.simulate(this.nodes, this.links)
    },
    reset () {
      this.animate()
      this.nodes = this.simulation.nodes()
      this.links = this.simulation.force('link').links()
    },
    // -- Mouse Interaction
    move (event) {
      if (this.dragging !== false) {
        if (this.nodes[this.dragging]) {
          this.simulation.restart()
          this.simulation.alpha(0.5)
          this.nodes[this.dragging].fx = event.clientX - this.padding.x - this.offset.x
          this.nodes[this.dragging].fy = event.clientY - this.padding.y - this.offset.y
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
    linkClass (linkId) {
      let cssClass = 'link '
      if (this.linksSelected.hasOwnProperty(linkId)) {
        cssClass += 'selected'
      }
      return cssClass
    },
    clickNode (event, node) {
      this.$emit('node-click', event, node)
    },
    clickLink (event, link) {
      this.$emit('link-click', event, link)
    },
    curve (link) {
      let d = {
        M: [link.source.x, link.source.y],
        Q: [link.source.x, link.target.y],
        X: [link.target.x, link.target.y]
      }
      return 'M ' + d.M + ' Q ' + d.Q.join(' ') + ' ' + d.X
    },
    nodeStyle (node) {
      let style = ''
      if (node.color) style += 'fill: ' + node.color
      return style
    },
    nodeClass (node) {
      let cssClass = 'node'
      if (this.selected[node.id]) cssClass += ' selected'
      if (node.fx || node.fy) cssClass += ' pinned'
      return cssClass
    },
    setMouseOffset (event, node) {
      let x = 0
      let y = 0
      if (event && node) {
        x = event.clientX - node.x
        y = event.clientY - node.y
      }
      this.mouseOfst = { x, y }
    }
  }
}
</script>

<style lang="stylus">
 @import 'vars.styl'
.net
  height: 100%
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
.node-names
  fill: $dark
</style>  

