# vue-d3-network
 > Vue component to graph networks using d3-force

[Demo](https://emiliorizzo.github.io/vue-d3-network/)

## Installation

``` bash
npm install vue-d3-network --save

```
## Usage
 
Import and register component

``` javascript
import D3network from 'vue-d3-network'

export default{
  ...
  components:{
    D3network
  }
}
```

include css 
``` html
<style src='vue-d3-network/dist/vue-d3-network.css'></style>

```
Or import source component from: 'vue-d3-network/src/vue-d3-network.vue'
And install devDependencies. (stylus and pug, see [package.json](https://github.com/emiliorizzo/vue-d3-network/blob/master/package.json))

## Example 

```html
<template>
  <div id="app">
    <d3-network :netNodes="nodes" :net-links="links" :options="options">
    </d3-network>
  </div>
</template>

<script>  
import D3Network from 'vue-d3-network'

export default {
  name: 'app',
  components: {
    D3Network
  },
  data () {
    return {
      nodes: [
        { id: 1, name: 'my node 1' },
        { id: 2, name: 'my node 2' },
        { id: 3 },
        { id: 4 },
        { id: 5 },
        { id: 6 },
        { id: 7 },
        { id: 8 },
        { id: 9 },

      ],
      links: [
        { sid: 1, tid: 2 },
        { sid: 2, tid: 8 },
        { sid: 3, tid: 4 },
        { sid: 4, tid: 5 },
        { sid: 5, tid: 6 },
        { sid: 7, tid: 8 },
        { sid: 5, tid: 8 },
        { sid: 3, tid: 8 },
        { sid: 7, tid: 9 }
      ],
      options:
      {
        force: 3000,
        nodeSize: 10,
        nodeLabels: true
      }
    }
  },
}
</script>
<style src="vue-d3-network/dist/vue-d3-network.css"></style>
<style>
  html,
  body,
  #app {
    height: 100%;
  }
</style>
```

## Props
- net-nodes: Array of node objects: 
  - { 
      id: node id
      name: node name 
    }  
- net-links: Array of links objects: 
  - {
      **id**: *link id*
      **tid**: *id of target node*
      **sid**: *id of source node*
     }

- options:
  - {
      size: {
      w: Number
      h: Number
    },
    force: Number
    nodeSize: Number
    linkWidth: Number
    nodeLabels: Boolean
    }

## Events

- **node-click**: emits node id
- **link-click**: emits link id

## TODO
  - Touch support  


