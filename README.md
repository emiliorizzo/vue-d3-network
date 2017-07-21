# vue-d3-network
 > Vue component to graph networks using d3-force

![vue d3 network](vue-d3-network.png)

## Demo

[Demo](https://emiliorizzo.github.io/vue-d3-network/)

## Installation

``` bash
npm install vue-d3-network --save

```
## Usage

- [fiddle](https://jsfiddle.net/emii/ru24unsz/)
- [codePen](https://codepen.io/emilio/pen/mwYpbj)

```xml
  ...  
  <d3-network :net-nodes="nodes" :net-links="links" :options="options" />
  ...

```
``` javascript  
import D3Network from 'vue-d3-network'
...
  components: {
    D3Network
  },
....
```
``` html

<style src="vue-d3-network/dist/vue-d3-network.css"></style>

```

Or: *import source component from:* 'vue-d3-network/src/vue-d3-network.vue'
*And install devDependencies.* (d3-force, stylus and pug) 
See: [package.json](https://github.com/emiliorizzo/vue-d3-network/blob/master/package.json))

## Props

 **net-nodes**: Array *of nodes objects*.
  - Node Object:
   
    - **id**: node id. *If not provided uses array index*
    -  **name**: node name. *If not provided uses: 'node [node_id]'*
    - **color**: node color, e.g. *red*, *#aa00bb* 
      

 **net-links**: Array *of links objects*: 
    
  - **id**: link id. *If not provided uses array index*
  - **tid**: id of target node
  - **sid**: id of source node
     

**options**:

  - **size**: Object, *graph size*. **Default:** container size
      - **w**: Number
      - **h**: Number
 
 - **offset**: Object, *graph center offset* 
      - **x**: Number
      - **y**: Number

  - **force**: Number
  - **nodeSize**: Number, *node radius | size in px*
  - **linkWidth**: Number, *link thickness in px*
  - **nodeLabels**: Boolean, *show nodes names*
  - **fontSize**: Number, *for node labels, px*
  - **strLinks**: Boolean, *draw links as rect lines* 
    


## Events

- **node-click**:  *fired when click on node*, emits **(event,node-object)**
- **link-click**:  *fired when click on link*, emits **(event, link-id)**

## TODO
  - Touch support  


