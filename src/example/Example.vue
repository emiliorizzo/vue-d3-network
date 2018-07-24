<template lang="pug">
  #app
    d3-net-example
    //-.menu-container
      //- Menu
      .menu
        .title
          h1 {{ app.name }}
          h2.subtitle {{ app.des }}
    //-Links
    ul.links
        li
          a(:href='app.repo')
            .icon(v-html='icons.gitHub')

</template>

<script>
import ghIcon from '../assets/github.svg?raw'
import d3NetExample from './d3-net-example.vue'

export default {
  name: 'example',
  components: {
    d3NetExample
  },
  data () {
    return {
      icons: {
        gitHub: ghIcon
      },
      app: process.env.APP
    }
  }
}
</script>
<style lang="stylus">
@import '../lib/styl/vars.styl'
@import 'html.styl'
  body
    font-family: 'Asap', sans-serif
    color: $darkness
    background-color: $bg !important
 #app
    position: absolute
    max-width: 100%
    width: 100%
    top: 0
    left: 0
    bottom:0
  .menu-container
    position:fixed
    bottom: 0
    z-index:50
    margin: 5em
    width: 25em
    max-width: 25em
  h1
    font-size: 1.7em
    letter-spacing: 0.0325em
    color: $color2
  div.menu
    border: $dark 1px solid
    border-top-width: 10px
    border-bottom-width: 5px
    padding: 1em 2em
    background-color: $color
    color: white
    box-shadow: $sh
    margin-top: 1em
    .title
      border: 1.5px $lightness
      border-style: dotted none
      padding: .5em 0

      h1, h2
        margin:0 0 .5em 0
      h1
        font-size: 1.7em
        letter-spacing: 0.0325em
        font-family: 'Belgrano', serif
        text-shadow: $sh, $sh
      h2
        font-size: 0.8em
        font-style: italic
       letter-spacing: 0.0625em

  .links
    margin: 1em 5em 0 0
    position: absolute
    list-style: none
    top: 0
    right: 0

  .icon
    svg
      padding: 0.1em
      background-color: white
      border-radius: 50%
      display: inline-block
      width: 3em
      height: 3em
      fill: $color

  .set
    margin: 1em
    display: inline-block

  .console
    display: block
    max-width: 20em
    position: fixed
    margin: 5em
    right: 0
    bottom: 0
    color: $dark

  #app
    text-align:center
    user-select: none
</style>
