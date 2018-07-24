<template lang="pug">
  #menu
    ul.test-menu(v-if="setts")
      li
        label Nodes:
          span {{ setts.maxNodes }}
        input(type="range" v-model.number="setts.maxNodes" @input="change" min="1" :max='(opts.canvas) ? 3000: 1010' step="10")
      li
        label Max Links per Node:
          span {{ setts.maxLinks }}
        input(type="range" v-model.number="setts.maxLinks" @input="change" min="1" max="10" step="1")
      li
        label Render type
      li
        input(type='radio' :value='false' v-model='opts.canvas' id='svg-rad' @change="change")
        label(for='svg-rad') svg
        input(type='radio' :value='true' v-model='opts.canvas' id='canvas-rad' @change="change")
        label(for='canvas-rad') canvas
      li
        button.btn(@click="$emit('simulate')") Simulate

    ul.test-menu
      li
        label Force:
          span {{ opts.force }}
        input(type="range" v-model.number="opts.force" @input="change" min="1" max="5000" step="1")
      li
        label Offset X:
          span {{ opts.offset.x }}
        input(type="range" v-model.number="opts.offset.x" @input="change" min="-1000" max="1000" step="1")
      li
        label Offset Y:
          span {{ opts.offset.y }}
        input(type="range" v-model.number="opts.offset.y" @input="change" min="-1000" max="1000" step="1")
      li
        input(type="checkbox" v-model="opts.icon" @change="change")
        label Node Sprite

    ul.test-menu
      li
        label Node Size:
          span {{ opts.nodeSize }}
        input(type="range" v-model.number="opts.nodeSize" @input="change" min="3" max="100" step="1")
      li
        label Link Thickness:
          span {{ opts.linkWidth }}
        input(type="range" v-model.number="opts.linkWidth" @input="change" min="1" max="15" step="1")
      li
        input(type="checkbox" v-model="opts.nodeLabels" @change="change")
        label Show node names
      li
        input(type="checkbox" v-model="opts.linkLabels" @change="change")
        label Show link names

      li(v-if="opts.nodeLabels || opts.linkLabels")
        label Font Size:
          span {{ opts.fontSize }}
        input(type="range" v-model.number="opts.fontSize" @input="change" min="1" max="30" step="1")
      li
        input(type="checkbox" v-model="opts.strLinks" @change="change")
        label Straight Links

      li
        button.btn(@click="reset" title="reset options")
          span(class="icon-reset")
          small &nbsp;Reset

</template>
<script>
import defaultData from './data.js'
export default {
  name: 'd3-net-example-menu',
  props: ['links', 'nodes', 'settings', 'options'],
  data () {
    let data = Object.assign({}, defaultData)
    return {
      opts: data.options,
      showNodeValues: false,
      showLinkValues: false,
      setts: null
    }
  },
  created () {
    this.opts = this.options
    this.setts = this.settings
  },
  methods: {
    change () {
      this.$emit('options', this.opts)
    },
    reset () {
      this.opts = Object.assign({}, defaultData.options)
      this.options.width = this.$el.clientWidth
      this.options.height = this.$el.clientHeight
      this.$emit('reset', this.options)
    },
    emit (e) {
      this.$emit(e)
    }
  }
}
</script>
<style src="../assets/css/icons.css"></style>
<style lang="stylus" scoped>
 @import '../lib/styl/vars.styl'
.debug
  font-size: 0.5em
  list-style: none

.test-menu
  display: table-cell
  padding: 1em
  list-style: none
  li
    margin: 0.5em 0
    label
      font-size: 0.85em
      display: block
      span
        font-weight: normal
    input + label
      display: inline
      margin-left: .5em

ul.test-menu + ul.test-menu
  border-left: none

</style>
