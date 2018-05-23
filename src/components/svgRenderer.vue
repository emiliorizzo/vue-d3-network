<template lang="pug">
  svg(
    xmlns="http://www.w3.org/2000/svg" 
    xmlns:xlink= "http://www.w3.org/1999/xlink"
    ref="svg" 
    :width="size.w" 
    :height="size.h"
    class="net-svg"
    @mouseup='emit("dragEnd",[$event])'
    @touchend.passive='emit("dragEnd",[$event])'
    @touchstart.passive=''
    )

    pan-zoom(ref="zoom" :panDisable="panDisable" v-bind="panZoomOptions")
      //-> links
      g.links#l-links
          path(v-for="link in links"
            :d="linkPath(link)"
            :id="link.id"
            @click='emit("linkClick",[$event,link])'
            @touchstart.passive='emit("linkClick",[$event,link])'
            :stroke-width='linkWidth'
            :class="getClass('link', link)"
            :style='linkStyle(link)'
            v-bind='link._svgAttrs')

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
            @touchstart.prevent='emit("dragStart",[$event,key])'
            :x='node.x - getNodeSize(node, "width") / 2'
            :y='node.y - getNodeSize(node, "height") / 2'
            :style='nodeStyle(node)'
            :title="node.name"
            class="node-svg"
            :class="getClass('node', node)"
            v-html='svgIcon(node).data'
            v-bind='node._svgAttrs'
            )

          //- default circle nodes
          circle(v-else
          :key='key'
          :r="getNodeSize(node) / 2"
          @click='emit("nodeClick",[$event,node])'
          @touchend.passive='emit("nodeClick",[$event,node])'
          @mousedown.prevent='emit("dragStart",[$event,key])'
          @touchstart.prevent='emit("dragStart",[$event,key])'
          :cx="node.x"
          :cy="node.y"
          :style='nodeStyle(node)'
          :title="node.name"
          :class="getClass('node', node)"
          v-bind='node._svgAttrs'
          )


    //-> Links Labels
    g.labels#link-labels(v-if='linkLabels')
      text.link-label(v-for="link in links" :font-size="fontSize" )
        textPath(v-bind:xlink:href="'#' + link.id" startOffset= "50%") {{ link.name }}
    
    //- -> Node Labels  
    g.labels#node-labels( v-if="nodeLabels")
      text.node-label(v-for="node in nodes"
        :x='node.x + (getNodeSize(node) / 2) + (fontSize / 2)'
        :y='node.y + labelOffset.y'
        :font-size="fontSize"
        :class='(node._labelClass) ? node._labelClass : ""'
        :stroke-width='fontSize / 8'  
      ) tspan(v-if="typeof node.name === 'string'") {{ node.name }}
          tspan(v-else v-for="(n, i) in node.name " :x="node.x + (getNodeSize(node) / 2) + (fontSize / 2)" :dy="i ? '1em':-fontSize / 2") {{ n }}
</template>
<script>
import svgExport from '../lib/svgExport.js'
import panZoom from './panZoom'

export default {
  name: 'svg-renderer',
  components: {
    panZoom
  },
  props: [
    'size',
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
    'linkLabels',
    'labelOffset',
    'nodeSym',
    'panDisable',
    'panZoomOptions'],

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
    getClass (type, oElement) {
      let aClass = [type]
      if (oElement._cssClass) aClass.push(oElement._cssClass)
      switch (type) {
        case 'link':
          if (this.linksSelected[oElement.id]) aClass.push('selected')
          if (!this.strLinks) aClass.push('curve')
          break
        case 'node':
          if (this.selected[oElement.id]) aClass.push('selected')
          if (oElement.fx || oElement.fy) aClass.push('pinned')
          break
      }
      return aClass
    },
    linkPath (link) {
      const isLTR = link.source.x < link.target.x
      const left = isLTR ? link.source : link.target
      const right = isLTR ? link.target : link.source
      let d = {
        M: [left.x | 0, left.y | 0],
        X: [right.x | 0, right.y | 0]
      }
      if (this.strLinks) {
        return 'M ' + d.M.join(' ') + ' L' + d.X.join(' ')
      } else {
        d.Q = [left.x, right.y]
        return 'M ' + d.M + ' Q ' + d.Q.join(' ') + ' ' + d.X
      }
    },
    nodeStyle (node) {
      return (node._color) ? 'fill: ' + node._color : ''
    },
    linkStyle (link) {
      return (link._color) ? 'stroke: ' + link._color : ''
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
    },
    getZoom() {
      return this.$refs.zoom.getZoom()
    }
  }
}
</script>

