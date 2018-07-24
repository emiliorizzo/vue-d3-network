<template lang="pug">
  #selection.notification
    .close(@click='emit("clearSelection")')
    h4 Selected
    .mini-list
      table.mini
        tr
          th id
          th name
          th
          th
        tr(v-for="value,key in nodes")
          td {{ value.id }}
          td {{ value.name }}
          td
            button.icon(@click='emit("removeNode",[value.id])' title="delete")
              span(class="icon-delete")
          td
            button.icon(@click='emit("unSelectNode",[value.id])' title="unselect") ❌
    ul.list
      li Nodes:
        strong {{ Object.keys(nodes).length }}
      li Links:
        strong {{ Object.keys(links).length }}
</template>
<script>
export default {
  name: 'd3-net-selection',
  props: ['data'],
  methods: {
    emit (action, args) {
      this.$emit('action', action, args)
    }
  },
  computed: {
    links () {
      return this.data.links
    },
    nodes () {
      return this.data.nodes
    }
  }
}
</script>
<style lang="stylus">
@import '../lib/styl/vars.styl'
  $btn-size = 1.5em

button.icon
  background-color: white
  border-style: none
  font-size: 1em
  height: $btn-size
  width: $btn-size
  line-height: 1.25em
  border-radius: 50%
  padding:0
  margin:0
  color:$color

button.big
  margin-bottom: 1em
  span
    font-size: 2em

.mini
  font-size: 0.75em

 .title
    color: $color
    font-weight: bold
table
  border-collapse: collapse
tr
  border-bottom: solid 1px lightgrey
th
  border-bottom: solid 2px lightgrey
th
td
  padding: 0 .5em
  text-align: left

.mini-list
ul.list
  display:inline-block
  list-style: none

.notification
  position: absolute
  bottom: 7em
  right: 3em
  z-index: 100
  width: auto
  padding: 1em 3em 1em 2em
  border-radius: 0.5em
  box-shadow: $box-sh
  border: $border
  background-color: white
  box-shadow: $hard-sh

  .mini-list
    max-height: 10em
    overflow-y: scroll
    overflow-x: hidden
</style>
