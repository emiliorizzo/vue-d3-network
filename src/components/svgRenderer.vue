<template lang="pug">
  svg(ref="svg" 
    :width="size.w" 
    :height="size.h"
    class="net-svg" 
    @mouseup='emit("dragEnd",[$event])'
    @touchend.passive='emit("dragEnd",[$event])'
    @touchstart.passive=''
    )
   
    //-> links  
    g.links#l-links( v-if='strLinks')
        line( v-for="link,index in links" 
          :x1='link.source.x' 
          :y1='link.source.y' 
          :x2='link.target.x' 
          :y2='link.target.y' 
          @click='emit("linkClick",[$event,link])'
          @touchstart.passive='emit("linkClick",[$event,link])'
          :stroke-width='linkWidth'
          :class='linkClass(link.id)')
    
    g.links#l-links(v-else)
        path(v-for="link in links" ouch
          :d="curve(link)"
          @click='emit("linkClick",[$event,link])'
          @touchstart.passive='emit("linkClick",[$event,link])'
          :stroke-width='linkWidth'
          :class='linkClass(link.id) + " curve"')
    //- -> nodes
    g.nodes#l-nodes(v-if='!noNodes')
      template(v-for='(node,key) in nodes')
        svg(v-if='svgIcon(node)' 
          :key='key'
          :viewBox='svgIcon(node).attrs.viewBox'
          :width='getNodeSize(node, "width")'
          :height='getNodeSize(node, "height")' 
          @click='emit("nodeClick",[$event,node])'
          @touchend.passive='emit("nodeClick",[$event,node])'
          @mousedown.prevent='emit("dragStart",[$event,key])'
          @touchstart.passive='emit("dragStart",[$event,key])'
          :x='node.x - getNodeSize(node, "width") / 2'
          :y='node.y - getNodeSize(node, "height") / 2' 
          :style='nodeStyle(node)'
          :title="node.name"
          :class='"node-svg " + nodeClass(node)'
          v-html='svgIcon(node).data'
          )

        //- default circle nodes
        circle(v-else
        :key='key'
        :r="getNodeSize(node) / 2" 
        @click='emit("nodeClick",[$event,node])'
        @touchend.passive='emit("nodeClick",[$event,node])'
        @mousedown.prevent='emit("dragStart",[$event,key])'
        @touchstart.passive='emit("dragStart",[$event,key])'
        :cx="node.x" 
        :cy="node.y" 
        :style='nodeStyle(node)'
        :title="node.name"
        :class="nodeClass(node)"
        )

    //- -> Labels  
    g.labels#node-labels( v-if="nodeLabels")
      text.node-label(v-for="node in nodes"
        :x='node.x + (getNodeSize(node) / 2) + (fontSize / 2)'
        :y='node.y + labelOffset.y'
        :font-size="fontSize"
        :class='(node._labelClass) ? node._labelClass : ""'
        :stroke-width='fontSize / 8'  
      ) {{ node.name }}
</template>
<script>
import svgExport from '../lib/svgExport.js'

export default {
  name: 'svg-renderer',
  props: ['size',
    'nodes',
    'noNodes',
    'selected',
    'linksSelected',
    'links',
    'nodeSize',
    'padding',
    'fontSize',
    'strLinks',
    'linkWidth',
    'nodeLabels',
    'labelOffset',
    'nodeSym'],

  computed: {
    nodeSvg () {
      if (this.nodeSym) {
        return svgExport.toObject(this.nodeSym)
      }
      return null
    }
  },
  methods: {
    getNodeSize (node, side) {
      let size = node._size || this.nodeSize
      if (side) size = node['_' + side] || size
      return size
    },
    svgIcon (node) {
      return node.svgObj || this.nodeSvg
    },
    emit (e, args) {
      this.$emit('action', e, args)
    },
    svgScreenShot (cb, toSvg, background, allCss) {
      let svg = svgExport.export(this.$refs.svg, allCss)
      if (!toSvg) {
        if (!background) background = this.searchBackground()
        let canvas = svgExport.makeCanvas(this.size.w, this.size.h, background)
        svgExport.svgToImg(svg, canvas, (err, img) => {
          if (err) cb(err)
          else cb(null, img)
        })
      } else {
        cb(null, svgExport.save(svg))
      }
    },
    linkClass (linkId) {
      let cssClass = 'link '
      if (this.linksSelected.hasOwnProperty(linkId)) {
        cssClass += 'selected'
      }
      return cssClass
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
      return (node._color) ? 'fill: ' + node._color : ''
    },
    nodeClass (node) {
      let cssClass = node._cssClass || ''
      cssClass += ' node'
      if (this.selected[node.id]) cssClass += ' selected'
      if (node.fx || node.fy) cssClass += ' pinned'
      return cssClass
    },
    searchBackground () {
      let vm = this
      while (vm.$parent) {
        let style = window.getComputedStyle(vm.$el)
        let background = style.getPropertyValue('background-color')
        let rgb = background.replace(/[^\d,]/g, '').split(',')
        let sum = rgb.reduce((a, b) => parseInt(a) + parseInt(b), 0)
        if (sum > 0) return background
        vm = vm.$parent
      }
      return 'white'
    },
    spriteSymbol () {
      let svg = this.nodeSym
      if (svg) {
        return svgExport.toSymbol(svg)
      }
    }
  }
}
</script>

