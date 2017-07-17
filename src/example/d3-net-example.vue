<template lang="pug">
  #example(@keyup.esc='setTool("pointer")')
    //-> Network
    d3-network(
    :netNodes="nodes" 
    :netLinks="links"
    :selection="{nodes: selected, links: linksSelected}"
    :options="options"
    @node-click="nodeClick"
    @link-click="linkClick"
    )
    //-> Tools
    .tools
      ul
        li(v-for='t,to in tools') 
          button.circle(@click='setTool(to)' :class='buttonClass(to)')
            span(:class='t.class' )
      .tip {{ tools[tool].tip }}
    
    //-> Selection
    selection( v-if='showSelection'
      @action="selectionEvent" 
      :data="selection()")
    //-> Menu
    .over
      .menu-net(v-if="showMenu")
        .close(@click="showMenu=false")
        d3-net-example-menu(
          :nodes="nodes" 
          :links="links" 
          :settings="settings"
          :options="options" 
          @options="changeOptions" 
          @simulate="reset"
          @reset="resetOptions"
          )
      
      .options.menu(v-else)
        button.menu(@click="showMenu=true")
          span(class="icon-equalizerh")
        .title
          h1 {{app.name}}
        ul.inline
          li
            small nodes: {{ nodes.length }}
          li
            small links: {{ links.length }}
</template>


<script>
import * as utils from './utils.js'
import defaultData from './data.js'
import D3Network from '../vue-d3-network.vue'
import D3NetExampleMenu from './Menu.vue'
import Selection from './Selection.vue'

export default {
  name: 'd3-net-example',
  components: {
    D3Network,
    D3NetExampleMenu,
    Selection
  },
  data () {
    let data = Object.assign({}, defaultData)
    data.tools = {
      pointer: {
        tip: 'Select',
        class: 'icon-pointer'
      },
      killer: {
        tip: 'Click on link or node to kill',
        class: 'icon-delete_forever'
      },
      parent: {
        tip: 'click on node to create parent',
        class: 'icon-repo-forked'
      },
      pin: {
        tip: 'click on node to pin / unpin ',
        class: 'icon-pin'
      }
    }
    data.app = APP
    data.tool = 'pointer'
    data.lastNodeId = 0
    data.lastLinkId = 0
    data.settings = {
      maxLinks: 3,
      maxNodes: 150
    }
    return data
  },
  mounted () {
    this.options.size.w = this.$el.clientWidth
    this.options.size.h = this.$el.clientHeight
  },
  created () {
    this.reset()
  },
  computed: {
    showSel () {
      return true
    }
  },
  methods: {
    resetOptions () {
      this.$set(this.$data, 'options', defaultData.options)
      this.options.offset.x = 0
      this.options.offset.y = 0
    },
    selection () {
      return {
        nodes: this.selected,
        links: this.linksSelected
      }
    },
    buttonClass (tool) {
      if (tool === this.tool) return 'selected'
    },
    setTool (tool) {
      this.tool = tool
      let cursorClass = (tool === 'pointer') ? '' : 'cross-cursor'
      this.$el.className = cursorClass
    },
    updateSelection () {
      this.showSelection = (Object.keys(this.selected).length | Object.keys(this.linksSelected).length)
    },
    reset () {
      this.nodes = utils.makeRandomNodes(this.settings.maxNodes)
      this.lastNodeId = this.nodes.length + 1
      this.links = utils.makeRandomLinks(this.nodes, this.settings.maxLinks)
      this.lastLinkId = this.links.length + 1
    },
    changeOptions (options) {
      this.options = Object.assign({}, options)
    },
    removeLink (link) {
      this.links.splice(link.index, 1)
    },
    rebuildLinks (nodes) {
      if (!nodes) nodes = this.nodes
      let links = utils.rebuildLinks(nodes, this.links)
      for (let link of links.removed) {
        if (this.linksSelected[link.id]) {
          delete (this.linksSelected[link.id])
        }
      }
      return links.newLinks
    },
    removeNode (nodeId) {
      utils.removeNode(nodeId, this.nodes, (nodes) => {
        if (nodes) {
          this.links = this.rebuildLinks(nodes)
          this.unSelectNode(nodeId)
          this.nodes = utils.rebuildNodes(this.links, nodes)
        }
      })
    },
    pinNode (node) {
      if (!node.pinned) {
        node.pinned = true
        node.fx = node.x
        node.fy = node.y
      }
      else {
        node.pinned = false 
        node.fx = null
        node.fy = null
      }
      this.nodes[node.index] = node
    },
    // -- Selection
    selectNode (node) {
      this.selected[node.id] = node
    },
    selectNodesLinks () {
      for (let link of this.links) {
        // node is selected
        if (this.selected[link.sid] || this.selected[link.tid]) {
          this.selectLink(link)
          // node is not selected
        } else {
          this.unSelectLink(link.id)
        }
      }
    },
    nodeClick (event, node) {
      switch (this.tool) {
        case 'killer':
          this.removeNode(node.id)
          break
        case 'parent':
          this.createParent(node)
          break
        case 'pin':
          this.pinNode(node)
          break
        default: // selection tool
          // is selected
          if (this.selected[node.id]) {
            this.unSelectNode(node.id)
            // is not selected
          } else {
            this.selectNode(node)
          }
          this.selectNodesLinks()
          break
      }
      this.updateSelection()
    },
    linkClick (event, link) {
      if (this.tool === 'killer') {
        this.removeLink(link)
      } else {
        if (this.linksSelected[link.id]) {
          this.unSelectLink(link.id)
        } else {
          this.selectLink(link)
        }
      }
      this.updateSelection()
    },
    createParent (node) {
      let nodeId = this.lastNodeId + 1
      let linkId = this.lastLinkId + 1
      let nNode = utils.newNode(nodeId)
      nNode.x = node.x + 50
      nNode.y = node.y + 50
      this.nodes = this.nodes.concat(nNode)
      this.lastNodeId++
      this.links = this.links.concat(utils.newLink(linkId, node.id, nodeId))
      this.lastLinkId++
    },
    selectLink (link) {
      this.linksSelected[link.id] = link
    },
    selectionEvent (action, args) {
      utils.methodCall(this, action, args)
      this.updateSelection()
    },
    clearSelection () {
      this.selected = {}
      this.linksSelected = {}
    },
    unSelectNode (nodeId) {
      if (this.selected[nodeId]) {
        delete (this.selected[nodeId])
      }
      this.selectNodesLinks()
    },
    unSelectLink (linkId) {
      if (this.linksSelected[linkId]) {
        delete (this.linksSelected[linkId])
      }
    }
  }
}
</script>
<style lang="stylus">
@import '../vars.styl'
@import 'html.styl'
html, body 
  display: inline-block
