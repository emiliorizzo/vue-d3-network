<template lang="pug">
  svg(ref="svg" 
    :width="size.w" 
    :height="size.h"
    class="net-svg" 
    @mousemove.capture='emit("move",[$event])'
    @mouseup='emit("dragEnd",[$event])'
    @touchmove.capture='emit("move",[$event])'
    @touchend.prevent='emit("dragEnd",[$event])'
    @touchstart.prevent=''
    )
   
    //-> links  
    g( v-if='strLinks' id="links" class="links")
        line( v-for="link,index in links" 
          :x1='link.source.x' 
          :y1='link.source.y' 
          :x2='link.target.x' 
          :y2='link.target.y' 
          @click='emit("linkClick",[$event,link])'
          @touchstart='emit("linkClick",[$event,link])'
          :stroke-width='linkWidth'
          :class='linkClass(link.id)')
    
    g( v-else id="links" class="links" )
        path(v-for="link in links" 
          :d="curve(link)"
          @click='emit("linkClick",[$event,link])'
          @touchstart='emit("linkClick",[$event,link])'
          :stroke-width='linkWidth'
          :class='linkClass(link.id) + " curve"')
    //- -> nodes
    g( v-if='!nodeSvg' id="nodes" class="nodes" )
      circle(v-for='(node,key) in nodes'
      :key='key'
      :r="nodeSize" 
      @click='emit("nodeClick",[$event,node])'
      @touchend.prevent='emit("nodeClick",[$event,node])'
      @mousedown.prevent='emit("dragStart",[$event,key])'
      @touchstart.prevent='emit("dragStart",[$event,key])'
      :cx="node.x" 
      :cy="node.y" 
      :style='nodeStyle(node)'
      :title="node.name"
      :class="nodeClass(node)"
      )
    //- -> nodes
    g( v-if='nodeSvg' id="nodes" class="nodes" )
      svg(v-for='(node,key) in nodes'
      :key='key'
      :viewBox='nodeSvg.attrs.viewBox'
      :width="nodeSize"
      :height="nodeSize" 
      @click='emit("nodeClick",[$event,node])'
      @touchend.prevent='emit("nodeClick",[$event,node])'
      @mousedown.prevent='emit("dragStart",[$event,key])'
      @touchstart.prevent='emit("dragStart",[$event,key])'
      :x='node.x - nodeSize / 2'
      :y='node.y - nodeSize / 2' 
      :style='nodeStyle(node)'
      :title="node.name"
      :class='"node-svg " + nodeClass(node)'
      v-html='nodeSvg.content'
      )
    //- -> Labels  
    g( v-if="nodeLabels" id="names")
      text(v-for="node in nodes"
        :x='node.x + labelOffset.x'
        :y='node.y + labelOffset.y'
        :font-size="fontSize"
        class="node-names"
        :stroke-width='fontSize / 8'  
      ) {{ node.name }}
</template>
<script>
import svgExport from '../lib/svgExport.js'

export default {
  name: 'svg-renderer',
  props: ['size',
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