#app
.net
button
  margin: 0
  padding: 0

button.menu
  width: 1.5em
  height: 1.5em
  padding: 0
  font-size 2em
  font-weight: bold  
  color: $color
  border: $border
  &:hover
    color:$color2
.circle
  width: 4em
  height: 4em
  font-weight: bold
  border-radius: 50%
  border:$border  
.connected
  color: $color

.disconnected
  color: $warn

.over
  position: absolute
  bottom: 0
  left: 0
  z-index: 100
  padding: 1em

.menu
  position: relative
  display: inline-block
  padding-right: 3em
  border-radius: .25em


.options
  padding: .5em 2em
  border-radius: .5em
  text-align: center
  margin-bottom: 2em

.close
  display: block
  &:after
    content: $sym-close
    position: absolute
    right: 1em
    top: .5em
    font-size: 1.25em
    color: $color
    font-family: sans-serif
    text-shadow: $txt-sh
  &:hover
    &:after
      color: $dark

ul.inline
  display: inline 
  margin:0
  padding:0
  color: white

.inline
  list-style: none
  li
    display: inline-block
    &:after
      content: '/'
      margin: 0 0.5em
 
.sym-pointer
  &:after
    content: $sym-pointer

.sym-kill
  &:after
    content: $sym-kill

.sym-parent
  &:after
    content: $sym-parent
    
.cross-cursor
  cursor: crosshair

.tools
  position: absolute
  bottom: 3em
  right:4em
  z-index: 101
  text-align: center
  ul
    list-style: none
    margin: 0 3em .5em  0
    padding:0
    li
      display: inline
      margin-left: .5em
    button
      width: 3em
      height: 3em
      padding: 0
      &:hover 
        border-color: $color2
      span
        font-size: 2.5em
        line-height: 1em
        color: $color
        &:hover
          color:$color2
  .selected 
    border-color: $color2
    span
      color: $color2
        
.tip
  margin-right: 1em
  font-style: italic
  font-size: .8em
  color: white

 .menu-net
  background-color: $bg-plus
  padding: .5em 1em
  border: $dark solid 2px 
  position: relative
  margin-bottom: 2em
  .close
    position: absolute
    top: 0
    right: 0
    &:after
      color: $dark
    &:hover
      &::after
        color:$color   

.title
  border: 1.5px $white
  border-style: dotted none
  padding: .5em 0 
  margin: 1.5em 1em .5em .5em
  h1
    color: $white
    text-shadow: $txt-sh
</style>
